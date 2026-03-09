/**
 * nodes/ingest-node.ts
 * LangGraph node: fetches all documents for an application from the DB,
 * runs the ingest pipeline on each, and fans out IngestResult objects
 * into the graph state keyed by document type.
 */

import { db } from '@/lib/db/config';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ingestDocument } from '@/lib/pipeline/ingestor';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';
import type { PDFDocumentType } from '@/lib/types';

export async function ingestNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const { appId } = state;
  await publishPipelineEvent(appId, 'ingest', 'processing');

  // ── Load all documents for this application from DB ──────────────────────
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.applicationId, appId));

  if (docs.length === 0) {
    console.warn('[ingest-node] No documents found for application', appId);
    await publishPipelineEvent(appId, 'ingest', 'done', { message: 'No documents found' });
    return {
      errors: [...(state.errors ?? []), 'No documents found for application'],
    };
  }

  console.log(`[ingest-node] Found ${docs.length} document(s) for ${appId}`);

  // ── Run ingest per document (sequential to avoid rate-limit bursts) ──────
  const ingestResultMap: CreditPipelineState['ingestResultMap'] = {};
  const errors: string[] = [...(state.errors ?? [])];

  for (const doc of docs) {
    if (!doc.s3Path) {
      console.warn(`[ingest-node] Document ${doc.id} (${doc.documentType}) has no file URL — skipping`);
      errors.push(`Document ${doc.id} (${doc.documentType}) has no file URL — skipping`);
      continue;
    }
    try {
      console.log(`[ingest-node] Ingesting ${doc.documentType} (${doc.id}) from ${doc.s3Path}`);
      const result = await ingestDocument({
        appId,
        documentId: doc.id,
        blobUrl: doc.s3Path,
        documentType: doc.documentType as PDFDocumentType,
      });
      console.log(`[ingest-node] ✓ ${doc.documentType} ingested (confidence: ${result.confidence})`);
      // Store last result per document type (if multiple, last wins)
      ingestResultMap[doc.documentType as PDFDocumentType] = result;
    } catch (e) {
      console.error(`[ingest-node] ✗ Ingest failed for ${doc.documentType}:`, (e as Error).message);
      errors.push(`Ingest failed for ${doc.documentType} (${doc.id}): ${(e as Error).message}`);
    }
  }

  await publishPipelineEvent(appId, 'ingest', 'done', {
    documentCount: docs.length,
    ingestedCount: Object.keys(ingestResultMap).length,
  });

  return { ingestResultMap, errors };
}

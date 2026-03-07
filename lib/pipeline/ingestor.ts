import { redis, redisKeys } from '@/lib/redis';
import { db } from '@/lib/db/config';
import { extractionStates } from '@/lib/db/schema';
import { detectPdfType } from './pdf-detector';
import { ingestDigital } from './ingestor-digital';
import { ingestScanned } from './ingestor-scanned';
import type { PDFDocumentType } from '@/lib/types';

export interface IngestOptions {
  appId: string;
  documentId: string;
  blobUrl: string;
  documentType: PDFDocumentType;
}

export interface IngestResult {
  appId: string;
  documentId: string;
  documentType: PDFDocumentType;
  pdfType: 'digital' | 'scanned';
  extractedData: Record<string, unknown>;
  confidence: number;
  rawContent: string;
  pageCount: number;
  modelUsed: string;
}

/**
 * Main ingest orchestrator.
 *
 * 1. Fetches the PDF from Vercel Blob.
 * 2. Detects whether it is digital or scanned.
 * 3. Routes to the appropriate ingestor (Gemini native / Mistral OCR).
 * 4. Writes progress to Redis + extraction_states table (durable fallback).
 * 5. Returns the full extraction result.
 */
export async function ingestDocument(opts: IngestOptions): Promise<IngestResult> {
  const { appId, documentId, blobUrl, documentType } = opts;
  const stateKey = redisKeys.extractionState(appId, documentId);

  await writeRedisState(stateKey, 'processing');
  await insertExtractionState(appId, 'pdf_detection', 'processing');

  try {
    // ── Fetch PDF bytes ────────────────────────────────────────────────────
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from blob storage: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Detect digital vs scanned ─────────────────────────────────────────
    const detection = await detectPdfType(buffer);
    await updateExtractionState(appId, 'pdf_detection', 'done');

    let result: IngestResult;

    if (detection.type === 'digital') {
      // ── Path A: Gemini 2.5 Flash native PDF ──────────────────────────────
      await insertExtractionState(appId, 'gemini_native', 'processing');
      await writeRedisState(stateKey, 'processing', { stage: 'gemini_native' });

      const extracted = await ingestDigital(buffer, documentType, detection.pageCount);

      await insertExtractionState(appId, 'gemini_native', 'done');

      result = {
        appId,
        documentId,
        documentType,
        pdfType: 'digital',
        extractedData: extracted.extractedData,
        confidence: extracted.confidence,
        rawContent: extracted.rawText,
        pageCount: detection.pageCount,
        modelUsed: extracted.modelUsed,
      };
    } else {
      // ── Path B: Mistral OCR → optional LlamaParse JSON ──────────────────
      await insertExtractionState(appId, 'ocr', 'processing');
      await writeRedisState(stateKey, 'processing', { stage: 'ocr' });

      const extracted = await ingestScanned(blobUrl, documentType, detection.pageCount);

      await insertExtractionState(appId, 'ocr', 'done');
      if (extracted.usedLlamaParse) {
        await insertExtractionState(appId, 'llama_parse', 'done');
      }

      result = {
        appId,
        documentId,
        documentType,
        pdfType: 'scanned',
        extractedData: extracted.extractedData,
        confidence: extracted.confidence,
        rawContent: extracted.markdownContent,
        pageCount: detection.pageCount,
        modelUsed: extracted.modelUsed,
      };
    }

    // ── Write final state ─────────────────────────────────────────────────
    await writeRedisState(stateKey, 'done', result);

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await writeRedisState(stateKey, 'failed', null, msg);
    await insertExtractionState(appId, 'pdf_detection', 'failed', msg);
    throw error;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeRedisState(
  key: string,
  status: string,
  data?: unknown,
  error?: string,
) {
  if (!redis) return; // Redis not configured — skip silently
  try {
    await redis.hset(key, {
      status,
      updatedAt: new Date().toISOString(),
      ...(data != null ? { data: JSON.stringify(data) } : {}),
      ...(error ? { error } : {}),
    });
  } catch (e) {
    console.warn('[ingestor] Redis write failed (non-fatal):', e);
  }
}

async function insertExtractionState(
  appId: string,
  stage: string,
  status: 'processing' | 'done' | 'failed',
  errorMessage?: string,
) {
  try {
    await db.insert(extractionStates).values({
      applicationId: appId,
      stage: stage as 'pdf_detection' | 'ocr' | 'llama_parse' | 'gemini_native',
      status: status as 'processing' | 'done' | 'failed',
      startedAt: status === 'processing' ? new Date() : undefined,
      completedAt: status !== 'processing' ? new Date() : undefined,
      errorMessage,
    });
  } catch (e) {
    // Non-fatal — DB state tracking is best-effort
    console.warn('[ingestor] DB state write failed (non-fatal):', e);
  }
}

// updateExtractionState = alias for marking a stage done
async function updateExtractionState(
  appId: string,
  stage: string,
  status: 'done' | 'failed',
) {
  await insertExtractionState(appId, stage, status);
}

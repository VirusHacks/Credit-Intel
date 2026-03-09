import { Mistral } from '@mistralai/mistralai';
import type { PDFDocumentType } from '@/lib/types';

// Table-heavy document types that benefit from LlamaParse JSON mode
// (preserves cell structure in GST grids, balance sheet rows, etc.)
const TABLE_HEAVY_TYPES = new Set<PDFDocumentType>([
  'gst_return',
  'itr',
  'financial_statement',
  'annual_report',
]);

export interface ScannedExtractionResult {
  documentType: PDFDocumentType;
  markdownContent: string;
  tableJson: unknown;
  extractedData: Record<string, unknown>;
  confidence: number;
  pageCount: number;
  modelUsed: 'mistral-ocr-latest';
  usedLlamaParse: boolean;
}

/**
 * Ingest a scanned (image-only) PDF using Mistral OCR.
 * For table-heavy documents (GST, ITR, balance sheets), LlamaParse JSON mode
 * is additionally called to preserve cell structure.
 *
 * Uses the Vercel Blob URL directly — avoids large base64 payloads.
 */
export async function ingestScanned(
  blobUrl: string,
  documentType: PDFDocumentType,
  pageCount: number,
): Promise<ScannedExtractionResult> {
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) throw new Error('MISTRAL_API_KEY is not configured');

  const client = new Mistral({ apiKey: mistralKey });

  // ── Step 1: Mistral OCR → Markdown ──────────────────────────────────────
  const ocrResponse = await client.ocr.process({
    model: 'mistral-ocr-latest',
    document: {
      type: 'document_url',
      documentUrl: blobUrl,
    },
  });

  // Collect all page markdown separated by page dividers
  const pages = (ocrResponse as { pages?: { markdown: string }[] }).pages ?? [];
  const markdownContent = pages
    .map((p, i) => `<!-- Page ${i + 1} -->\n${p.markdown}`)
    .join('\n\n---\n\n');

  // ── Step 2: LlamaParse JSON mode (table-heavy types only) ────────────────
  let tableJson: unknown = null;
  let usedLlamaParse = false;

  if (TABLE_HEAVY_TYPES.has(documentType) && process.env.LLAMAPARSE_API_KEY) {
    try {
      tableJson = await extractTablesWithLlamaParse(
        blobUrl,
        process.env.LLAMAPARSE_API_KEY,
      );
      usedLlamaParse = true;
    } catch (err) {
      // Non-critical: fall back to Mistral OCR markdown only
      console.warn('[ingestor-scanned] LlamaParse failed, using Mistral only:', err);
    }
  }

  // ── Confidence heuristic ─────────────────────────────────────────────────
  // More markdown content → higher confidence the OCR captured the document
  const confidence = markdownContent.length > 500 ? 0.83 : markdownContent.length > 100 ? 0.65 : 0.4;

  return {
    documentType,
    markdownContent,
    tableJson,
    extractedData: {
      markdown: markdownContent,
      tables: tableJson,
      page_count: pageCount,
    },
    confidence,
    pageCount,
    modelUsed: 'mistral-ocr-latest',
    usedLlamaParse,
  };
}

// ─── LlamaParse JSON table extraction ────────────────────────────────────────
async function extractTablesWithLlamaParse(
  blobUrl: string,
  apiKey: string,
): Promise<unknown> {
  const BASE = 'https://api.cloud.llamaindex.ai/api/v1/parsing';

  // Submit URL-based parsing job
  const uploadRes = await fetch(`${BASE}/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: blobUrl,
      result_type: 'json',
    }),
  });

  if (!uploadRes.ok) {
    throw new Error(`LlamaCloud upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const { id: jobId } = (await uploadRes.json()) as { id: string };

  // Poll for result — max 60 s (30 × 2 s)
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`${BASE}/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const { status } = (await statusRes.json()) as { status: string };

    if (status === 'SUCCESS') {
      const resultRes = await fetch(`${BASE}/job/${jobId}/result/json`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return resultRes.json();
    }

    if (status === 'ERROR' || status === 'CANCELLED') {
      throw new Error(`LlamaParse job ended with status: ${status}`);
    }
  }

  throw new Error('LlamaParse timed out after 60 seconds');
}

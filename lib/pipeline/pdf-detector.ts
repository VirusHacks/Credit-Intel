import { PDFDocument } from 'pdf-lib';

export type PDFType = 'digital' | 'scanned';

export interface PDFDetectionResult {
  type: PDFType;
  pageCount: number;
  /** Proportion of pages estimated to have embedded text (0–1) */
  digitalRatio: number;
  btOperatorsFound: number;
}

/**
 * Detects whether a PDF is "digital" (has embedded selectable text)
 * or "scanned" (image-only pages, needs OCR).
 *
 * Strategy: count `BT` (Begin Text) operators in the raw PDF byte stream.
 * Digital PDFs have many BT operators (text lines, headers, footers).
 * Scanned PDFs contain mostly image XObjects with minimal/zero BT operators.
 *
 * Threshold: ≥ 5 BT operators per page → digital.
 */
export async function detectPdfType(buffer: Buffer): Promise<PDFDetectionResult> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = Math.max(doc.getPageCount(), 1);

  // Scan raw bytes for BT (Begin Text) operators.
  // Use latin1 so every byte maps 1:1 — no UTF-8 decoding issues.
  const raw = buffer.toString('latin1');
  const btOperatorsFound = (raw.match(/\bBT\b/g) ?? []).length;

  const btPerPage = btOperatorsFound / pageCount;

  // ≥ 5 BT per page → treat as digital; otherwise send to OCR pipeline.
  const type: PDFType = btPerPage >= 5 ? 'digital' : 'scanned';
  const digitalRatio = Math.min(btPerPage / 10, 1); // normalize to 0–1

  return { type, pageCount, digitalRatio, btOperatorsFound };
}

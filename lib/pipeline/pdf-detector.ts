import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef } from 'pdf-lib';

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
 * Strategy A (primary): Check if any page's Resources dictionary has a /Font
 * entry. Only digital PDFs embed fonts.
 *
 * Strategy B (fallback): Search decompressed stream bytes for BT operators
 * in the raw PDF byte slice (works for uncompressed streams).
 */
export async function detectPdfType(buffer: Buffer): Promise<PDFDetectionResult> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = Math.max(doc.getPageCount(), 1);

  let pagesWithFonts = 0;

  for (let i = 0; i < pageCount; i++) {
    const page = doc.getPage(i);
    // Walk up the resource hierarchy (page-level → inherited)
    const resourcesObj = page.node.lookup(PDFName.of('Resources'));
    if (resourcesObj instanceof PDFDict) {
      const fontEntry = resourcesObj.lookup(PDFName.of('Font'));
      if (fontEntry) {
        pagesWithFonts++;
      }
    }
  }

  // If ANY page has fonts → treat whole document as digital.
  // (Mixed scan+text docs are uncommon in corporate lending.)
  const hasFonts = pagesWithFonts > 0;

  // Fallback: raw byte scan for uncompressed streams
  const raw = buffer.toString('latin1');
  const btMatch = raw.match(/\bBT\b/g) ?? [];
  const btOperatorsFound = btMatch.length;

  const type: PDFType = (hasFonts || btOperatorsFound >= 5) ? 'digital' : 'scanned';
  const digitalRatio = hasFonts ? Math.max(pagesWithFonts / pageCount, 0.5) : Math.min(btOperatorsFound / (pageCount * 10), 1);

  return { type, pageCount, digitalRatio, btOperatorsFound };
}

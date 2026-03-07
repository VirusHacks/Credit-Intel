import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/pipeline/ingestor';
import type { PDFDocumentType } from '@/lib/types';

const VALID_DOC_TYPES = new Set<string>([
  'bank_statement',
  'gst_return',
  'itr',
  'annual_report',
  'cibil_report',
  'financial_statement',
  'sanction_letter',
  'other',
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appId?: string;
      documentId?: string;
      blobUrl?: string;
      documentType?: string;
    };

    const { appId, documentId, blobUrl, documentType } = body;

    if (!appId || !documentId || !blobUrl || !documentType) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: appId, documentId, blobUrl, documentType',
        },
        { status: 400 },
      );
    }

    if (!VALID_DOC_TYPES.has(documentType)) {
      return NextResponse.json(
        { error: `Invalid documentType: ${documentType}` },
        { status: 400 },
      );
    }

    const result = await ingestDocument({
      appId,
      documentId,
      blobUrl,
      documentType: documentType as PDFDocumentType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/pipeline/ingest] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Ingestion failed',
      },
      { status: 500 },
    );
  }
}

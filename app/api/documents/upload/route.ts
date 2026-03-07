import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db/config';
import { documents } from '@/lib/db/schema';

const VALID_DOC_TYPES = [
  'bank_statement',
  'gst_return',
  'itr',
  'annual_report',
  'cibil_report',
  'financial_statement',
  'sanction_letter',
  'other',
] as const;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;
    const applicationId = formData.get('applicationId') as string | null;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 },
      );
    }
    const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large — maximum is 50 MB' },
        { status: 400 },
      );
    }
    if (!documentType || !VALID_DOC_TYPES.includes(documentType as never)) {
      return NextResponse.json(
        {
          error: `Invalid documentType. Must be one of: ${VALID_DOC_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // ── Upload to Vercel Blob ────────────────────────────────────────────────
    if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'VERCEL_BLOB_READ_WRITE_TOKEN not configured' },
        { status: 503 },
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const blob = await put(`documents/${Date.now()}-${safeName}`, file, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // ── Optional DB insert (if applicationId is already known) ───────────────
    let documentId: string | undefined;
    if (applicationId) {
      const [doc] = await db
        .insert(documents)
        .values({
          applicationId,
          fileName: file.name,
          fileType: 'application/pdf',
          documentType: documentType as 'bank_statement' | 'gst_return' | 'itr' | 'annual_report' | 'cibil_report' | 'financial_statement' | 'sanction_letter' | 'other',
          fileSize: file.size,
          s3Path: blob.url,
        })
        .returning({ id: documents.id });
      documentId = doc.id;
    }

    return NextResponse.json({
      documentId,
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      documentType,
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cam/download/[id]
 * Streams a CAM PDF back to the browser.
 *
 * Production: pdfBlobUrl is a Vercel Blob public URL — redirect to it.
 * Dev:        pdfBlobUrl starts with /api/cam/download/... with ?file query param
 *             — serve directly from local tmp/cam/ directory.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/config';
import { camOutputs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: appId } = await params;
  const url = new URL(request.url);
  const fileParam = url.searchParams.get('file');

  // Dev path: serve from local tmp
  if (fileParam) {
    const safeName = path.basename(fileParam); // sanitise — no path traversal
    const filePath = path.join(process.cwd(), 'tmp', 'cam', safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CAM_${appId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // Production path: look up stored blob URL and redirect
  const [cam] = await db
    .select({ pdfBlobUrl: camOutputs.pdfBlobUrl })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, appId))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  if (!cam?.pdfBlobUrl) {
    return NextResponse.json({ error: 'CAM PDF not generated yet' }, { status: 404 });
  }

  // For external blob URLs (Vercel Blob), redirect; local paths served above
  if (cam.pdfBlobUrl.startsWith('http')) {
    return NextResponse.redirect(cam.pdfBlobUrl);
  }

  // Unexpected state
  return NextResponse.json({ error: 'Invalid PDF storage URL' }, { status: 500 });
}

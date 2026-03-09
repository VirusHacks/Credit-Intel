/**
 * POST /api/cam/generate
 * Body: { appId: string }
 * Triggers full CAM generation: reconciler → PDF → cam_outputs.pdfBlobUrl
 * Returns: { pdfUrl, decision, recommendedAmountInr, recommendedRatePercent }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateCAM } from '@/lib/agents/cam-generator';

export async function POST(request: NextRequest) {
  let body: { appId?: string };
  try {
    body = await request.json() as { appId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { appId } = body;
  if (!appId) {
    return NextResponse.json({ error: 'appId is required' }, { status: 400 });
  }

  // Verify application exists
  const [app] = await db
    .select({ id: applications.id, pipelineStatus: applications.pipelineStatus })
    .from(applications)
    .where(eq(applications.id, appId))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Set status to reconciling immediately
  await db
    .update(applications)
    .set({ pipelineStatus: 'reconciling' })
    .where(eq(applications.id, appId));

  try {
    const { pdfUrl, camData } = await generateCAM(appId);

    return NextResponse.json({
      pdfUrl,
      decision: camData.recommendation.decision,
      recommendedAmountInr: camData.recommendation.recommendedAmountInr,
      recommendedRatePercent: camData.recommendation.recommendedRatePercent,
      generatedAt: camData.generatedAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CAM generation failed';
    console.error('CAM generate error:', message);

    await db
      .update(applications)
      .set({ pipelineStatus: 'failed' })
      .where(eq(applications.id, appId));

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

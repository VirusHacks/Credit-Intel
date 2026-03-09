/**
 * POST /api/applications/[id]/skip-qualify
 * Marks qualitativeGateDone = true so the pipeline can proceed
 * past the qualitative input gate (for testing / demo purposes).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateCAM } from '@/lib/agents/cam-generator';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await context.params;

  if (!appId) {
    return NextResponse.json({ error: 'Missing application id' }, { status: 400 });
  }

  try {
    const rows = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.id, appId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await db
      .update(applications)
      .set({
        qualitativeGateDone: true,
        pipelineStatus: 'reconciling',
        updatedAt: new Date(),
      })
      .where(eq(applications.id, appId));

    console.log(`[skip-qualify] Marked qualitative gate done for ${appId}, triggering CAM`);

    // Auto-trigger reconciler + CAM generation (fire-and-forget)
    generateCAM(appId)
      .then(() => console.log(`[skip-qualify] CAM generation complete for ${appId}`))
      .catch(async (err: unknown) => {
        console.error(`[skip-qualify] CAM generation failed for ${appId}:`, err);
        await db.update(applications)
          .set({ pipelineStatus: 'failed' })
          .where(eq(applications.id, appId))
          .catch(() => {});
      });

    return NextResponse.json({ success: true, appId, camTriggered: true });
  } catch (err) {
    console.error('[skip-qualify] Error:', err);
    return NextResponse.json(
      { error: 'Failed to skip qualification' },
      { status: 500 },
    );
  }
}

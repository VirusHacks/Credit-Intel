/**
 * app/api/pipeline/run/route.ts
 * POST endpoint to launch the full LangGraph credit analysis pipeline
 * for a given application.
 *
 * Body: { appId: string; companyName: string; promoterName?: string }
 *
 * The pipeline runs asynchronously — this route kicks it off and returns
 * immediately with { status: 'started', appId }.
 * Consumers subscribe to /api/pipeline/status/[id] for live SSE progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { runCreditPipeline } from '@/lib/pipeline/graph';
import { generateCAM } from '@/lib/agents/cam-generator';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appId?: string;
      companyName?: string;
      promoterName?: string;
    };

    const { appId, companyName, promoterName } = body;

    if (!appId) {
      return NextResponse.json(
        { error: 'Missing required field: appId' },
        { status: 400 },
      );
    }

    // ── Validate application exists ────────────────────────────────────────
    const rows = await db
      .select({ id: applications.id, pipelineStatus: applications.pipelineStatus })
      .from(applications)
      .where(eq(applications.id, appId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = rows[0];

    // Resolve companyName from DB if not provided
    let resolvedCompanyName = companyName ?? '';
    if (!resolvedCompanyName) {
      const companyRows = await db
        .select({ name: companies.name })
        .from(applications)
        .innerJoin(companies, eq(applications.companyId, companies.id))
        .where(eq(applications.id, appId))
        .limit(1);
      resolvedCompanyName = companyRows[0]?.name ?? 'Unknown Company';
    }

    // Prevent concurrent runs only for truly in-flight states
    // ('ingesting' alone is NOT guarded — it may be a stale status from a failed prior attempt)
    if (app.pipelineStatus === 'analyzing' || app.pipelineStatus === 'reconciling' || app.pipelineStatus === 'generating_cam') {
      return NextResponse.json(
        { error: 'Pipeline already running for this application', status: app.pipelineStatus },
        { status: 409 },
      );
    }

    // ── Mark pipeline as started ───────────────────────────────────────────
    await db
      .update(applications)
      .set({ pipelineStatus: 'ingesting', analysisProgress: 0, updatedAt: new Date() })
      .where(eq(applications.id, appId));

    if (redis) {
      // Clear stale stage data from previous (possibly failed) run
      await redis.del(redisKeys.pipelineStages(appId)).catch(() => {});
      await redis
        .set(redisKeys.pipelineState(appId), JSON.stringify({
          status: 'ingesting',
          startedAt: Date.now(),
          companyName: resolvedCompanyName,
          promoterName,
        }))
        .catch(() => {/* non-fatal */});
    }

    // ── Launch pipeline asynchronously (fire-and-forget) ──────────────────
    // We do NOT await here so the HTTP response returns immediately.
    console.log(`[pipeline/run] ▶ Starting pipeline for ${appId} (${resolvedCompanyName})`);
    runCreditPipeline({ appId, companyName: resolvedCompanyName, promoterName })
      .then(async (finalState) => {
        console.log(`[pipeline/run] ✓ Pipeline completed for ${appId}`, {
          errors: finalState.errors?.length ?? 0,
          awaitingQualitative: finalState.awaitingQualitative,
          hasBank: !!finalState.bankAnalysis,
          hasGst: !!finalState.gstAnalysis,
          hasItr: !!finalState.itrAnalysis,
          hasCibil: !!finalState.cibilAnalysis,
          hasScout: !!finalState.scoutAnalysis,
        });
        const hasErrors = finalState.errors.length > 0;

        if (finalState.awaitingQualitative) {
          // Gate not yet done — wait for underwriter input
          const completedAgents = [
            finalState.bankAnalysis, finalState.gstAnalysis, finalState.itrAnalysis,
            finalState.cibilAnalysis, finalState.scoutAnalysis,
          ].filter(Boolean).length;
          const progress = Math.round((1 + completedAgents + 1) / 9 * 100);
          try {
            await db.update(applications)
              .set({ pipelineStatus: 'awaiting_qualitative', analysisProgress: progress, updatedAt: new Date() })
              .where(eq(applications.id, appId));
            console.log(`[pipeline/run] ✓ DB updated: awaiting_qualitative`);
          } catch (dbErr) {
            console.error(`[pipeline/run] ✗ DB update failed:`, dbErr);
          }
        } else if (hasErrors) {
          await db.update(applications)
            .set({ pipelineStatus: 'failed', updatedAt: new Date() })
            .where(eq(applications.id, appId))
            .catch(() => {});
        } else {
          // Gate already done (qualitativeGateDone=true) — proceed directly to CAM
          console.log(`[pipeline/run] Gate already done, triggering CAM for ${appId}`);
          await db.update(applications)
            .set({ pipelineStatus: 'reconciling', updatedAt: new Date() })
            .where(eq(applications.id, appId))
            .catch(() => {});
          generateCAM(appId)
            .then(() => console.log(`[pipeline/run] ✓ CAM generation complete for ${appId}`))
            .catch(async (err: unknown) => {
              console.error(`[pipeline/run] ✗ CAM generation failed:`, err);
              await db.update(applications)
                .set({ pipelineStatus: 'failed' })
                .where(eq(applications.id, appId))
                .catch(() => {});
            });
        }

        if (redis) {
          await redis
            .set(redisKeys.pipelineState(appId), JSON.stringify({
              status: finalState.awaitingQualitative ? 'awaiting_qualitative' : 'reconciling',
              completedAt: Date.now(),
            }))
            .catch(() => {});
        }
      })
      .catch(async (err: Error) => {
        console.error(`[pipeline/run] ✗ Pipeline failed for ${appId}:`, err.message, err.stack);
        await db
          .update(applications)
          .set({ pipelineStatus: 'failed', updatedAt: new Date() })
          .where(eq(applications.id, appId))
          .catch(() => {/* non-fatal */});

        if (redis) {
          await redis
            .set(redisKeys.pipelineState(appId), JSON.stringify({
              status: 'failed',
              failedAt: Date.now(),
              error: err.message,
            }))
            .catch(() => {/* non-fatal */});
        }
      });

    return NextResponse.json({ status: 'started', appId }, { status: 202 });
  } catch (err) {
    console.error('[pipeline/run] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: (err as Error).message },
      { status: 500 },
    );
  }
}

/**
 * app/api/pipeline/status/[id]/route.ts
 * Server-Sent Events endpoint for real-time pipeline progress.
 *
 * Subscribes to Redis pub/sub channel `pipeline:events:{appId}` and
 * streams JSON events to the browser as SSE messages.
 *
 * Clients consume this as:
 *   const es = new EventSource(`/api/pipeline/status/${appId}`);
 *   es.onmessage = (e) => console.log(JSON.parse(e.data));
 *
 * Events shape: PipelineEvent (from lib/types.ts)
 * {
 *   appId: string;
 *   stage: string;
 *   status: 'processing' | 'done' | 'failed';
 *   progress?: number;
 *   message?: string;
 * }
 */

import { NextRequest } from 'next/server';
import { redis, redisKeys } from '@/lib/redis';
import { db } from '@/lib/db/config';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Maximum number of seconds to keep an SSE connection open (Vercel limit = 60s)
const MAX_DURATION_MS = 55_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await context.params;

  if (!appId) {
    return new Response('Missing application id', { status: 400 });
  }

  // ── Verify application exists ────────────────────────────────────────────
  const rows = await db
    .select({ pipelineStatus: applications.pipelineStatus })
    .from(applications)
    .where(eq(applications.id, appId))
    .limit(1)
    .catch(() => []);

  if (rows.length === 0) {
    return new Response('Application not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  // Helper: encode a single SSE message
  function sseMsg(data: unknown): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  // ── Graceful fallback: Redis not configured ──────────────────────────────
  // Send a single status snapshot from the DB and close the stream.
  if (!redis) {
    const snap = {
      appId,
      stage: 'status',
      status: rows[0].pipelineStatus ?? 'not_started',
      message: 'Real-time streaming unavailable (Redis not configured)',
    };
    const body = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(sseMsg(snap));
        ctrl.close();
      },
    });
    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // ── Subscribe to Redis pub/sub channel ───────────────────────────────────
  // Upstash Redis REST client doesn't support native subscribe() — we use
  // polling on the pipeline state key every 1.5 s as a lightweight substitute
  // and push events downstream.  This gracefully handles Vercel serverless.

  let closed = false;
  request.signal.addEventListener('abort', () => { closed = true; });

  const body = new ReadableStream({
    async start(controller) {
      const deadline = Date.now() + MAX_DURATION_MS;

      // Send initial status immediately
      try {
        const stateRaw = await redis!.get<string>(redisKeys.pipelineState(appId));
        const pipelineState = stateRaw
          ? (typeof stateRaw === 'string' ? JSON.parse(stateRaw) : stateRaw)
          : null;

        controller.enqueue(sseMsg({
          appId,
          stage: 'init',
          status: pipelineState?.status ?? rows[0].pipelineStatus ?? 'not_started',
          message: 'Connected to pipeline status stream',
        }));

        // Send cached per-stage data immediately (no 1.5s wait)
        const cachedStages = await redis!.hgetall(redisKeys.pipelineStages(appId));
        if (cachedStages) {
          for (const [stageName, rawValue] of Object.entries(cachedStages)) {
            const stageData: Record<string, unknown> =
              typeof rawValue === 'string' ? JSON.parse(rawValue) : (rawValue as Record<string, unknown>);
            controller.enqueue(sseMsg({
              appId,
              stage: stageName,
              status: stageData.status,
              message: stageData.message ?? stageData.status,
              ts: stageData.ts ?? Date.now(),
            }));
          }
        }

        // ── Short-circuit: pipeline already in a terminal state ──────────────
        // No need to enter the polling loop — send end event and close.
        const currentStatus = pipelineState?.status ?? rows[0].pipelineStatus;
        if (currentStatus === 'complete' || currentStatus === 'failed') {
          controller.enqueue(sseMsg({
            appId,
            stage: 'end',
            status: currentStatus,
            message: 'Pipeline reached terminal state',
          }));
          controller.close();
          closed = true;
          return;
        }
      } catch {
        // Non-fatal — skip the initial snapshot
      }

      // Poll for signal updates
      let lastSignalsHash = '';
      let lastStagesHash = '';

      while (!closed && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));

        if (closed) break;

        try {
          // 1. Get pipeline state
          const stateRaw = await redis!.get<string>(redisKeys.pipelineState(appId));
          const state = stateRaw
            ? (typeof stateRaw === 'string' ? JSON.parse(stateRaw) : stateRaw)
            : null;

          // 2. Get per-stage statuses (written by publishPipelineEvent)
          const stages = await redis!.hgetall(redisKeys.pipelineStages(appId));
          if (stages) {
            const stagesHash = JSON.stringify(stages);
            if (stagesHash !== lastStagesHash) {
              lastStagesHash = stagesHash;
              for (const [stageName, rawValue] of Object.entries(stages)) {
                const stageData: Record<string, unknown> =
                  typeof rawValue === 'string' ? JSON.parse(rawValue) : (rawValue as Record<string, unknown>);
                controller.enqueue(sseMsg({
                  appId,
                  stage: stageName,
                  status: stageData.status,
                  message: stageData.message ?? stageData.status,
                  ts: stageData.ts ?? Date.now(),
                }));
              }
            }
          }

          // 3. Terminal state check
          if (state) {
            if (
              state.status === 'complete' ||
              state.status === 'failed'
            ) {
              controller.enqueue(sseMsg({
                appId,
                stage: 'end',
                status: state.status,
                message: 'Pipeline reached terminal state',
              }));
              controller.close();
              closed = true;
              return;
            }
          }

          // 4. Get signals blackboard (agent outputs)
          const signals = await redis!.hgetall(redisKeys.signals(appId));
          if (signals) {
            const sigHash = JSON.stringify(Object.keys(signals).sort());
            if (sigHash !== lastSignalsHash) {
              lastSignalsHash = sigHash;
              controller.enqueue(sseMsg({
                appId,
                stage: 'signals',
                status: 'done',
                signals,
              }));
            }
          }
        } catch {
          // Non-fatal polling error — keep going
        }
      }

      // Timeout: send a heartbeat or close
      if (!closed) {
        controller.enqueue(sseMsg({
          appId,
          stage: 'timeout',
          status: 'processing',
          message: 'Reconnect to continue monitoring',
        }));
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',    // Disable Nginx buffering
    },
  });
}

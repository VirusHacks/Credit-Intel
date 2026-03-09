import { Redis } from '@upstash/redis';

// Gracefully degrade if Redis is not configured yet (during dev)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };

// ─── Typed Redis key helpers ──────────────────────────────────────────────────
export const redisKeys = {
  /** Per-document extraction state: digital/scanned, progress */
  extractionState: (appId: string, docId: string) =>
    `extraction_state:${appId}:${docId}`,

  /** Per-application pipeline state: current stage, completedAgents[] */
  pipelineState: (appId: string) => `pipeline_state:${appId}`,

  /** Per-application agent signals blackboard (all agent outputs) */
  signals: (appId: string) => `signals:${appId}`,

  /** SSE Pub/Sub channel per application for live progress feed */
  pipelineEvents: (appId: string) => `pipeline:events:${appId}`,

  /** Per-stage status hash (pollable by SSE endpoint) */
  pipelineStages: (appId: string) => `pipeline_stages:${appId}`,
};

/**
 * base-agent.ts
 * Shared Gemini client, output envelope, and Redis/DB signal-write helpers
 * used by all financial analysis agents.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/config';
import { agentSignals } from '@/lib/db/schema';
import { redis, redisKeys } from '@/lib/redis';
import type { AgentName, AgentSignal } from '@/lib/types';
import type { IngestResult } from '@/lib/pipeline/ingestor';

// ─── Gemini client (shared, lazily initialised) ───────────────────────────────
let _genai: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    _genai = new GoogleGenerativeAI(key);
  }
  return _genai;
}

export function getModel(modelName?: string) {
  const name = modelName ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  return getGenAI().getGenerativeModel({ model: name });
}

// ─── Standard agent output envelope ──────────────────────────────────────────
export interface AgentOutput<T = Record<string, unknown>> {
  agentName: AgentName;
  appId: string;
  signals: AgentSignal[];
  analysis: T;
  confidence: number;        // 0–1 aggregate
  flags: AgentFlag[];
  modelUsed: string;
}

export interface AgentFlag {
  key: string;
  severity: 'INFO' | 'FLAG' | 'RED_FLAG';
  message: string;
}

// ─── Shared prompt template ───────────────────────────────────────────────────
export function buildAnalysisPrompt(
  agentRole: string,
  extractedJson: string,
  signalSchema: string,
  indianContext: string,
): string {
  return `You are ${agentRole} for an Indian corporate credit underwriting system.

## EXTRACTED DOCUMENT DATA
\`\`\`json
${extractedJson}
\`\`\`

## YOUR TASK
Analyse the data above and compute the financial signals described below.
Return ONLY a valid JSON object (no markdown fences, no commentary) matching
the schema exactly.

## OUTPUT SCHEMA
${signalSchema}

## INDIAN LENDING CONTEXT
${indianContext}

Rules:
- All monetary values must be in INR (lakhs unless stated otherwise).
- Compute derived ratios exactly as specified; do not approximate.
- If a value cannot be determined from the data, use null.
- confidence must be 0.0–1.0 (overall confidence in this analysis).
- flags[] must only include items that genuinely warrant attention.
`;
}

// ─── Call Gemini and parse JSON ───────────────────────────────────────────────
export async function callGeminiForAnalysis<T>(prompt: string): Promise<T> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Gemini returned non-JSON for analysis: ${cleaned.slice(0, 200)}`);
  }
}

// ─── Persist signals to Redis blackboard + DB ─────────────────────────────────
export async function persistSignals(
  appId: string,
  agentName: AgentName,
  rawSignals: Array<{
    key: string;
    value: unknown;
    confidence: number;
    rawSnippet?: string;
  }>,
): Promise<AgentSignal[]> {
  const signals: AgentSignal[] = rawSignals.map((s) => ({
    applicationId: appId,
    agentName,
    signalKey: s.key,
    signalValue: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
    confidence: s.confidence,
    rawSnippet: s.rawSnippet,
    isUnverified: s.confidence < 0.75,
  }));

  // ── Write to Redis blackboard (hset on signals:{appId}) ──────────────────
  if (redis) {
    try {
      const flat: Record<string, string> = {};
      for (const sig of signals) {
        flat[`${agentName}:${sig.signalKey}`] = JSON.stringify({
          value: sig.signalValue,
          confidence: sig.confidence,
          isUnverified: sig.isUnverified,
        });
      }
      await redis.hset(redisKeys.signals(appId), flat);
    } catch (e) {
      console.warn('[base-agent] Redis signals write failed (non-fatal):', e);
    }
  }

  // ── Write to DB (agent_signals table) ────────────────────────────────────
  try {
    await db.insert(agentSignals).values(
      signals.map((s) => ({
        applicationId: appId,
        agentName: s.agentName,
        signalKey: s.signalKey,
        signalValue: s.signalValue,
        confidence: String(s.confidence),
        rawSnippet: s.rawSnippet,
        isUnverified: s.isUnverified,
      })),
    );
  } catch (e) {
    console.warn('[base-agent] DB signals write failed (non-fatal):', e);
  }

  return signals;
}

// ─── Stage name normalization: agents use internal names, frontend expects canonical names
const STAGE_NAME_MAP: Record<string, string> = {
  agent_bank: 'bank_statement',
  agent_gst: 'gst_analyzer',
  agent_itr: 'itr_balancesheet',
  agent_cibil: 'cibil_cmr',
};

// ─── Publish a pipeline event to Redis (pollable hash + pub/sub) ──────────────
export async function publishPipelineEvent(
  appId: string,
  stage: string,
  status: 'processing' | 'done' | 'failed',
  extra?: Record<string, unknown>,
) {
  if (!redis) return;
  const normalizedStage = STAGE_NAME_MAP[stage] ?? stage;

  // Write to per-stage hash so the SSE endpoint can poll it
  try {
    await redis.hset(redisKeys.pipelineStages(appId), {
      [normalizedStage]: JSON.stringify({ status, ts: Date.now(), ...extra }),
    });
  } catch {
    // Non-fatal
  }
}

// ─── Helper: safely read a numeric value from extracted data ──────────────────
export function safeNum(data: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = data[key];
    if (v !== undefined && v !== null) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

// ─── Helper: get IngestResult extracted data safely ──────────────────────────
export function extractedData(result: IngestResult): Record<string, unknown> {
  return result.extractedData ?? {};
}

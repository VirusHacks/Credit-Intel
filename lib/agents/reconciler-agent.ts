/**
 * reconciler-agent.ts
 * Gemini 2.5 Flash reconciliation layer that:
 *   1. Reads all agent signals + qualitative notes + research findings
 *   2. Runs the 7-check discrepancy engine
 *   3. Builds a rich context prompt and calls Gemini 2.5 Flash
 *   4. Parses <think>…</think> tokens as thinkingTrace
 *   5. Parses final JSON as FiveCsScores + LoanRecommendation
 *   6. Persists result to cam_outputs table
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/config';
import { applications, camOutputs, companies, qualitativeNotes, researchFindings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { runDiscrepancyEngine } from '@/lib/pipeline/discrepancy-engine';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import { searchPromoterHistory, storePromoterDNA, isMem0Available } from '@/lib/mem0/promoter-dna';
import type { FiveCsScores, LoanRecommendation, DiscrepancyResult } from '@/lib/types';
import { runBayesianScorer, type BayesianDecision } from '@/lib/scoring/bayesian-scorer';

// ─── Gemini client ──────────────────────────────────────────────────────────
let _genai: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genai) {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY / GOOGLE_AI_API_KEY is not configured');
    _genai = new GoogleGenerativeAI(key);
  }
  return _genai;
}

const MODEL = 'gemini-2.5-flash';

// ─── Public output type ────────────────────────────────────────────────────────
export interface ReconcilerOutput {
  fiveCsScores: FiveCsScores;
  recommendation: LoanRecommendation;
  thinkingTrace: string;
  discrepancies: DiscrepancyResult[];
  bayesianDecision: BayesianDecision;
}

// ─── Main entry point ──────────────────────────────────────────────────────────
export async function runReconciler(appId: string): Promise<ReconcilerOutput> {
  await publishPipelineEvent(appId, 'reconciler', 'processing', { message: 'Starting reconciliation' });

  // ── 1. Load application info ────────────────────────────────────────────────
  const [app] = await db
    .select({
      companyName: companies.name,
      cin: applications.cin,
      gstin: applications.gstin,
      industry: applications.industry,
      requestedAmountInr: applications.requestedAmountInr,
      companyId: applications.companyId,
      promoterDin: applications.promoterDin,
      pan: applications.pan,
      cmrRank: applications.cmrRank,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, appId))
    .limit(1);

  if (!app) throw new Error(`Application ${appId} not found`);

  // ── 2. Load Redis signals blackboard ────────────────────────────────────────
  const signalsRaw: Record<string, string> = redis
    ? ((await redis.hgetall(redisKeys.signals(appId))) as Record<string, string>) ?? {}
    : {};

  // Pretty-print signals for context
  const signalsSummary: string[] = [];
  for (const [key, val] of Object.entries(signalsRaw)) {
    try {
      const parsed = JSON.parse(val) as { value: unknown; confidence: number };
      signalsSummary.push(`  ${key}: ${JSON.stringify(parsed.value)} (conf: ${parsed.confidence})`);
    } catch {
      signalsSummary.push(`  ${key}: ${val}`);
    }
  }

  // ── 3. Load qualitative notes ────────────────────────────────────────────────
  const notes = await db
    .select({
      category: qualitativeNotes.category,
      fiveCDimension: qualitativeNotes.fiveCDimension,
      noteText: qualitativeNotes.noteText,
      scoreDelta: qualitativeNotes.scoreDelta,
    })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, appId));

  // ── 4. Load research findings ────────────────────────────────────────────────
  const findings = await db
    .select({
      searchType: researchFindings.searchType,
      snippet: researchFindings.snippet,
      sourceUrl: researchFindings.sourceUrl,
      isFraudSignal: researchFindings.isFraudSignal,
      relevanceScore: researchFindings.relevanceScore,
    })
    .from(researchFindings)
    .where(eq(researchFindings.applicationId, appId));

  const fraudSignals = findings.filter((f) => f.isFraudSignal === true);

  // ── 4b. mem0 Promoter DNA — fetch prior history ─────────────────────────────
  let promoterHistoryBlock = '';
  const din = app.promoterDin;
  if (din && isMem0Available()) {
    await publishPipelineEvent(appId, 'reconciler', 'processing', { message: 'Searching mem0 for promoter history...' });
    const memories = await searchPromoterHistory(din);
    if (memories.length > 0) {
      promoterHistoryBlock = memories
        .map((m) => `  - ${typeof m.memory === 'string' ? m.memory : JSON.stringify(m)}`)
        .join('\n');
    }
  }

  // ── 5. Run discrepancy engine ────────────────────────────────────────────────
  const discrepancies = await runDiscrepancyEngine(appId);
  const redFlags = discrepancies.filter((d) => d.verdict === 'RED_FLAG');
  const flags = discrepancies.filter((d) => d.verdict === 'FLAG');

  // ── 6. Build context prompt ──────────────────────────────────────────────────
  const prompt = buildReconcilerPrompt({
    companyName: app.companyName ?? 'Unknown Company',
    cin: app.cin ?? 'N/A',
    industry: app.industry ?? 'N/A',
    requestedAmountInr: app.requestedAmountInr ?? '0',
    signalsSummary,
    notes,
    findings,
    fraudSignals,
    discrepancies,
    redFlags,
    flags,
    promoterHistoryBlock,
  });

  await publishPipelineEvent(appId, 'reconciler', 'processing', { message: 'Calling Gemini 2.5 Flash for reconciliation...' });

  // ── 7. Call Gemini 2.5 Flash ──────────────────────────────────────────────
  const model = getGenAI().getGenerativeModel({ model: MODEL });
  const geminiResult = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 8192 },
  });

  const fullText = geminiResult.response.text();

  // ── 8. Parse thinking trace + final JSON ────────────────────────────────────
  const thinkingTrace = extractThinkingTrace(fullText);
  const jsonText = stripThinkingBlocks(fullText);
  const result = parseReconcilerJSON(jsonText, discrepancies);

  // ── 9. Persist to cam_outputs ────────────────────────────────────────────────
  const { fiveCsScores: fcs, recommendation: rec, swot } = result;

  const safeScore = (v: unknown): number => {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return isNaN(n) ? 50 : Math.max(0, Math.min(100, n));
  };

  // ── 9a. Run Bayesian Evidence Accumulation scorer ───────────────────────────
  const bayesianDecision = runBayesianScorer({
    fiveCsScores: {
      character:  { score: safeScore(fcs.character?.score),  rating: fcs.character?.rating  ?? 'N/A', explanation: fcs.character?.explanation },
      capacity:   { score: safeScore(fcs.capacity?.score),   rating: fcs.capacity?.rating   ?? 'N/A', explanation: fcs.capacity?.explanation },
      capital:    { score: safeScore(fcs.capital?.score),    rating: fcs.capital?.rating    ?? 'N/A', explanation: fcs.capital?.explanation },
      collateral: { score: safeScore(fcs.collateral?.score), rating: fcs.collateral?.rating ?? 'N/A', explanation: fcs.collateral?.explanation },
      conditions: { score: safeScore(fcs.conditions?.score), rating: fcs.conditions?.rating ?? 'N/A', explanation: fcs.conditions?.explanation },
    },
    discrepancies: discrepancies.map((d) => ({ checkName: d.checkName, verdict: d.verdict, confidence: d.confidence, actualValue: d.actualValue })),
    qualitativeNotes: notes.map((n) => ({ fiveCDimension: n.fiveCDimension, scoreDelta: n.scoreDelta, noteText: n.noteText })),
    researchFindings: findings.map((f) => ({ isFraudSignal: f.isFraudSignal, relevanceScore: f.relevanceScore, snippet: f.snippet, searchType: f.searchType })),
    cmrRank: app.cmrRank,
    requestedAmountInr: app.requestedAmountInr,
  });

  await db.insert(camOutputs).values({
    applicationId: appId,
    // 5C scores
    characterScore: safeScore(fcs.character?.score),
    capacityScore: safeScore(fcs.capacity?.score),
    capitalScore: safeScore(fcs.capital?.score),
    collateralScore: safeScore(fcs.collateral?.score),
    conditionsScore: safeScore(fcs.conditions?.score),
    // 5C ratings
    characterRating: fcs.character.rating,
    capacityRating: fcs.capacity.rating,
    capitalRating: fcs.capital.rating,
    collateralRating: fcs.collateral.rating,
    conditionsRating: fcs.conditions.rating,
    // 5C explanations
    characterExplanation: fcs.character.explanation,
    capacityExplanation: fcs.capacity.explanation,
    capitalExplanation: fcs.capital.explanation,
    collateralExplanation: fcs.collateral.explanation,
    conditionsExplanation: fcs.conditions.explanation,
    // Decision
    decision: rec.decision,
    recommendedAmountInr: parseMoneyToDecimal(rec.recommendedAmountInr),
    recommendedRatePercent: parseRateToDecimal(rec.recommendedRatePercent),
    reductionRationale: rec.reductionRationale,
    conditions: rec.conditions,
    // AI trace
    thinkingTrace,
    // Bayesian Decision Engine
    bayesianJson: bayesianDecision as unknown as Record<string, unknown>,
    // SWOT Analysis
    swotJson: swot as unknown as Record<string, unknown> | null,
  });

  // ── 10. Update application pipeline status ──────────────────────────────────
  await db
    .update(applications)
    .set({ pipelineStatus: 'generating_cam' })
    .where(eq(applications.id, appId));

  await publishPipelineEvent(appId, 'reconciler', 'done', { decision: rec.decision });

  // ── 11. mem0 — Store promoter DNA ────────────────────────────────────────────
  if (din && isMem0Available()) {
    storePromoterDNA({
      din,
      companyName: app.companyName ?? 'Unknown',
      applicationId: appId,
      decision: rec.decision,
      fiveCsSummary: {
        character: { score: safeScore(fcs.character?.score), rating: fcs.character?.rating ?? 'N/A' },
        capacity: { score: safeScore(fcs.capacity?.score), rating: fcs.capacity?.rating ?? 'N/A' },
        capital: { score: safeScore(fcs.capital?.score), rating: fcs.capital?.rating ?? 'N/A' },
        collateral: { score: safeScore(fcs.collateral?.score), rating: fcs.collateral?.rating ?? 'N/A' },
        conditions: { score: safeScore(fcs.conditions?.score), rating: fcs.conditions?.rating ?? 'N/A' },
      },
      fraudSignals: fraudSignals.map((f) => f.snippet),
      qualitativeNotes: notes.map((n) => `${n.category}: ${n.noteText}`),
      recommendedAmount: rec.recommendedAmountInr,
      cmrRank: app.cmrRank ?? undefined,
      date: new Date().toISOString().split('T')[0],
    }).catch((err) => console.error('[mem0] Background store failed:', err));
  }

  return { ...result, thinkingTrace, discrepancies, bayesianDecision };
}

// ─── Prompt builder ────────────────────────────────────────────────────────────
interface PromptContext {
  companyName: string;
  cin: string;
  industry: string;
  requestedAmountInr: string;
  signalsSummary: string[];
  notes: Array<{ category: string; fiveCDimension: string; noteText: string; scoreDelta: number | null }>;
  findings: Array<{ searchType: string; snippet: string; sourceUrl: string | null; isFraudSignal: boolean | null; relevanceScore: string | null }>;
  fraudSignals: Array<{ snippet: string; sourceUrl: string | null }>;
  discrepancies: DiscrepancyResult[];
  redFlags: DiscrepancyResult[];
  flags: DiscrepancyResult[];
  promoterHistoryBlock: string;
}

function buildReconcilerPrompt(ctx: PromptContext): string {
  const notesBlock = ctx.notes.length
    ? ctx.notes
        .map(
          (n) =>
            `  [${n.category} / ${n.fiveCDimension}] scoreDelta=${n.scoreDelta ?? 0}: "${n.noteText}"`,
        )
        .join('\n')
    : '  (none provided)';

  const discrepancyBlock = ctx.discrepancies.length
    ? ctx.discrepancies
        .map((d) => `  [${d.verdict}] ${d.checkName}: actual=${d.actualValue}, threshold=${d.threshold}`)
        .join('\n')
    : '  (all checks passed)';

  const fraudBlock = ctx.fraudSignals.length
    ? ctx.fraudSignals.map((f) => `  ⚠ ${f.snippet} (${f.sourceUrl ?? 'no url'})`).join('\n')
    : '  (none)';

  const researchBlock = ctx.findings
    .filter((f) => !f.isFraudSignal)
    .slice(0, 10)
    .map((f) => `  [${f.searchType}] ${f.snippet.slice(0, 200)}`)
    .join('\n') || '  (none)';

  return `You are a senior credit underwriting AI for Indian corporate loans. Your task is to synthesise all available signals and produce a structured Credit Appraisal Memo (CAM) decision using the 5Cs of credit framework.

## BORROWER
Company: ${ctx.companyName}
CIN: ${ctx.cin}
Industry: ${ctx.industry}
Loan Request: ₹${ctx.requestedAmountInr} INR

## QUANTITATIVE SIGNALS (from financial document agents)
${ctx.signalsSummary.join('\n') || '  (no signals yet)'}

## CROSS-DOCUMENT DISCREPANCY CHECKS
${discrepancyBlock}

## CREDIT OFFICER FIELD NOTES (qualitative observations)
${notesBlock}

## FRAUD / LITIGATION SIGNALS (OSINT research)
${fraudBlock}

## OTHER RESEARCH FINDINGS
${researchBlock}

## PROMOTER HISTORY (from mem0 Promoter DNA)
${ctx.promoterHistoryBlock || '  (first application — no prior history found)'}

## INSTRUCTIONS
Think step by step inside <think>...</think> tags. Weigh each signal and note carefully. Consider:
- RED_FLAG discrepancies are serious; each reduces the approval probability significantly
- Credit officer notes with negative scoreDelta indicate real-world concerns
- Fraud signals may override positive financials
- Indian RBI guidelines: DSCR ≥ 1.2 typical requirement; CMR 1-4 is good, 7-10 is risky

After your thinking, output ONLY a JSON object (no markdown fences) in this EXACT schema:

{
  "fiveCsScores": {
    "character": { "score": <0-100>, "rating": "<Strong|Adequate|Weak|Red Flag>", "explanation": "<with source citations>" },
    "capacity":  { "score": <0-100>, "rating": "<Strong|Adequate|Weak|Red Flag>", "explanation": "<with source citations>" },
    "capital":   { "score": <0-100>, "rating": "<Strong|Adequate|Weak|Red Flag>", "explanation": "<with source citations>" },
    "collateral":{ "score": <0-100>, "rating": "<Strong|Adequate|Weak|Red Flag>", "explanation": "<with source citations>" },
    "conditions":{ "score": <0-100>, "rating": "<Strong|Adequate|Weak|Red Flag>", "explanation": "<with source citations>" }
  },
  "decision": "<APPROVE|CONDITIONAL_APPROVE|REJECT>",
  "recommendedAmountInr": "<e.g. ₹5Cr or ₹50L>",
  "recommendedRatePercent": "<e.g. 13.5%>",
  "originalAsk": "<repeat the requested amount>",
  "reductionRationale": "<explain any reduction from original ask, or omit if full amount>",
  "conditions": ["<condition 1>", "<condition 2>"],
  "swot": {
    "strengths": ["<internal positive factor>", "<internal positive factor>"],
    "weaknesses": ["<internal negative factor>", "<internal negative factor>"],
    "opportunities": ["<external positive factor>", "<external positive factor>"],
    "threats": ["<external risk>", "<external risk>"]
  }
}

Rules:
- Scores are 0–100 (100 = perfect). Weight red flags heavily.
- swot.strengths and swot.weaknesses must be internal/company-specific factors derived from the financial signals.
- swot.opportunities and swot.threats must be external/macro factors from research findings and industry context.
- Each SWOT list must have 3–5 concise, specific bullet points (not generic statements).
- REJECT if CMR ≥ 9 or ≥2 RED_FLAG discrepancies or confirmed fraud signals.
- CONDITIONAL_APPROVE for 1 RED_FLAG or CMR 7–8 or DSCR between 1.0–1.2.
- APPROVE only if all checks PASS and no fraud signals.
- Cite sources as [Gemini: Bank Statement], [Mistral OCR], [Tavily: e-Courts], [Credit Officer: category], [CIBIL Agent], etc.
- conditions[] must list concrete monitoring/covenants (e.g. "Quarterly audited financials required").
`;
}

// ─── Parse helpers ─────────────────────────────────────────────────────────────
function extractThinkingTrace(text: string): string {
  const match = text.match(/<think>([\s\S]*?)<\/think>/i);
  return match ? match[1].trim() : '';
}

function stripThinkingBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

function parseReconcilerJSON(
  jsonText: string,
  discrepancies: DiscrepancyResult[],
): { fiveCsScores: FiveCsScores; recommendation: LoanRecommendation; swot: SwotAnalysis | null } {
  // Strip markdown fences if model leaked them
  const cleaned = jsonText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Fallback: produce a conservative default if JSON is malformed
    console.error('ReconcilerAgent: failed to parse JSON, using fallback', cleaned.slice(0, 300));
    return buildFallback(discrepancies);
  }

  const fcs = parsed.fiveCsScores as FiveCsScores;
  const recommendation: LoanRecommendation = {
    decision: (parsed.decision as string) as LoanRecommendation['decision'],
    recommendedAmountInr: (parsed.recommendedAmountInr as string) ?? '₹0',
    recommendedRatePercent: (parsed.recommendedRatePercent as string) ?? '0%',
    originalAsk: (parsed.originalAsk as string) ?? '',
    reductionRationale: parsed.reductionRationale as string | undefined,
    conditions: (parsed.conditions as string[]) ?? [],
  };

  const rawSwot = parsed.swot as Record<string, string[]> | undefined;
  const swot: SwotAnalysis | null = rawSwot
    ? {
        strengths: rawSwot.strengths ?? [],
        weaknesses: rawSwot.weaknesses ?? [],
        opportunities: rawSwot.opportunities ?? [],
        threats: rawSwot.threats ?? [],
      }
    : null;

  return { fiveCsScores: fcs, recommendation, swot };
}

function buildFallback(discrepancies: DiscrepancyResult[]): {
  fiveCsScores: FiveCsScores;
  recommendation: LoanRecommendation;
  swot: SwotAnalysis | null;
} {
  const hasRedFlag = discrepancies.some((d) => d.verdict === 'RED_FLAG');
  const defaultScore = hasRedFlag ? 35 : 50;
  const defaultRating = hasRedFlag ? 'Weak' : 'Adequate';

  const fiveCsScores: FiveCsScores = {
    character: { score: defaultScore, rating: defaultRating, explanation: 'Insufficient data for analysis.' },
    capacity:  { score: defaultScore, rating: defaultRating, explanation: 'Insufficient data for analysis.' },
    capital:   { score: defaultScore, rating: defaultRating, explanation: 'Insufficient data for analysis.' },
    collateral:{ score: defaultScore, rating: defaultRating, explanation: 'Insufficient data for analysis.' },
    conditions:{ score: defaultScore, rating: defaultRating, explanation: 'Insufficient data for analysis.' },
  };

  const recommendation: LoanRecommendation = {
    decision: hasRedFlag ? 'REJECT' : 'CONDITIONAL_APPROVE',
    recommendedAmountInr: '₹0',
    recommendedRatePercent: '0%',
    originalAsk: 'Unknown',
    reductionRationale: 'Could not parse AI output; manual review required.',
    conditions: ['Manual credit officer review required before disbursement.'],
  };

  return { fiveCsScores, recommendation, swot: null };
}

// ─── Money/Rate parsers for DB storage ────────────────────────────────────────
function parseMoneyToDecimal(val: string): string {
  // "₹5Cr" → "50000000", "₹50L" → "5000000", "₹1.2Cr" → "12000000"
  if (!val) return '0';
  const cleaned = val.replace(/[₹,\s]/g, '').toLowerCase();
  const crMatch = cleaned.match(/^([\d.]+)cr$/);
  if (crMatch) return String(Math.round(parseFloat(crMatch[1]) * 1e7));
  const lakhMatch = cleaned.match(/^([\d.]+)l(?:akh)?$/);
  if (lakhMatch) return String(Math.round(parseFloat(lakhMatch[1]) * 1e5));
  const plain = parseFloat(cleaned);
  return isNaN(plain) ? '0' : String(plain);
}

function parseRateToDecimal(val: string): string {
  // "13.5%" → "13.5", "N/A" → "0"
  if (!val) return '0';
  const cleaned = val.replace(/[%\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? '0' : String(num);
}

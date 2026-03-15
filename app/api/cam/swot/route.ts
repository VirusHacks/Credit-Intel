/**
 * POST /api/cam/swot
 * Body: { appId: string }
 * Generates SWOT analysis from existing agent signals + CAM data using Gemini.
 * Saves result to cam_outputs.swot_json and returns it.
 *
 * GET /api/cam/swot?appId=<id>
 * Returns existing SWOT from cam_outputs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import {
  applications,
  camOutputs,
  companies,
  agentSignals,
  qualitativeNotes,
  researchFindings,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Gemini client ─────────────────────────────────────────────────────────────
let _genai: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genai) {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY / GOOGLE_AI_API_KEY is not configured');
    _genai = new GoogleGenerativeAI(key);
  }
  return _genai;
}

export interface SwotResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  generatedAt: string;
  isGenerated: boolean;
}

// ─── GET: return existing SWOT ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get('appId');
  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 });

  const [cam] = await db
    .select({ swotJson: camOutputs.swotJson, generatedAt: camOutputs.generatedAt })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, appId))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  if (!cam?.swotJson)
    return NextResponse.json({ swot: null }, { status: 200 });

  return NextResponse.json({
    swot: {
      ...(cam.swotJson as Record<string, unknown>),
      generatedAt: cam.generatedAt,
      isGenerated: true,
    },
  });
}

// ─── POST: generate new SWOT ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { appId?: string };
  try {
    body = (await req.json()) as { appId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { appId } = body;
  if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 });

  // ── Fetch application + latest CAM ────────────────────────────────────────
  const [app] = await db
    .select({
      companyName: companies.name,
      industry: applications.industry,
      subIndustry: applications.subIndustry,
      businessStage: applications.businessStage,
      requestedAmountInr: applications.requestedAmountInr,
      annualRevenue: applications.annualRevenue,
      cmrRank: applications.cmrRank,
      cin: applications.cin,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, appId))
    .limit(1);

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const [cam] = await db
    .select({
      id: camOutputs.id,
      characterScore: camOutputs.characterScore,
      capacityScore: camOutputs.capacityScore,
      capitalScore: camOutputs.capitalScore,
      collateralScore: camOutputs.collateralScore,
      conditionsScore: camOutputs.conditionsScore,
      characterRating: camOutputs.characterRating,
      capacityRating: camOutputs.capacityRating,
      capitalRating: camOutputs.capitalRating,
      collateralRating: camOutputs.collateralRating,
      conditionsRating: camOutputs.conditionsRating,
      characterExplanation: camOutputs.characterExplanation,
      capacityExplanation: camOutputs.capacityExplanation,
      capitalExplanation: camOutputs.capitalExplanation,
      collateralExplanation: camOutputs.collateralExplanation,
      conditionsExplanation: camOutputs.conditionsExplanation,
      decision: camOutputs.decision,
      recommendedAmountInr: camOutputs.recommendedAmountInr,
      reductionRationale: camOutputs.reductionRationale,
    })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, appId))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  // ── Gather agent signals ───────────────────────────────────────────────────
  const signals = await db
    .select({ signalKey: agentSignals.signalKey, signalValue: agentSignals.signalValue, agentName: agentSignals.agentName })
    .from(agentSignals)
    .where(eq(agentSignals.applicationId, appId));

  const signalBlock = signals.length
    ? signals.map((s) => `  [${s.agentName}] ${s.signalKey}: ${s.signalValue ?? 'N/A'}`).join('\n')
    : '  No agent signals available.';

  // ── Gather qualitative notes ──────────────────────────────────────────────
  const notes = await db
    .select({ category: qualitativeNotes.category, noteText: qualitativeNotes.noteText, fiveCDimension: qualitativeNotes.fiveCDimension })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, appId));

  const notesBlock = notes.length
    ? notes.map((n) => `  [${n.fiveCDimension}|${n.category}] ${n.noteText}`).join('\n')
    : '  No qualitative notes available.';

  // ── Gather research findings ──────────────────────────────────────────────
  const research = await db
    .select({ searchType: researchFindings.searchType, snippet: researchFindings.snippet, isFraudSignal: researchFindings.isFraudSignal })
    .from(researchFindings)
    .where(eq(researchFindings.applicationId, appId));

  const researchBlock = research.length
    ? research.map((r) => `  [${r.searchType}${r.isFraudSignal ? ' ⚠FRAUD' : ''}] ${r.snippet.slice(0, 200)}`).join('\n')
    : '  No research findings available.';

  // ── 5C summary ────────────────────────────────────────────────────────────
  const fiveCBlock = cam
    ? [
        `Character: ${cam.characterScore ?? '?'}/100 (${cam.characterRating ?? '?'}) — ${(cam.characterExplanation ?? '').slice(0, 150)}`,
        `Capacity: ${cam.capacityScore ?? '?'}/100 (${cam.capacityRating ?? '?'}) — ${(cam.capacityExplanation ?? '').slice(0, 150)}`,
        `Capital: ${cam.capitalScore ?? '?'}/100 (${cam.capitalRating ?? '?'}) — ${(cam.capitalExplanation ?? '').slice(0, 150)}`,
        `Collateral: ${cam.collateralScore ?? '?'}/100 (${cam.collateralRating ?? '?'}) — ${(cam.collateralExplanation ?? '').slice(0, 150)}`,
        `Conditions: ${cam.conditionsScore ?? '?'}/100 (${cam.conditionsRating ?? '?'}) — ${(cam.conditionsExplanation ?? '').slice(0, 150)}`,
      ].join('\n')
    : 'No 5C analysis available yet.';

  // ── Build prompt ──────────────────────────────────────────────────────────
  const prompt = `You are a senior credit analyst preparing a SWOT analysis for a loan application.

COMPANY: ${app.companyName ?? 'Unknown'}
INDUSTRY: ${app.industry ?? 'N/A'}${app.subIndustry ? ` / ${app.subIndustry}` : ''}
BUSINESS STAGE: ${app.businessStage ?? 'N/A'}
ANNUAL REVENUE: ${app.annualRevenue ? `₹${Number(app.annualRevenue).toLocaleString('en-IN')}` : 'N/A'}
LOAN REQUESTED: ${app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : 'N/A'}
CMR RANK: ${app.cmrRank ?? 'N/A'}/10
CIN: ${app.cin ?? 'N/A'}

5C CREDIT ANALYSIS:
${fiveCBlock}

${cam ? `CREDIT DECISION: ${cam.decision}${cam.reductionRationale ? `\nREDUCTION RATIONALE: ${cam.reductionRationale}` : ''}` : ''}

AGENT SIGNALS (extracted from financial documents):
${signalBlock}

QUALITATIVE FIELD NOTES:
${notesBlock}

RESEARCH & EXTERNAL FINDINGS:
${researchBlock}

Based on all of the above, generate a SWOT analysis. Rules:
- STRENGTHS: 3–5 internal company-specific strengths from financial signals and field notes
- WEAKNESSES: 3–5 internal company-specific weaknesses or risks observed
- OPPORTUNITIES: 3–5 external/macro opportunities in the sector or market environment
- THREATS: 3–5 external threats, regulatory risks, or industry headwinds
- Each point must be specific (1–2 sentences), citing evidence from the data above
- Do NOT use generic statements like "company has good management" without evidence

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "opportunities": ["...", "...", "..."],
  "threats": ["...", "...", "..."]
}`;

  // ── Call Gemini ────────────────────────────────────────────────────────────
  let swot: SwotResult;
  try {
    const model = getGenAI().getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    });
    const rawText = result.response.text();

    // Strip thinking blocks, markdown fences, and whitespace
    let raw = rawText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    // Extract first JSON object if the model adds prose around it
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    let parsed: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      // Last-resort: extract each array with a regex so partial JSON still works
      const extract = (key: string): string[] => {
        const m = raw.match(new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, 's'));
        if (!m) return [];
        return [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
      };
      parsed = {
        strengths: extract('strengths'),
        weaknesses: extract('weaknesses'),
        opportunities: extract('opportunities'),
        threats: extract('threats'),
      };
    }

    swot = {
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      opportunities: parsed.opportunities ?? [],
      threats: parsed.threats ?? [],
      generatedAt: new Date().toISOString(),
      isGenerated: true,
    };
  } catch (err) {
    console.error('SWOT generation failed:', err);
    return NextResponse.json({ error: 'SWOT generation failed', details: String(err) }, { status: 500 });
  }

  // ── Persist to cam_outputs ─────────────────────────────────────────────────
  if (cam) {
    await db
      .update(camOutputs)
      .set({ swotJson: swot as unknown as Record<string, unknown> })
      .where(eq(camOutputs.id, cam.id));
  }
  // If no cam record yet, we can't persist (no cam_output row for this app) —
  // caller will just get the result in the response for fresh display.

  return NextResponse.json({ swot }, { status: 200 });
}

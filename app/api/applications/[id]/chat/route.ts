/**
 * POST /api/applications/[id]/chat
 * AI-powered Q&A about a specific loan application using CAM data + agent signals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/config';
import { applications, companies, camOutputs, qualitativeNotes, agentSignals } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

let _genai: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genai) {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    _genai = new GoogleGenerativeAI(key);
  }
  return _genai;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await context.params;

  let body: { message?: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, history = [] } = body;
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return NextResponse.json({ error: 'message is required (max 2000 chars)' }, { status: 400 });
  }

  // Load application + company
  const [app] = await db
    .select({
      companyName: companies.name,
      cin: applications.cin,
      gstin: applications.gstin,
      industry: applications.industry,
      requestedAmountInr: applications.requestedAmountInr,
      cmrRank: applications.cmrRank,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, appId))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Load CAM output
  const [cam] = await db
    .select({
      decision: camOutputs.decision,
      recommendedAmountInr: camOutputs.recommendedAmountInr,
      recommendedRatePercent: camOutputs.recommendedRatePercent,
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
      reductionRationale: camOutputs.reductionRationale,
      conditions: camOutputs.conditions,
      thinkingTrace: camOutputs.thinkingTrace,
    })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, appId))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  // Load agent signals (summary)
  const signals = await db
    .select({ agentName: agentSignals.agentName, signalKey: agentSignals.signalKey, signalValue: agentSignals.signalValue, confidence: agentSignals.confidence })
    .from(agentSignals)
    .where(eq(agentSignals.applicationId, appId));

  // Load qualitative notes
  const notes = await db
    .select({ category: qualitativeNotes.category, fiveCDimension: qualitativeNotes.fiveCDimension, noteText: qualitativeNotes.noteText })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, appId));

  // Build system context
  const systemPrompt = `You are a helpful AI credit analyst assistant. You have access to the full credit analysis data for this loan application. Answer the user's questions clearly and concisely based on the data below. If you don't have enough data to answer, say so honestly.

## APPLICATION
- Company: ${app.companyName ?? 'Unknown'}
- CIN: ${app.cin ?? 'N/A'}
- Industry: ${app.industry ?? 'N/A'}
- Requested Amount: ₹${app.requestedAmountInr ?? '0'}
- CMR Rank: ${app.cmrRank ?? 'N/A'}

${cam ? `## CAM DECISION
- Decision: ${cam.decision}
- Recommended Amount: ₹${cam.recommendedAmountInr ?? '0'}
- Rate: ${cam.recommendedRatePercent ?? 'N/A'}%
- Reduction Rationale: ${cam.reductionRationale ?? 'None'}
- Conditions: ${JSON.stringify(cam.conditions ?? [])}

## FIVE C's SCORES
- Character: ${cam.characterScore}/100 (${cam.characterRating}) — ${cam.characterExplanation ?? 'No explanation'}
- Capacity: ${cam.capacityScore}/100 (${cam.capacityRating}) — ${cam.capacityExplanation ?? 'No explanation'}
- Capital: ${cam.capitalScore}/100 (${cam.capitalRating}) — ${cam.capitalExplanation ?? 'No explanation'}
- Collateral: ${cam.collateralScore}/100 (${cam.collateralRating}) — ${cam.collateralExplanation ?? 'No explanation'}
- Conditions: ${cam.conditionsScore}/100 (${cam.conditionsRating}) — ${cam.conditionsExplanation ?? 'No explanation'}
` : '(No CAM generated yet)'}

## AGENT SIGNALS
${signals.length > 0
  ? signals.map(s => `- [${s.agentName}] ${s.signalKey}: ${s.signalValue} (confidence: ${s.confidence})`).join('\n')
  : '(No signals)'}

## FIELD NOTES
${notes.length > 0
  ? notes.map(n => `- [${n.category}/${n.fiveCDimension}] ${n.noteText}`).join('\n')
  : '(No field notes)'}

Keep responses professional but easy to understand. Use bullet points for clarity. Cite specific data when answering.`;

  // Build conversation
  const conversationHistory = history.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }));

  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I have the full credit analysis context. Ask me anything about this application.' }] },
        ...conversationHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { maxOutputTokens: 2048 },
    });

    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

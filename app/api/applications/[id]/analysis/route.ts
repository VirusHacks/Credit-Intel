/**
 * GET /api/applications/[id]/analysis
 * Returns the full transparent analysis for a loan application:
 *   - All agent signals grouped by agent
 *   - Research findings (fraud + general)
 *   - Discrepancy results
 *   - Qualitative notes
 *   - Documents uploaded
 *   - Extraction pipeline stages
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import {
  applications, companies, agentSignals, researchFindings,
  qualitativeNotes, documents, extractionStates, camOutputs,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // 1. Application + company
  const [app] = await db
    .select({
      id: applications.id,
      companyName: companies.name,
      cin: applications.cin,
      gstin: applications.gstin,
      pan: applications.pan,
      promoterDin: applications.promoterDin,
      industry: applications.industry,
      subIndustry: applications.subIndustry,
      requestedAmountInr: applications.requestedAmountInr,
      cmrRank: applications.cmrRank,
      pipelineStatus: applications.pipelineStatus,
      analysisProgress: applications.analysisProgress,
      numberOfEmployees: applications.numberOfEmployees,
      annualRevenue: applications.annualRevenue,
      businessStage: applications.businessStage,
      yearlyGrowth: applications.yearlyGrowth,
      qualitativeGateDone: applications.qualitativeGateDone,
      createdAt: applications.createdAt,
      city: companies.city,
      state: companies.state,
      foundedYear: companies.foundedYear,
      website: companies.website,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // 2. Agent signals
  const signals = await db
    .select({
      agentName: agentSignals.agentName,
      signalKey: agentSignals.signalKey,
      signalValue: agentSignals.signalValue,
      confidence: agentSignals.confidence,
      rawSnippet: agentSignals.rawSnippet,
      isUnverified: agentSignals.isUnverified,
      createdAt: agentSignals.createdAt,
    })
    .from(agentSignals)
    .where(eq(agentSignals.applicationId, id));

  // 3. Research findings
  const findings = await db
    .select({
      searchType: researchFindings.searchType,
      query: researchFindings.query,
      sourceUrl: researchFindings.sourceUrl,
      snippet: researchFindings.snippet,
      relevanceScore: researchFindings.relevanceScore,
      isFraudSignal: researchFindings.isFraudSignal,
      scrapedAt: researchFindings.scrapedAt,
    })
    .from(researchFindings)
    .where(eq(researchFindings.applicationId, id));

  // 4. Qualitative notes
  const notes = await db
    .select({
      category: qualitativeNotes.category,
      fiveCDimension: qualitativeNotes.fiveCDimension,
      noteText: qualitativeNotes.noteText,
      scoreDelta: qualitativeNotes.scoreDelta,
      createdAt: qualitativeNotes.createdAt,
    })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, id));

  // 5. Documents
  const docs = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      fileType: documents.fileType,
      documentType: documents.documentType,
      fileSize: documents.fileSize,
      uploadedAt: documents.uploadedAt,
    })
    .from(documents)
    .where(eq(documents.applicationId, id));

  // 6. Pipeline stages
  const stages = await db
    .select({
      stage: extractionStates.stage,
      status: extractionStates.status,
      startedAt: extractionStates.startedAt,
      completedAt: extractionStates.completedAt,
      errorMessage: extractionStates.errorMessage,
    })
    .from(extractionStates)
    .where(eq(extractionStates.applicationId, id));

  // 7. CAM output (for summary scores)
  const [cam] = await db
    .select({
      decision: camOutputs.decision,
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
      recommendedAmountInr: camOutputs.recommendedAmountInr,
      recommendedRatePercent: camOutputs.recommendedRatePercent,
      reductionRationale: camOutputs.reductionRationale,
      conditions: camOutputs.conditions,
      thinkingTrace: camOutputs.thinkingTrace,
      generatedAt: camOutputs.generatedAt,
    })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, id))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  // Group signals by agent
  const signalsByAgent: Record<string, typeof signals> = {};
  for (const s of signals) {
    const agent = s.agentName;
    if (!signalsByAgent[agent]) signalsByAgent[agent] = [];
    signalsByAgent[agent].push(s);
  }

  return NextResponse.json({
    application: app,
    signalsByAgent,
    researchFindings: findings,
    qualitativeNotes: notes,
    documents: docs,
    pipelineStages: stages,
    cam: cam ?? null,
  });
}

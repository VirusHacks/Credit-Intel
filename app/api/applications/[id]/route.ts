/**
 * GET /api/applications/[id]
 * Returns full application data joined with company info + latest CAM output.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications, companies, camOutputs, qualitativeNotes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const rows = await db
    .select({
      // application fields
      id: applications.id,
      status: applications.status,
      industry: applications.industry,
      subIndustry: applications.subIndustry,
      cin: applications.cin,
      gstin: applications.gstin,
      pan: applications.pan,
      promoterDin: applications.promoterDin,
      requestedAmountInr: applications.requestedAmountInr,
      cmrRank: applications.cmrRank,
      pipelineStatus: applications.pipelineStatus,
      qualitativeGateDone: applications.qualitativeGateDone,
      analysisProgress: applications.analysisProgress,
      annualRevenue: applications.annualRevenue,
      numberOfEmployees: applications.numberOfEmployees,
      businessStage: applications.businessStage,
      yearlyGrowth: applications.yearlyGrowth,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      // company fields
      companyId: companies.id,
      companyName: companies.name,
      registrationNumber: companies.registrationNumber,
      registrationType: companies.registrationType,
      location: companies.location,
      city: companies.city,
      state: companies.state,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const app = rows[0];

  // Fetch latest CAM output
  const [latestCam] = await db
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
      bayesianJson: camOutputs.bayesianJson,
      swotJson: camOutputs.swotJson,
      pdfBlobUrl: camOutputs.pdfBlobUrl,
      generatedAt: camOutputs.generatedAt,
    })
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, id))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  // Count qualitative notes
  const noteRows = await db
    .select({ id: qualitativeNotes.id })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, id));

  return NextResponse.json({
    ...app,
    latestCam: latestCam ?? null,
    qualitativeNotesCount: noteRows.length,
  });
}

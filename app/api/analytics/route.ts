/**
 * GET /api/analytics
 * Returns real portfolio analytics from the database.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications, companies, camOutputs, agentSignals, researchFindings } from '@/lib/db/schema';
import { sql, eq, desc } from 'drizzle-orm';

export async function GET() {
  // 1. Total applications & status breakdown
  const statusCounts = await db
    .select({
      pipelineStatus: applications.pipelineStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .groupBy(applications.pipelineStatus);

  const total = statusCounts.reduce((s, r) => s + r.count, 0);
  const completedCount = statusCounts.find(s => s.pipelineStatus === 'complete')?.count ?? 0;

  // 2. Decision breakdown from CAM outputs
  const decisionCounts = await db
    .select({
      decision: camOutputs.decision,
      count: sql<number>`count(*)::int`,
    })
    .from(camOutputs)
    .groupBy(camOutputs.decision);

  const approvedCount = decisionCounts.find(d => d.decision === 'APPROVE')?.count ?? 0;
  const conditionalCount = decisionCounts.find(d => d.decision === 'CONDITIONAL_APPROVE')?.count ?? 0;
  const rejectedCount = decisionCounts.find(d => d.decision === 'REJECT')?.count ?? 0;
  const totalDecisions = approvedCount + conditionalCount + rejectedCount;
  const approvalRate = totalDecisions > 0 ? Math.round((approvedCount + conditionalCount) / totalDecisions * 100) : 0;

  // 3. Average 5Cs scores
  const [avgScores] = await db
    .select({
      avgCharacter: sql<number>`round(avg(${camOutputs.characterScore}))::int`,
      avgCapacity: sql<number>`round(avg(${camOutputs.capacityScore}))::int`,
      avgCapital: sql<number>`round(avg(${camOutputs.capitalScore}))::int`,
      avgCollateral: sql<number>`round(avg(${camOutputs.collateralScore}))::int`,
      avgConditions: sql<number>`round(avg(${camOutputs.conditionsScore}))::int`,
      avgOverall: sql<number>`round((avg(${camOutputs.characterScore}) + avg(${camOutputs.capacityScore}) + avg(${camOutputs.capitalScore}) + avg(${camOutputs.collateralScore}) + avg(${camOutputs.conditionsScore})) / 5)::int`,
    })
    .from(camOutputs);

  // 4. Industry breakdown
  const industryBreakdown = await db
    .select({
      industry: applications.industry,
      count: sql<number>`count(*)::int`,
      avgAmount: sql<string>`round(avg(${applications.requestedAmountInr}), 2)`,
    })
    .from(applications)
    .groupBy(applications.industry)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // 5. Total amount requested & recommended
  const [amounts] = await db
    .select({
      totalRequested: sql<string>`coalesce(sum(${applications.requestedAmountInr}), 0)`,
      totalRecommended: sql<string>`coalesce(sum(${camOutputs.recommendedAmountInr}), 0)`,
    })
    .from(applications)
    .leftJoin(camOutputs, eq(applications.id, camOutputs.applicationId));

  // 6. Fraud signals count
  const [fraudStats] = await db
    .select({
      totalFindings: sql<number>`count(*)::int`,
      fraudSignals: sql<number>`count(*) filter (where ${researchFindings.isFraudSignal} = true)::int`,
    })
    .from(researchFindings);

  // 7. Agent signal stats
  const [signalStats] = await db
    .select({
      totalSignals: sql<number>`count(*)::int`,
      avgConfidence: sql<number>`round(avg(${agentSignals.confidence}::numeric) * 100)::int`,
      unverifiedCount: sql<number>`count(*) filter (where ${agentSignals.isUnverified} = true)::int`,
    })
    .from(agentSignals);

  // 8. Recent applications
  const recentApps = await db
    .select({
      id: applications.id,
      companyName: companies.name,
      industry: applications.industry,
      requestedAmountInr: applications.requestedAmountInr,
      pipelineStatus: applications.pipelineStatus,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .orderBy(desc(applications.createdAt))
    .limit(5);

  return NextResponse.json({
    portfolio: {
      totalApplications: total,
      completedAnalyses: completedCount,
      approvalRate,
      totalRequested: amounts?.totalRequested ?? '0',
      totalRecommended: amounts?.totalRecommended ?? '0',
    },
    decisions: {
      approved: approvedCount,
      conditionalApproved: conditionalCount,
      rejected: rejectedCount,
      total: totalDecisions,
    },
    avgScores: avgScores ?? {
      avgCharacter: 0, avgCapacity: 0, avgCapital: 0,
      avgCollateral: 0, avgConditions: 0, avgOverall: 0,
    },
    pipelineStatus: statusCounts,
    industryBreakdown: industryBreakdown.filter(i => i.industry),
    fraudStats: {
      totalFindings: fraudStats?.totalFindings ?? 0,
      fraudSignals: fraudStats?.fraudSignals ?? 0,
    },
    signalStats: {
      totalSignals: signalStats?.totalSignals ?? 0,
      avgConfidence: signalStats?.avgConfidence ?? 0,
      unverifiedCount: signalStats?.unverifiedCount ?? 0,
    },
    recentApplications: recentApps,
  });
}

'use client';

import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import { PortfolioMetrics } from '@/components/analytics/portfolio-metrics';
import { RiskHeatmap } from '@/components/analytics/risk-heatmap';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loader2, Shield, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  portfolio: {
    totalApplications: number;
    completedAnalyses: number;
    approvalRate: number;
    totalRequested: string;
    totalRecommended: string;
  };
  decisions: {
    approved: number;
    conditionalApproved: number;
    rejected: number;
    total: number;
  };
  avgScores: {
    avgCharacter: number;
    avgCapacity: number;
    avgCapital: number;
    avgCollateral: number;
    avgConditions: number;
    avgOverall: number;
  };
  industryBreakdown: { industry: string; count: number; avgAmount: string }[];
  fraudStats: { totalFindings: number; fraudSignals: number };
  signalStats: { totalSignals: number; avgConfidence: number; unverifiedCount: number };
  recentApplications: {
    id: string;
    companyName: string | null;
    industry: string | null;
    requestedAmountInr: string | null;
    pipelineStatus: string | null;
    createdAt: string;
  }[];
  pipelineStatus: Array<{ pipelineStatus: string; count: number }>;
  riskDistribution: Array<{ name: string; value: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    void fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col">
          <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-[#222222] bg-[#0A0A0A]/80 px-6 py-5 text-4xl font-medium backdrop-blur-lg">
            Analytics
          </h1>
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatInr = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(n) || n === 0) return '₹0';
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Advanced Analytics
        </h1>

        <div className="relative flex flex-col gap-6 p-6">
          {/* Filters */}
          <AnalyticsFilters />

          {/* Portfolio Metrics */}
          <PortfolioMetrics data={data?.portfolio ?? undefined} signalStats={data?.signalStats ?? undefined} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsChart 
              pipelineStatus={data?.pipelineStatus} 
              riskData={data?.riskDistribution} 
            />
            <RiskHeatmap />
          </div>

          {/* 5Cs Average Scores */}
          {data?.avgScores && data.avgScores.avgOverall > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-white/40" />
                Average Five C&apos;s Scores (Portfolio)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: 'Character', value: data.avgScores.avgCharacter },
                  { label: 'Capacity', value: data.avgScores.avgCapacity },
                  { label: 'Capital', value: data.avgScores.avgCapital },
                  { label: 'Collateral', value: data.avgScores.avgCollateral },
                  { label: 'Conditions', value: data.avgScores.avgConditions },
                  { label: 'Overall', value: data.avgScores.avgOverall },
                ].map((c) => (
                  <div key={c.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 mb-1">{c.label}</p>
                    <p className="text-2xl font-bold tabular-nums text-white">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Breakdown + Fraud Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.decisions && data.decisions.total > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white/40" />
                  Decision Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-white/20 bg-white/10 text-center">
                    <p className="text-2xl font-bold tabular-nums text-white">{data.decisions.approved}</p>
                    <p className="text-xs text-white/50 mt-1">✓ Approved</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
                    <p className="text-2xl font-bold tabular-nums text-white">{data.decisions.conditionalApproved}</p>
                    <p className="text-xs text-white/50 mt-1">→ Conditional</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/30 bg-white/15 text-center">
                    <p className="text-2xl font-bold tabular-nums text-white">{data.decisions.rejected}</p>
                    <p className="text-xs text-white/50 mt-1">✗ Rejected</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-white/40" />
                Research &amp; Fraud Intelligence
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
                  <p className="text-2xl font-bold tabular-nums text-white">{data?.fraudStats?.totalFindings ?? 0}</p>
                  <p className="text-xs text-white/50 mt-1">OSINT Findings</p>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
                  <p className="text-2xl font-bold tabular-nums text-white">{data?.fraudStats?.fraudSignals ?? 0}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {(data?.fraudStats?.fraudSignals ?? 0) > 0 ? '⚠ Fraud Signals' : '✓ Fraud Signals'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Breakdown */}
          {data?.industryBreakdown && data.industryBreakdown.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white/40" />
                Industry Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-white/40 font-medium">Industry</th>
                      <th className="text-right py-2 px-3 text-white/40 font-medium">Applications</th>
                      <th className="text-right py-2 px-3 text-white/40 font-medium">Avg Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.industryBreakdown.map((row) => (
                      <tr key={row.industry} className="border-b border-white/10 last:border-0 hover:bg-white/5">
                        <td className="py-2.5 px-3 font-medium text-white">{row.industry}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-white/60">{row.count}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-white/60">{formatInr(row.avgAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Portfolio Summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-white/40">Avg Five C&apos;s Score</p>
                <p className="text-2xl font-bold text-white mt-1 tabular-nums">{data?.avgScores?.avgOverall ?? '—'}</p>
                <p className="text-xs text-white/30 mt-2">across all CAM evaluations</p>
              </div>
              <div className="p-4 rounded-lg border border-white/20 bg-white/10">
                <p className="text-sm text-white/40">Approval Rate</p>
                <p className="text-2xl font-bold text-white mt-1 tabular-nums">{data?.portfolio?.approvalRate ?? 0}%</p>
                <p className="text-xs text-white/30 mt-2">{data?.decisions?.total ?? 0} decisions made</p>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-white/40">Total Requested</p>
                <p className="text-2xl font-bold text-white mt-1 tabular-nums">{formatInr(data?.portfolio?.totalRequested ?? '0')}</p>
                <p className="text-xs text-white/30 mt-2">Recommended: {formatInr(data?.portfolio?.totalRecommended ?? '0')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

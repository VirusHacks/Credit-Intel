'use client';

import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import { PortfolioMetrics } from '@/components/analytics/portfolio-metrics';
import { RiskHeatmap } from '@/components/analytics/risk-heatmap';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { Card } from '@/components/ui/card';
import { MainNav } from '@/components/layout/main-nav';
import { PageHeader } from '@/components/ui/page-header';
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
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
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
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
        <PageHeader
          title="Advanced Analytics"
          description="Monitor your portfolio performance and risk metrics."
        />

        {/* Filters */}
        <AnalyticsFilters />

        {/* Portfolio Metrics */}
        <PortfolioMetrics data={data?.portfolio ?? undefined} signalStats={data?.signalStats ?? undefined} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart applications={[]} />
          <RiskHeatmap />
        </div>

        {/* 5Cs Average Scores */}
        {data?.avgScores && data.avgScores.avgOverall > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
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
                <div key={c.label} className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${c.value >= 70 ? 'text-emerald-600' : c.value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Decision Breakdown + Fraud Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data?.decisions && data.decisions.total > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Decision Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl text-center dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold tabular-nums text-emerald-600">{data.decisions.approved}</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center dark:bg-amber-900/20">
                  <p className="text-2xl font-bold tabular-nums text-amber-600">{data.decisions.conditionalApproved}</p>
                  <p className="text-xs text-muted-foreground mt-1">Conditional</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center dark:bg-red-900/20">
                  <p className="text-2xl font-bold tabular-nums text-red-600">{data.decisions.rejected}</p>
                  <p className="text-xs text-muted-foreground mt-1">Rejected</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-600" />
              Research & Fraud Intelligence
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-violet-50 rounded-xl text-center dark:bg-violet-900/20">
                <p className="text-2xl font-bold tabular-nums text-violet-600">{data?.fraudStats?.totalFindings ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">OSINT Findings</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center dark:bg-red-900/20">
                <p className={`text-2xl font-bold tabular-nums ${(data?.fraudStats?.fraudSignals ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {data?.fraudStats?.fraudSignals ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Fraud Signals</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Industry Breakdown */}
        {data?.industryBreakdown && data.industryBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Industry Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Industry</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Applications</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {data.industryBreakdown.map((row) => (
                    <tr key={row.industry} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-2.5 px-3 font-medium text-foreground">{row.industry}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{row.count}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{formatInr(row.avgAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Portfolio Summary */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Portfolio Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-xl">
              <p className="text-sm text-muted-foreground">Avg Five C&apos;s Score</p>
              <p className="text-2xl font-bold text-primary mt-1 tabular-nums">{data?.avgScores?.avgOverall ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-2">across all CAM evaluations</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl dark:bg-emerald-900/20">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{data?.portfolio?.approvalRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-2">{data?.decisions?.total ?? 0} decisions made</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl dark:bg-amber-900/20">
              <p className="text-sm text-muted-foreground">Total Requested</p>
              <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{formatInr(data?.portfolio?.totalRequested ?? '0')}</p>
              <p className="text-xs text-muted-foreground mt-2">Recommended: {formatInr(data?.portfolio?.totalRecommended ?? '0')}</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

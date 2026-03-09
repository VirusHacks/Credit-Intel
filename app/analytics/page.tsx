'use client';

import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import { PortfolioMetrics } from '@/components/analytics/portfolio-metrics';
import { RiskHeatmap } from '@/components/analytics/risk-heatmap';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { Card } from '@/components/ui/card';
import { Loader2, Shield, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
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
      <main className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
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
    <main className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-2">Monitor your portfolio performance and risk metrics</p>
          </div>

          {/* Filters */}
          <AnalyticsFilters />

          {/* Portfolio Metrics — real data */}
          <PortfolioMetrics data={data?.portfolio ?? undefined} signalStats={data?.signalStats ?? undefined} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MetricsChart applications={[]} />
            <RiskHeatmap />
          </div>

          {/* 5Cs Average Scores */}
          {data?.avgScores && data.avgScores.avgOverall > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
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
                  <div key={c.label} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                    <p className={`text-2xl font-bold ${c.value >= 70 ? 'text-green-600' : c.value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {c.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Decision Breakdown + Fraud Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {data?.decisions && data.decisions.total > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Decision Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{data.decisions.approved}</p>
                    <p className="text-xs text-gray-500 mt-1">Approved</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">{data.decisions.conditionalApproved}</p>
                    <p className="text-xs text-gray-500 mt-1">Conditional</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{data.decisions.rejected}</p>
                    <p className="text-xs text-gray-500 mt-1">Rejected</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Research & Fraud Intelligence
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{data?.fraudStats?.totalFindings ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">OSINT Findings</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className={`text-2xl font-bold ${(data?.fraudStats?.fraudSignals ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {data?.fraudStats?.fraudSignals ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fraud Signals</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Industry Breakdown */}
          {data?.industryBreakdown && data.industryBreakdown.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Industry Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-gray-500">Industry</th>
                      <th className="text-right py-2 px-3 text-gray-500">Applications</th>
                      <th className="text-right py-2 px-3 text-gray-500">Avg Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.industryBreakdown.map((row) => (
                      <tr key={row.industry} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-900">{row.industry}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{row.count}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{formatInr(row.avgAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Portfolio Summary from real data */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Five C&apos;s Score</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{data?.avgScores?.avgOverall ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-2">across all CAM evaluations</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{data?.portfolio?.approvalRate ?? 0}%</p>
                <p className="text-xs text-gray-500 mt-2">{data?.decisions?.total ?? 0} decisions made</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Requested</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{formatInr(data?.portfolio?.totalRequested ?? '0')}</p>
                <p className="text-xs text-gray-500 mt-2">Recommended: {formatInr(data?.portfolio?.totalRecommended ?? '0')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

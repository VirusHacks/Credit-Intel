'use client';

import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import { PortfolioMetrics } from '@/components/analytics/portfolio-metrics';
import { RiskHeatmap } from '@/components/analytics/risk-heatmap';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { Card } from '@/components/ui/card';

export default function AnalyticsPage() {
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

          {/* Portfolio Metrics */}
          <PortfolioMetrics />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MetricsChart applications={[]} />
            <RiskHeatmap />
          </div>

          {/* Comparative Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Your Avg Credit Score</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">712</p>
                <p className="text-xs text-gray-500 mt-2">vs Industry Avg: 680</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Default Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">2.3%</p>
                <p className="text-xs text-gray-500 mt-2">vs Industry: 4.1%</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">68%</p>
                <p className="text-xs text-gray-500 mt-2">vs Industry: 62%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

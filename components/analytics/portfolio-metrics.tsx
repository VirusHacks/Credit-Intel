'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, FileText, Activity, Shield } from 'lucide-react';

interface PortfolioData {
  totalApplications: number;
  completedAnalyses: number;
  approvalRate: number;
  totalRequested: string;
  totalRecommended: string;
}

interface SignalData {
  totalSignals: number;
  avgConfidence: number;
  unverifiedCount: number;
}

interface PortfolioMetric {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function formatInr(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return '₹0';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function PortfolioMetrics({
  data,
  signalStats,
}: {
  data?: PortfolioData;
  signalStats?: SignalData;
}) {
  const metrics: PortfolioMetric[] = [
    {
      label: 'Total Applications',
      value: String(data?.totalApplications ?? 0),
      icon: <FileText className="w-5 h-5 text-blue-600" />,
    },
    {
      label: 'Completed Analyses',
      value: String(data?.completedAnalyses ?? 0),
      icon: <Users className="w-5 h-5 text-purple-600" />,
    },
    {
      label: 'Approval Rate',
      value: `${data?.approvalRate ?? 0}%`,
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
    },
    {
      label: 'Total Requested',
      value: formatInr(data?.totalRequested ?? '0'),
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
    },
    {
      label: 'Agent Signals',
      value: String(signalStats?.totalSignals ?? 0),
      icon: <Activity className="w-5 h-5 text-amber-600" />,
    },
    {
      label: 'Avg Confidence',
      value: `${signalStats?.avgConfidence ?? 0}%`,
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
            <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
              {metric.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { FileText, Users, TrendingUp, Activity, Shield } from 'lucide-react';

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
  const metrics = [
    { label: 'Total Applications', value: String(data?.totalApplications ?? 0), icon: <FileText className="w-5 h-5 text-white/40" /> },
    { label: 'Completed Analyses', value: String(data?.completedAnalyses ?? 0), icon: <Users className="w-5 h-5 text-white/40" /> },
    { label: 'Approval Rate',       value: `${data?.approvalRate ?? 0}%`,         icon: <TrendingUp className="w-5 h-5 text-white/40" /> },
    { label: 'Total Requested',     value: formatInr(data?.totalRequested ?? '0'), icon: <TrendingUp className="w-5 h-5 text-white/40" /> },
    { label: 'Agent Signals',       value: String(signalStats?.totalSignals ?? 0), icon: <Activity className="w-5 h-5 text-white/40" /> },
    { label: 'Avg Confidence',      value: `${signalStats?.avgConfidence ?? 0}%`,  icon: <Shield className="w-5 h-5 text-white/40" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-white tabular-nums">{metric.value}</p>
            </div>
            <div className="flex-shrink-0 p-2 bg-white/5 rounded-lg">
              {metric.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

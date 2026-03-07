'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, FileText } from 'lucide-react';

interface PortfolioMetric {
  label: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
}

const metrics: PortfolioMetric[] = [
  {
    label: 'Total Applications',
    value: '247',
    trend: 12,
    icon: <FileText className="w-5 h-5 text-blue-600" />,
  },
  {
    label: 'Avg Credit Score',
    value: '712',
    trend: 5,
    icon: <TrendingUp className="w-5 h-5 text-green-600" />,
  },
  {
    label: 'Approval Rate',
    value: '68%',
    trend: -2,
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
  },
  {
    label: 'Portfolio Risk',
    value: 'Medium',
    trend: 3,
    icon: <TrendingDown className="w-5 h-5 text-amber-600" />,
  },
  {
    label: 'Total Loan Value',
    value: '$48.2M',
    trend: 18,
    icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
  },
  {
    label: 'Active Companies',
    value: '156',
    trend: 8,
    icon: <Users className="w-5 h-5 text-purple-600" />,
  },
];

export function PortfolioMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              {metric.trend !== undefined && (
                <p
                  className={`text-xs mt-2 ${
                    metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metric.trend >= 0 ? '↑' : '↓'} {Math.abs(metric.trend)}% vs last month
                </p>
              )}
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

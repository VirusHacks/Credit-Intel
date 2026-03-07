'use client';

import { Card } from '@/components/ui/card';
import { CreditApplication } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricsChartProps {
  applications: CreditApplication[];
}

export function MetricsChart({ applications }: MetricsChartProps) {
  // Status distribution data
  const statusData = [
    {
      name: 'Approved',
      value: applications.filter((app) => app.status === 'approved').length,
    },
    {
      name: 'Under Review',
      value: applications.filter((app) => app.status === 'under_review').length,
    },
    {
      name: 'Submitted',
      value: applications.filter((app) => app.status === 'submitted').length,
    },
    {
      name: 'Rejected',
      value: applications.filter((app) => app.status === 'rejected').length,
    },
    {
      name: 'Draft',
      value: applications.filter((app) => app.status === 'draft').length,
    },
  ];

  // Risk distribution
  const riskData = [
    {
      name: 'Low Risk',
      value: applications.filter(
        (app) => app.creditAssessment.riskRating === 'low'
      ).length,
    },
    {
      name: 'Medium Risk',
      value: applications.filter(
        (app) => app.creditAssessment.riskRating === 'medium'
      ).length,
    },
    {
      name: 'High Risk',
      value: applications.filter(
        (app) => app.creditAssessment.riskRating === 'high'
      ).length,
    },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const STATUS_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#6b7280'];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Application Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Risk Rating Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

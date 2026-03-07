'use client';

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

const data = [
  { name: 'Industry Risk', low: 45, medium: 30, high: 25 },
  { name: 'Financial Risk', low: 35, medium: 40, high: 25 },
  { name: 'Management Risk', low: 50, medium: 25, high: 25 },
  { name: 'Market Risk', low: 40, medium: 35, high: 25 },
  { name: 'Operational Risk', low: 30, medium: 40, high: 30 },
];

const colors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function RiskHeatmap() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Bar dataKey="low" fill={colors.low} name="Low Risk" />
          <Bar dataKey="medium" fill={colors.medium} name="Medium Risk" />
          <Bar dataKey="high" fill={colors.high} name="High Risk" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

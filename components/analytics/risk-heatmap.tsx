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

const data = [
  { name: 'Industry Risk',    low: 45, medium: 30, high: 25 },
  { name: 'Financial Risk',   low: 35, medium: 40, high: 25 },
  { name: 'Management Risk',  low: 50, medium: 25, high: 25 },
  { name: 'Market Risk',      low: 40, medium: 35, high: 25 },
  { name: 'Operational Risk', low: 30, medium: 40, high: 30 },
];

// Monochromatic: use white opacity levels instead of green/amber/red
const colors = {
  low:    'rgba(255,255,255,0.70)',
  medium: 'rgba(255,255,255,0.40)',
  high:   'rgba(255,255,255,0.20)',
};

export function RiskHeatmap() {
  return (
    <div className="rounded-lg border border-[#222222] bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-white mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.40)' }}
          />
          <YAxis
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.40)', fontSize: 11 }}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.40)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161616',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}
          />
          <Bar dataKey="low"    fill={colors.low}    name="Low Risk" />
          <Bar dataKey="medium" fill={colors.medium} name="Medium Risk" />
          <Bar dataKey="high"   fill={colors.high}   name="High Risk" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

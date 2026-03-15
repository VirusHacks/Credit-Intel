'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricsChartProps {
  pipelineStatus?: Array<{ pipelineStatus: string; count: number }>;
  // Fallback if risk data isn't provided directly in analytics yet, but we'll mock it or pass it if available
  riskData?: Array<{ name: string; value: number }>;
}

export function MetricsChart({ pipelineStatus = [], riskData = [] }: MetricsChartProps) {
  // Format pipeline status for PieChart
  const statusData = pipelineStatus
    .map((item) => ({
      name: item.pipelineStatus
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      value: item.count,
    }))
    .filter((entry) => entry.value > 0);

  // If no risk data provided, show mock data for demo purposes since the DB is empty right now
  const finalRiskData = riskData.length > 0 ? riskData : [
    { name: 'Low Risk', value: 8 },
    { name: 'Medium Risk', value: 5 },
    { name: 'High Risk', value: 2 },
  ];

  // Monochromatic palette for pie chart slices
  const STATUS_COLORS = [
    'rgba(255,255,255,0.8)',
    'rgba(255,255,255,0.6)',
    'rgba(255,255,255,0.4)',
    'rgba(255,255,255,0.2)',
    'rgba(255,255,255,0.1)',
  ];

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-2">Application Status Distribution</h3>
        {statusData.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-sm text-white/30 h-[260px]">
            No status data available
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-2">Risk Rating Distribution</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill="rgba(255,255,255,0.6)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

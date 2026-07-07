'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SourcePerformance } from '@/types';

interface SourceChartProps {
  data: SourcePerformance[];
}

export default function SourceChart({ data }: SourceChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    source: d.source?.replace(/_/g, ' ') ?? 'Unknown',
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Source Performance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
            <XAxis
              dataKey="source"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={false}
            />
            <YAxis tick={{ fill: '#999', fontSize: 11 }} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ color: '#999', fontSize: 12 }} />
            <Bar dataKey="leads" fill="#6366F1" radius={[4, 4, 0, 0]} name="Leads" />
            <Bar dataKey="qualified" fill="#22C55E" radius={[4, 4, 0, 0]} name="Qualified" />
            <Bar dataKey="hot" fill="#EF4444" radius={[4, 4, 0, 0]} name="Hot" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

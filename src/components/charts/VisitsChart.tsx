'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { VisitsOverTime } from '@/types';

interface VisitsChartProps {
  data: VisitsOverTime[];
}

export default function VisitsChart({ data }: VisitsChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 md:p-6">
      <h3 className="text-xs sm:text-sm font-semibold text-text-primary mb-3 sm:mb-4">Site Visits Over Time</h3>
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={false}
              tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            />
            <YAxis tick={{ fill: '#999', fontSize: 11 }} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            />
            <Legend iconType="circle" wrapperStyle={{ color: '#999', fontSize: 12 }} />
            <Line type="monotone" dataKey="booked" stroke="#6366F1" strokeWidth={2} dot={false} name="Booked" />
            <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} dot={false} name="Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

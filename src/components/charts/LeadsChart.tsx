'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LeadsOverTime } from '@/types';

interface LeadsChartProps {
  data: LeadsOverTime[];
}

export default function LeadsChart({ data }: LeadsChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 md:p-6">
      <h3 className="text-xs sm:text-sm font-semibold text-text-primary mb-3 sm:mb-4">Leads Over Time</h3>
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              labelFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            <Legend iconType="circle" wrapperStyle={{ color: '#999', fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#6366F1"
              fill="url(#leadsGrad)"
              strokeWidth={2}
              name="Total Leads"
            />
            <Area
              type="monotone"
              dataKey="qualified"
              stroke="#22C55E"
              fill="url(#qualGrad)"
              strokeWidth={2}
              name="Qualified"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

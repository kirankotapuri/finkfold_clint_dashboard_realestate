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
import type { FunnelStage } from '@/types';

interface FunnelChartProps {
  data: FunnelStage[];
}

const COLORS = ['#6366F1', '#818CF8', '#A78BFA', '#C084FC'];

export default function FunnelChart({ data }: FunnelChartProps) {
  const sorted = [...data].sort((a, b) => a.ord - b.ord);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Conversion Funnel</h3>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} />
            <YAxis
              type="category"
              dataKey="stage_label"
              tick={{ fill: '#999', fontSize: 12 }}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar
              dataKey="count"
              fill="#6366F1"
              radius={[0, 6, 6, 0]}
              label={{ position: 'right', fill: '#999', fontSize: 12 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ScoreSplit } from '@/types';

interface ScoreDonutProps {
  data: ScoreSplit[];
}

const COLORS: Record<string, string> = {
  hot: '#EF4444',
  warm: '#F97316',
  cold: '#6B7280',
};

export default function ScoreDonut({ data }: ScoreDonutProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 md:p-6">
      <h3 className="text-xs sm:text-sm font-semibold text-text-primary mb-3 sm:mb-4">Lead Score Split</h3>
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="count"
              nameKey="score"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.score} fill={COLORS[entry.score] || '#6B7280'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value, name) => [String(value), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ color: '#999', fontSize: 12 }}
              formatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  iconColor?: string;
}

export default function MetricCard({ label, value, icon: Icon, trend, iconColor = 'text-accent' }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className="text-xs text-text-secondary">{trend}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg bg-accent/10 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

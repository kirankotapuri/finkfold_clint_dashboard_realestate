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
      className="bg-card border border-border rounded-xl p-3 sm:p-4 md:p-5 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className="text-[10px] sm:text-xs text-text-secondary">{trend}</p>
          )}
        </div>
        <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-accent/10 ${iconColor} shrink-0 ml-2`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </motion.div>
  );
}

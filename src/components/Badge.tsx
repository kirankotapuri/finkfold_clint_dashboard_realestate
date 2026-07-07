'use client';

const scoreColors: Record<string, string> = {
  hot: 'bg-hot/15 text-hot border-hot/30',
  warm: 'bg-warm/15 text-warm border-warm/30',
  cold: 'bg-cold/15 text-cold border-cold/30',
};

const stageColors: Record<string, string> = {
  new: 'bg-accent/15 text-accent border-accent/30',
  qualifying: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  visit_booked: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  won: 'bg-success/15 text-success border-success/30',
  lost: 'bg-cold/15 text-cold border-cold/30',
};

const visitStatusColors: Record<string, string> = {
  scheduled: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-cold/15 text-cold border-cold/30',
  no_show: 'bg-hot/15 text-hot border-hot/30',
};

interface BadgeProps {
  label: string;
  type?: 'score' | 'stage' | 'visit' | 'default';
}

export default function Badge({ label, type = 'default' }: BadgeProps) {
  let colorClass = 'bg-card text-text-secondary border-border';

  if (type === 'score' && scoreColors[label]) {
    colorClass = scoreColors[label];
  } else if (type === 'stage' && stageColors[label]) {
    colorClass = stageColors[label];
  } else if (type === 'visit' && visitStatusColors[label]) {
    colorClass = visitStatusColors[label];
  }

  const displayLabel = label.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClass}`}
    >
      {displayLabel}
    </span>
  );
}

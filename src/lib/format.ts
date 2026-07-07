export function formatBudget(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatBudgetRange(min: number | null, max: number | null): string {
  if (!min && !max) return '—';
  if (min && !max) return `${formatBudget(min)}+`;
  if (!min && max) return `Up to ${formatBudget(max)}`;
  return `${formatBudget(min)} – ${formatBudget(max)}`;
}

export function maskPhone(phone: string | null): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 6) return cleaned;
  return cleaned.slice(0, 4) + '•••••' + cleaned.slice(-3);
}

export function timeAgo(date: string | null): string {
  if (!date) return '—';
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function capitalizeFirst(s: string | null): string {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

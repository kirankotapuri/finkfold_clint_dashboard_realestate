'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import { CalendarCheck } from 'lucide-react';
import type { SiteVisit } from '@/types';

const STATUS_OPTIONS = ['all', 'scheduled', 'completed', 'cancelled', 'no_show'] as const;

export default function VisitsPage() {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('re_site_visits')
      .select('*, re_buyer_leads(name), re_properties(title), re_agents(name)')
      .order('scheduled_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;

    if (data) {
      setVisits(
        data.map((v: Record<string, unknown>) => ({
          ...v,
          lead_name: (v.re_buyer_leads as Record<string, string> | null)?.name ?? 'Unknown',
          property_title: (v.re_properties as Record<string, string> | null)?.title ?? '—',
          agent_name: (v.re_agents as Record<string, string> | null)?.name ?? '—',
        })) as SiteVisit[]
      );
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  async function updateVisitStatus(visitId: string, newStatus: string) {
    await supabase
      .from('re_site_visits')
      .update({ status: newStatus })
      .eq('id', visitId);

    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: newStatus as SiteVisit['status'] } : v))
    );
  }

  async function updateFeedback(visitId: string, feedback: string) {
    await supabase
      .from('re_site_visits')
      .update({ feedback })
      .eq('id', visitId);

    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, feedback } : v))
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-accent" />
            Site Visits
          </h1>
          <p className="text-sm text-text-muted">{visits.length} visits</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date & Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Buyer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Property</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Notes</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    No site visits found
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-text-primary text-xs whitespace-nowrap">
                      {formatDateTime(visit.scheduled_at)}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {visit.lead_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {visit.property_title || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {visit.agent_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={visit.status}
                        onChange={(e) => updateVisitStatus(visit.id, e.target.value)}
                        className="bg-secondary border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell max-w-[200px] truncate">
                      {visit.notes || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <input
                        type="text"
                        defaultValue={visit.feedback || ''}
                        placeholder="Add feedback..."
                        onBlur={(e) => {
                          if (e.target.value !== (visit.feedback || '')) {
                            updateFeedback(visit.id, e.target.value);
                          }
                        }}
                        className="bg-secondary border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted w-full focus:outline-none focus:border-accent"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

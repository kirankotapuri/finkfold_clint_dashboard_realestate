'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/Badge';
import { maskPhone, formatBudgetRange, timeAgo } from '@/lib/format';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Lead } from '@/types';

const PAGE_SIZE = 25;

const SCORE_OPTIONS = ['all', 'hot', 'warm', 'cold'] as const;
const STAGE_OPTIONS = ['all', 'new', 'qualifying', 'visit_booked', 'won', 'lost'] as const;
const SOURCE_OPTIONS = ['all', 'facebook_ads', 'google_ads', 'website', 'whatsapp', 'voice'] as const;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('re_buyer_leads')
      .select('*, re_agents(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (scoreFilter !== 'all') query = query.eq('lead_score', scoreFilter);
    if (stageFilter !== 'all') query = query.eq('stage', stageFilter);
    if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
    }

    const { data, count } = await query;

    if (data) {
      setLeads(
        data.map((l: Record<string, unknown>) => ({
          ...l,
          agent_name: (l.re_agents as Record<string, string> | null)?.name ?? null,
        })) as Lead[]
      );
    }
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, scoreFilter, stageFilter, sourceFilter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [scoreFilter, stageFilter, sourceFilter, search]);

  // Realtime: prepend new leads
  useEffect(() => {
    const channel = supabase
      .channel('leads-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 're_buyer_leads' },
        (payload) => {
          if (page === 0) {
            setLeads((prev) => [payload.new as Lead, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotal((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Leads</h1>
        <p className="text-sm text-text-muted">{total} total leads</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
        >
          {SCORE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Scores' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
        >
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Stages' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
        >
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Budget</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden xl:table-cell">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium text-text-primary hover:text-accent transition-colors"
                      >
                        {lead.name || 'Unknown'}
                        {lead.bot_paused && (
                          <span className="ml-2 text-[10px] bg-warm/15 text-warm px-1.5 py-0.5 rounded">Human</span>
                        )}
                        {lead.opted_out && (
                          <span className="ml-2 text-[10px] bg-cold/15 text-cold px-1.5 py-0.5 rounded">Unsub</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                      {maskPhone(lead.phone)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {lead.property_type_interest || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden lg:table-cell text-xs">
                      {formatBudgetRange(lead.budget_min, lead.budget_max)}
                    </td>
                    <td className="px-4 py-3">
                      {lead.lead_score ? <Badge label={lead.lead_score} type="score" /> : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell text-xs capitalize">
                      {lead.source?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {lead.stage ? <Badge label={lead.stage} type="stage" /> : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                      {timeAgo(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs hidden xl:table-cell">
                      {lead.agent_name || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-secondary border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-secondary border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

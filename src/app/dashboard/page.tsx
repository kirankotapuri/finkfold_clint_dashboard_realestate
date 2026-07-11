'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import MetricCard from '@/components/MetricCard';
import FunnelChart from '@/components/charts/FunnelChart';
import LeadsChart from '@/components/charts/LeadsChart';
import SourceChart from '@/components/charts/SourceChart';
import ScoreDonut from '@/components/charts/ScoreDonut';
import { Users, Flame, CheckCircle, CalendarCheck, Globe, Zap } from 'lucide-react';
import { capitalizeFirst } from '@/lib/format';
import type {
  DashSummary,
  FunnelStage,
  LeadsOverTime,
  SourcePerformance,
  ScoreSplit,
} from '@/types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashSummary | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [leadsOverTime, setLeadsOverTime] = useState<LeadsOverTime[]>([]);
  const [sourcePerf, setSourcePerf] = useState<SourcePerformance[]>([]);
  const [scoreSplit, setScoreSplit] = useState<ScoreSplit[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const effectiveDays = days === 0 ? 36500 : days; // 0 = all time (~100 years)
    const chartDays = days === 0 ? 36500 : Math.max(days, 14);
    const [summaryRes, funnelRes, leadsRes, sourceRes, scoreRes] = await Promise.all([
      supabase.rpc('ff_dash_summary', { days: effectiveDays }),
      supabase.rpc('ff_dash_funnel', { days: effectiveDays }),
      supabase.rpc('ff_dash_leads_over_time', { days: chartDays }),
      supabase.rpc('ff_dash_source_performance', { days: effectiveDays }),
      supabase.rpc('ff_dash_score_split'),
    ]);

    if (summaryRes.data) setSummary(Array.isArray(summaryRes.data) ? summaryRes.data[0] : summaryRes.data);
    if (funnelRes.data) setFunnel(funnelRes.data);
    if (leadsRes.data) setLeadsOverTime(leadsRes.data);
    if (sourceRes.data) setSourcePerf(sourceRes.data);
    if (scoreRes.data) setScoreSplit(scoreRes.data);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    fetchData();

    // Poll charts every 60s
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime: listen for new leads to update summary
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 're_buyer_leads' },
        () => {
          // Re-fetch summary on new lead
          supabase.rpc('ff_dash_summary', { days }).then(({ data }) => {
            if (data) setSummary(Array.isArray(data) ? data[0] : data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-24 sm:h-28" />
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl h-56 sm:h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-xs sm:text-sm text-text-muted">Your lead generation performance at a glance</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {[7, 14, 30, 90, 180, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                days === d
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {d <= 90 ? `${d}d` : d === 180 ? '6m' : '1y'}
            </button>
          ))}
          <button
            onClick={() => setDays(0)}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              days === 0
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            All time
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          label="Leads this period"
          value={summary?.leads_in_period ?? 0}
          icon={Users}
        />
        <MetricCard
          label="Hot leads"
          value={summary?.hot_leads ?? 0}
          icon={Flame}
          iconColor="text-hot"
        />
        <MetricCard
          label="Qualified"
          value={summary?.qualified_leads ?? 0}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <MetricCard
          label="Site visits"
          value={summary?.upcoming_visits ?? 0}
          icon={CalendarCheck}
          iconColor="text-purple-400"
        />
        <MetricCard
          label="Best source"
          value={capitalizeFirst(summary?.best_source ?? null)}
          icon={Globe}
          iconColor="text-warm"
        />
        <MetricCard
          label="Avg response"
          value="< 1 min"
          icon={Zap}
          trend="AI-powered"
          iconColor="text-success"
        />
      </div>

      {/* Conversion Funnel — full width */}
      <FunnelChart data={funnel} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <LeadsChart data={leadsOverTime} />
        <SourceChart data={sourcePerf} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <ScoreDonut data={scoreSplit} />
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-text-primary">{summary?.total_leads ?? 0}</p>
          <p className="text-sm text-text-muted mt-1">Total leads all time</p>
        </div>
      </div>
    </div>
  );
}

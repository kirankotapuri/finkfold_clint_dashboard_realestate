'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/Badge';
import { maskPhone, formatBudgetRange, formatDate, formatDateTime, capitalizeFirst } from '@/lib/format';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  User,
  MessageSquare,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Lead, Conversation, ChatMessage, SiteVisit } from '@/types';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      const [leadRes, convoRes, visitsRes] = await Promise.all([
        supabase
          .from('re_buyer_leads')
          .select('*, re_agents(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('re_lead_conversations')
          .select('context, last_message_at')
          .eq('lead_id', id)
          .single(),
        supabase
          .from('re_site_visits')
          .select('*, re_buyer_leads(name), re_properties(title), re_agents(name)')
          .eq('lead_id', id)
          .order('scheduled_at', { ascending: false }),
      ]);

      if (leadRes.data) {
        const l = leadRes.data as Record<string, unknown>;
        setLead({
          ...l,
          agent_name: (l.re_agents as Record<string, string> | null)?.name ?? undefined,
        } as Lead);
      }

      if (convoRes.data?.context) {
        const ctx = convoRes.data.context;
        setConversation(Array.isArray(ctx) ? ctx : []);
      }

      if (visitsRes.data) {
        setVisits(
          visitsRes.data.map((v: Record<string, unknown>) => ({
            ...v,
            lead_name: (v.re_buyer_leads as Record<string, string> | null)?.name ?? undefined,
            property_title: (v.re_properties as Record<string, string> | null)?.title ?? undefined,
            agent_name: (v.re_agents as Record<string, string> | null)?.name ?? undefined,
          })) as SiteVisit[]
        );
      }

      setLoading(false);
    }
    fetchLead();
  }, [id]);

  async function updateStage(newStage: string) {
    if (!lead) return;
    setStageUpdating(true);
    await supabase
      .from('re_buyer_leads')
      .update({ stage: newStage })
      .eq('id', lead.id);
    setLead({ ...lead, stage: newStage as Lead['stage'] });
    setStageUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Lead not found</p>
        <button onClick={() => router.back()} className="text-accent text-sm mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to leads
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Lead profile */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{lead.name || 'Unknown'}</h2>
                <p className="text-xs text-text-muted">{formatDate(lead.created_at)}</p>
              </div>
              <div className="flex gap-2">
                {lead.lead_score && <Badge label={lead.lead_score} type="score" />}
                {lead.stage && <Badge label={lead.stage} type="stage" />}
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mb-4">
              {lead.bot_paused && (
                <span className="text-xs bg-warm/15 text-warm px-2 py-1 rounded-full border border-warm/30">
                  Human handling
                </span>
              )}
              {lead.opted_out && (
                <span className="text-xs bg-cold/15 text-cold px-2 py-1 rounded-full border border-cold/30">
                  Unsubscribed
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              <DetailRow
                icon={Phone}
                label="Phone"
                value={
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {phoneRevealed ? lead.phone || '—' : maskPhone(lead.phone)}
                    </span>
                    <button
                      onClick={() => setPhoneRevealed(!phoneRevealed)}
                      className="text-text-muted hover:text-accent"
                    >
                      {phoneRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                }
              />
              <DetailRow icon={Mail} label="Email" value={lead.email || '—'} />
              <DetailRow icon={MapPin} label="Areas" value={lead.preferred_areas?.join(', ') || '—'} />
              <DetailRow icon={IndianRupee} label="Budget" value={formatBudgetRange(lead.budget_min, lead.budget_max)} />
              <DetailRow icon={User} label="Type" value={lead.property_type_interest || '—'} />
              <DetailRow icon={Calendar} label="Timeline" value={capitalizeFirst(lead.timeline)} />

              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Purpose:</span> {capitalizeFirst(lead.purpose)}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Language:</span> {lead.language || '—'}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Source:</span> {capitalizeFirst(lead.source)}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Agent:</span> {lead.agent_name || '—'}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Last inbound:</span> {formatDateTime(lead.last_inbound_at)}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Last contacted:</span> {formatDateTime(lead.last_contacted_at)}
                </p>
              </div>
            </div>

            {/* Stage update */}
            <div className="mt-4 pt-4 border-t border-border">
              <label className="text-xs text-text-muted block mb-1">Update Stage</label>
              <select
                value={lead.stage || ''}
                onChange={(e) => updateStage(e.target.value)}
                disabled={stageUpdating}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="new">New</option>
                <option value="qualifying">Qualifying</option>
                <option value="visit_booked">Visit Booked</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Site visits for this lead */}
          {visits.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Site Visits ({visits.length})
              </h3>
              <div className="space-y-3">
                {visits.map((v) => (
                  <div key={v.id} className="p-3 bg-secondary rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-primary font-medium">
                        {v.property_title || 'Property'}
                      </span>
                      <Badge label={v.status} type="visit" />
                    </div>
                    <p className="text-xs text-text-muted">{formatDateTime(v.scheduled_at)}</p>
                    {v.agent_name && (
                      <p className="text-xs text-text-muted">Agent: {v.agent_name}</p>
                    )}
                    {v.notes && (
                      <p className="text-xs text-text-secondary mt-1">{v.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: WhatsApp-style conversation */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl p-5 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-success" />
              WhatsApp Conversation
            </h3>

            {conversation.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                No conversation history
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] pr-2">
                {conversation.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-secondary text-text-primary rounded-bl-md'
                          : 'bg-accent/15 text-text-primary rounded-br-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

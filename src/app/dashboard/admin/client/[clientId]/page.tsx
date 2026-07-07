'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MetricCard from '@/components/MetricCard';
import Badge from '@/components/Badge';
import { maskPhone, formatBudgetRange, timeAgo, formatDateTime } from '@/lib/format';
import {
  ArrowLeft, Users, Flame, Trophy, CalendarCheck, Loader2,
  UserCheck, Building, MapPin, Clock, Pencil, Trash2, X, Check, KeyRound, Power,
} from 'lucide-react';

interface ClientData {
  client: { id: string; name: string; city: string | null; active: boolean; created_at: string; whatsapp_phone_number_id: string };
  leads: Array<{
    id: string; name: string | null; phone: string | null; email: string | null;
    lead_score: string | null; source: string | null; stage: string | null;
    created_at: string; property_type_interest: string | null;
    preferred_areas: string[] | null; budget_min: number | null; budget_max: number | null;
    purpose: string | null; timeline: string | null; bot_paused: boolean; opted_out: boolean;
    agent_name: string | null;
  }>;
  agents: Array<{ id: string; name: string }>;
  properties: Array<{ id: string; title: string; area: string | null; bhk_config: string | null }>;
  visits: Array<{
    id: string; scheduled_at: string; status: string; notes: string | null;
    feedback: string | null; lead_name: string; property_title: string | null; agent_name: string | null;
  }>;
  users: Array<{ user_id: string; role: string }>;
  stats: { totalLeads: number; hotLeads: number; warmLeads: number; wonLeads: number; scheduledVisits: number; completedVisits: number };
}

export default function AdminClientView() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isAdmin, session } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'visits' | 'setup'>('leads');

  // Edit/Delete state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/admin/client-data/${clientId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {}
    setLoading(false);
  }, [clientId, session?.access_token]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  if (!isAdmin) {
    return <div className="py-20 text-center text-text-muted">Admin access required</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Client not found</p>
        <button onClick={() => router.back()} className="text-accent text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const { client, leads, agents, properties, visits, stats } = data;

  function openEditModal() {
    setEditName(client.name);
    setEditCity(client.city || '');
    setEditWhatsapp(client.whatsapp_phone_number_id || '');
    setNewPassword('');
    setActionMsg(null);
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    setActionMsg(null);
    try {
      const body: Record<string, unknown> = { name: editName, city: editCity, whatsapp_phone_number_id: editWhatsapp };
      if (newPassword.trim()) body.newPassword = newPassword.trim();
      const res = await fetch(`/api/admin/manage-client/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setActionMsg({ type: 'success', text: 'Client updated successfully' });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update' });
    }
    setSaving(false);
  }

  async function handleToggleActive() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/manage-client/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ active: !client.active }),
      });
      if (!res.ok) throw new Error('Failed');
      setActionMsg({ type: 'success', text: client.active ? 'Client deactivated' : 'Client activated' });
      fetchData();
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to toggle status' });
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/manage-client/${clientId}?hard=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      router.push('/dashboard/admin');
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to delete client' });
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/admin')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {client.city && <span className="text-sm text-text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.city}</span>}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${client.active ? 'bg-success/15 text-success' : 'bg-cold/15 text-cold'}`}>
              {client.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={handleToggleActive} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              client.active ? 'bg-warm/10 text-warm hover:bg-warm/20' : 'bg-success/10 text-success hover:bg-success/20'
            }`}>
            <Power className="w-3.5 h-3.5" /> {client.active ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-hot/10 text-hot rounded-lg text-xs font-medium hover:bg-hot/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Action messages */}
      {actionMsg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
          actionMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-hot/10 text-hot'
        }`}>
          {actionMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {actionMsg.text}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-hot/5 border border-hot/20 rounded-xl p-5">
          <p className="text-sm text-text-primary font-medium">Are you sure you want to permanently delete "{client.name}"?</p>
          <p className="text-xs text-text-muted mt-1">This will remove the company, their login accounts, agents, and properties. Leads and conversations will remain orphaned.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleDelete} disabled={saving}
              className="px-4 py-2 bg-hot text-white rounded-lg text-sm font-medium hover:bg-hot/90 disabled:opacity-50">
              {saving ? 'Deleting...' : 'Yes, Delete Permanently'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Edit Client</h3>
              <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Company Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">City</label>
                <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">WhatsApp Phone Number ID</label>
                <input type="text" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Reset Password <span className="text-text-muted">(leave blank to keep current)</span>
                </label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 bg-accent hover:bg-accent/90 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Leads" value={stats.totalLeads} icon={Users} />
        <MetricCard label="Hot Leads" value={stats.hotLeads} icon={Flame} iconColor="text-hot" />
        <MetricCard label="Warm Leads" value={stats.warmLeads} icon={Flame} iconColor="text-warm" />
        <MetricCard label="Won Deals" value={stats.wonLeads} icon={Trophy} iconColor="text-success" />
        <MetricCard label="Scheduled Visits" value={stats.scheduledVisits} icon={CalendarCheck} iconColor="text-accent" />
        <MetricCard label="Completed Visits" value={stats.completedVisits} icon={CalendarCheck} iconColor="text-success" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        {(['leads', 'visits', 'setup'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === t ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            }`}>
            {t === 'setup' ? 'Agents & Properties' : t}
          </button>
        ))}
      </div>

      {/* ========== LEADS TAB ========== */}
      {activeTab === 'leads' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">{leads.length} Leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden lg:table-cell">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden sm:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden lg:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden xl:table-cell">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-text-muted">No leads yet</td></tr>
                ) : leads.map((l) => (
                  <tr key={l.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {l.name || 'Unknown'}
                      {l.bot_paused && <span className="ml-1.5 text-[10px] bg-warm/15 text-warm px-1.5 py-0.5 rounded">Human</span>}
                      {l.opted_out && <span className="ml-1.5 text-[10px] bg-cold/15 text-cold px-1.5 py-0.5 rounded">Unsub</span>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{maskPhone(l.phone)}</td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{l.property_type_interest || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell">{formatBudgetRange(l.budget_min, l.budget_max)}</td>
                    <td className="px-4 py-3">{l.lead_score ? <Badge label={l.lead_score} type="score" /> : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs capitalize hidden sm:table-cell">{l.source?.replace(/_/g, ' ') || '—'}</td>
                    <td className="px-4 py-3">{l.stage ? <Badge label={l.stage} type="stage" /> : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell">{l.agent_name || '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden xl:table-cell">{timeAgo(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== VISITS TAB ========== */}
      {activeTab === 'visits' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">{visits.length} Site Visits</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Buyer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden md:table-cell">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden sm:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">No site visits yet</td></tr>
                ) : visits.map((v) => (
                  <tr key={v.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-text-primary text-xs whitespace-nowrap">{formatDateTime(v.scheduled_at)}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">{v.lead_name}</td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{v.property_title || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{v.agent_name || '—'}</td>
                    <td className="px-4 py-3"><Badge label={v.status} type="visit" /></td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell max-w-[200px] truncate">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== AGENTS & PROPERTIES TAB ========== */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agents */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <UserCheck className="w-4 h-4 text-accent" />
              Sales Agents ({agents.length})
            </h3>
            <p className="text-xs text-text-muted mb-3">
              These are {client.name}'s sales team members. Leads get assigned to agents for follow-up after the AI chatbot qualifies them.
            </p>
            {agents.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">No agents configured</p>
            ) : (
              <div className="space-y-2">
                {agents.map((a) => {
                  const agentLeads = leads.filter(l => l.agent_name === a.name).length;
                  const agentHot = leads.filter(l => l.agent_name === a.name && l.lead_score === 'hot').length;
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="text-sm text-text-primary font-medium">{a.name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-muted">{agentLeads} leads</span>
                        {agentHot > 0 && <span className="text-hot font-medium">{agentHot} hot</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-accent" />
              Properties ({properties.length})
            </h3>
            <p className="text-xs text-text-muted mb-3">
              These are {client.name}'s real estate projects. Leads express interest in specific properties, and site visits are booked at these locations.
            </p>
            {properties.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">No properties configured</p>
            ) : (
              <div className="space-y-2">
                {properties.map((p) => {
                  const propVisits = visits.filter(v => v.property_title === p.title).length;
                  return (
                    <div key={p.id} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-primary font-medium">{p.title}</span>
                        {propVisits > 0 && <span className="text-xs text-text-muted">{propVisits} visits</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-text-muted">
                        {p.area && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.area}</span>}
                        {p.bhk_config && <span>{p.bhk_config}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              Client Info
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted">WhatsApp Phone ID</p>
                <p className="text-text-primary font-mono text-xs mt-0.5">{client.whatsapp_phone_number_id}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Dashboard Users</p>
                <p className="text-text-primary mt-0.5">{data.users.length}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Status</p>
                <p className="mt-0.5">{client.active ? '🟢 Active' : '🔴 Inactive'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Client Since</p>
                <p className="text-text-primary text-xs mt-0.5">{new Date(client.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

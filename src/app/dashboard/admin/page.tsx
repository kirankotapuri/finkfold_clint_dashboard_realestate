'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Building2,
  UserPlus,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  Users,
  Flame,
  CalendarCheck,
  BarChart3,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

interface AgentInput { name: string }
interface PropertyInput { title: string; area: string; bhk_config: string }

interface ClientRow {
  id: string;
  name: string;
  city: string | null;
  active: boolean;
  created_at: string;
  total_leads: number;
  hot_leads: number;
  total_visits: number;
  users: number;
}

interface Totals {
  total_clients: number;
  active_clients: number;
  total_leads: number;
  total_hot_leads: number;
  total_visits: number;
  total_users: number;
}

export default function AdminPage() {
  const { isAdmin, session } = useAuth();
  const [tab, setTab] = useState<'overview' | 'onboard'>('overview');

  // Overview state
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Onboard form state
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [userRole, setUserRole] = useState('owner');
  const [agents, setAgents] = useState<AgentInput[]>([]);
  const [properties, setProperties] = useState<PropertyInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);

  // Recent leads state
  const [recentLeads, setRecentLeads] = useState<{
    id: string; name: string | null; phone: string | null; lead_score: string | null;
    source: string | null; stage: string | null; created_at: string; client_name: string;
    property_type_interest: string | null;
  }[]>([]);

  const fetchOverview = useCallback(async () => {
    if (!session?.access_token) return;
    setOverviewLoading(true);
    try {
      const [overviewRes, leadsRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('/api/admin/recent-leads', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);
      const overviewData = await overviewRes.json();
      const leadsData = await leadsRes.json();
      if (overviewData.clients) setClients(overviewData.clients);
      if (overviewData.totals) setTotals(overviewData.totals);
      if (leadsData.leads) setRecentLeads(leadsData.leads);
    } catch {}
    setOverviewLoading(false);
  }, [session?.access_token]);

  useEffect(() => {
    if (isAdmin) fetchOverview();
  }, [isAdmin, fetchOverview]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-primary font-medium">Admin Access Required</p>
          <p className="text-sm text-text-muted mt-1">This page is only accessible to Finkfold administrators.</p>
        </div>
      </div>
    );
  }

  function addAgent() { setAgents([...agents, { name: '' }]); }
  function removeAgent(i: number) { setAgents(agents.filter((_, idx) => idx !== i)); }
  function updateAgent(i: number, name: string) { setAgents(agents.map((a, idx) => idx === i ? { name } : a)); }
  function addProperty() { setProperties([...properties, { title: '', area: '', bhk_config: '' }]); }
  function removeProperty(i: number) { setProperties(properties.filter((_, idx) => idx !== i)); }
  function updateProperty(i: number, field: keyof PropertyInput, value: string) {
    setProperties(properties.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function generatePassword() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setClientPassword(pw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          companyName, city, whatsappPhoneNumberId, clientEmail, clientPassword, userRole,
          agents: agents.filter((a) => a.name.trim()),
          properties: properties.filter((p) => p.title.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Failed to create client' });
      } else {
        setResult({ type: 'success', message: `Client "${companyName}" created successfully!`, details: data });
        setCompanyName(''); setCity(''); setWhatsappPhoneNumberId('');
        setClientEmail(''); setClientPassword(''); setUserRole('owner');
        setAgents([]); setProperties([]);
        fetchOverview(); // Refresh the overview
      }
    } catch {
      setResult({ type: 'error', message: 'Network error — check your connection' });
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-saffron" />
            Admin Panel
          </h1>
          <p className="text-sm text-text-muted">Manage all clients from one place</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'overview' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Overview
        </button>
        <button
          onClick={() => setTab('onboard')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'onboard' ? 'bg-saffron text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Onboard Client
        </button>
      </div>

      {/* ======================== OVERVIEW TAB ======================== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-28 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Totals */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Clients" value={totals?.total_clients ?? 0} icon={Building2} iconColor="text-accent" />
                <MetricCard label="Total Leads" value={totals?.total_leads ?? 0} icon={Users} iconColor="text-accent" />
                <MetricCard label="Hot Leads" value={totals?.total_hot_leads ?? 0} icon={Flame} iconColor="text-hot" />
                <MetricCard label="Site Visits" value={totals?.total_visits ?? 0} icon={CalendarCheck} iconColor="text-purple-400" />
              </div>

              {/* Clients table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary">All Clients</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">City</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Leads</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Hot</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Visits</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Users</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Created</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clients.filter(c => c.name !== 'Finkfold (Admin)').map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-text-primary">
                            <Link href={`/dashboard/admin/client/${c.id}`} className="hover:text-accent transition-colors">{c.name}</Link>
                          </td>
                          <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{c.city || '—'}</td>
                          <td className="px-4 py-3 text-center text-text-primary font-semibold">{c.total_leads}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={c.hot_leads > 0 ? 'text-hot font-semibold' : 'text-text-muted'}>{c.hot_leads}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-text-secondary hidden md:table-cell">{c.total_visits}</td>
                          <td className="px-4 py-3 text-center text-text-secondary hidden md:table-cell">{c.users}</td>
                          <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">{formatDate(c.created_at)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              c.active ? 'bg-success/15 text-success' : 'bg-cold/15 text-cold'
                            }`}>
                              {c.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/dashboard/admin/client/${c.id}`}
                              className="text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Leads Feed */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Recent Leads (All Clients)</h3>
                  <span className="text-xs text-text-muted">Last 50</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Lead</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Score</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Stage</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentLeads.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No leads yet</td></tr>
                      ) : recentLeads.map((l) => (
                        <tr key={l.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3 text-text-primary font-medium">{l.name || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{l.client_name}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {l.lead_score && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                l.lead_score === 'hot' ? 'bg-hot/15 text-hot border-hot/30' :
                                l.lead_score === 'warm' ? 'bg-warm/15 text-warm border-warm/30' :
                                'bg-cold/15 text-cold border-cold/30'
                              }`}>{l.lead_score}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs capitalize hidden md:table-cell">{l.source?.replace(/_/g, ' ') || '—'}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {l.stage && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">
                                {l.stage.replace(/_/g, ' ')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell">{l.property_type_interest || '—'}</td>
                          <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{formatDate(l.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================== ONBOARD TAB ======================== */}
      {tab === 'onboard' && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          {/* Company Info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-accent" />
              Company Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Company Name <span className="text-hot">*</span></label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="e.g. Prestige Group"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bangalore"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-muted mb-1">WhatsApp Phone Number ID <span className="text-hot">*</span></label>
                <input type="text" value={whatsappPhoneNumberId} onChange={(e) => setWhatsappPhoneNumberId(e.target.value)} required
                  placeholder="From Meta Business — e.g. 1234567890"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                <p className="text-[10px] text-text-muted mt-1">Found in Meta Business Suite → WhatsApp → API Setup → Phone Number ID</p>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-accent" />
              Client Login Credentials
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Email <span className="text-hot">*</span></label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required placeholder="client@company.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Password <span className="text-hot">*</span></label>
                <div className="flex gap-2">
                  <input type="text" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} required minLength={6}
                    placeholder="Min 6 characters"
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono" />
                  <button type="button" onClick={generatePassword}
                    className="px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors whitespace-nowrap">Generate</button>
                  {clientPassword && (
                    <button type="button" onClick={() => navigator.clipboard.writeText(clientPassword)}
                      className="px-2 py-2 bg-card border border-border rounded-lg text-text-muted hover:text-text-primary transition-colors" title="Copy password">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-text-muted mt-1">Share this password securely with the client. They can change it in Settings.</p>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Role</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agents */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Sales Agents <span className="text-text-muted font-normal">(optional)</span></h3>
              <button type="button" onClick={addAgent} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Agent
              </button>
            </div>
            {agents.length === 0 ? (
              <p className="text-xs text-text-muted">No agents added. You can add them later.</p>
            ) : (
              <div className="space-y-2">
                {agents.map((agent, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={agent.name} onChange={(e) => updateAgent(i, e.target.value)} placeholder={`Agent ${i + 1} name`}
                      className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                    <button type="button" onClick={() => removeAgent(i)} className="p-2 text-text-muted hover:text-hot transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Properties <span className="text-text-muted font-normal">(optional)</span></h3>
              <button type="button" onClick={addProperty} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Property
              </button>
            </div>
            {properties.length === 0 ? (
              <p className="text-xs text-text-muted">No properties added. You can add them later.</p>
            ) : (
              <div className="space-y-3">
                {properties.map((prop, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" value={prop.title} onChange={(e) => updateProperty(i, 'title', e.target.value)} placeholder="Project name"
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                      <input type="text" value={prop.area} onChange={(e) => updateProperty(i, 'area', e.target.value)} placeholder="Area / location"
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                      <input type="text" value={prop.bhk_config} onChange={(e) => updateProperty(i, 'bhk_config', e.target.value)} placeholder="BHK config"
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                    </div>
                    <button type="button" onClick={() => removeProperty(i)} className="p-2 text-text-muted hover:text-hot transition-colors mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-3 text-sm px-4 py-3 rounded-xl border ${
              result.type === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-hot/10 text-hot border-hot/20'
            }`}>
              {result.type === 'success' ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.details && (
                  <div className="mt-2 text-xs space-y-1 opacity-80">
                    <p>Client ID: {String(result.details.client_id)}</p>
                    <p>User ID: {String(result.details.user_id)}</p>
                    <p>Email: {String(result.details.email)}</p>
                    <p>Agents: {String(result.details.agents_created)} · Properties: {String(result.details.properties_created)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full bg-saffron hover:bg-saffron/90 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Creating Client...' : 'Create Client & Login'}
          </button>
        </form>
      )}
    </div>
  );
}

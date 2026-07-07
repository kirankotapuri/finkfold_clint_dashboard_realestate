import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/verify-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { clientId } = await params;

  try {
    // Fetch everything for this client in parallel
    const [clientRes, leadsRes, agentsRes, propertiesRes, visitsRes, usersRes] = await Promise.all([
      supabaseAdmin.from('ff_clients').select('*').eq('id', clientId).single(),
      supabaseAdmin.from('re_buyer_leads').select('id, name, phone, email, lead_score, source, stage, created_at, property_type_interest, preferred_areas, budget_min, budget_max, purpose, timeline, bot_paused, opted_out, agent_id')
        .eq('client_id', clientId).order('created_at', { ascending: false }).limit(100),
      supabaseAdmin.from('re_agents').select('id, name').eq('client_id', clientId),
      supabaseAdmin.from('re_properties').select('id, title, area, bhk_config').eq('client_id', clientId),
      supabaseAdmin.from('re_site_visits').select('id, lead_id, property_id, agent_id, scheduled_at, status, notes, feedback')
        .eq('client_id', clientId).order('scheduled_at', { ascending: false }).limit(50),
      supabaseAdmin.from('ff_client_users').select('user_id, role').eq('client_id', clientId).neq('role', 'finkfold_admin'),
    ]);

    if (clientRes.error) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const agents = agentsRes.data ?? [];
    const properties = propertiesRes.data ?? [];
    const agentMap = new Map(agents.map(a => [a.id, a.name]));
    const propMap = new Map(properties.map(p => [p.id, p.title]));

    // Enrich leads with agent names
    const leads = (leadsRes.data ?? []).map(l => ({
      ...l,
      agent_name: l.agent_id ? agentMap.get(l.agent_id) ?? null : null,
    }));

    // Enrich visits
    const visits = (visitsRes.data ?? []).map(v => ({
      ...v,
      agent_name: v.agent_id ? agentMap.get(v.agent_id) ?? null : null,
      property_title: v.property_id ? propMap.get(v.property_id) ?? null : null,
      lead_name: leads.find(l => l.id === v.lead_id)?.name ?? 'Unknown',
    }));

    // Stats
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.lead_score === 'hot').length;
    const warmLeads = leads.filter(l => l.lead_score === 'warm').length;
    const wonLeads = leads.filter(l => l.stage === 'won').length;
    const scheduledVisits = visits.filter(v => v.status === 'scheduled').length;
    const completedVisits = visits.filter(v => v.status === 'completed').length;

    return NextResponse.json({
      client: clientRes.data,
      leads,
      agents,
      properties,
      visits,
      users: usersRes.data ?? [],
      stats: { totalLeads, hotLeads, warmLeads, wonLeads, scheduledVisits, completedVisits },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

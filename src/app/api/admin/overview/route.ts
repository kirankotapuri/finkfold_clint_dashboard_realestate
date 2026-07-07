import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/verify-admin';

export async function GET(req: NextRequest) {
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get all clients
    const { data: clients } = await supabaseAdmin
      .from('ff_clients')
      .select('id, name, city, active, created_at')
      .order('created_at', { ascending: false });

    if (!clients) {
      return NextResponse.json({ clients: [], stats: [] });
    }

    // Get lead counts per client
    const { data: leadCounts } = await supabaseAdmin
      .from('re_buyer_leads')
      .select('client_id');

    // Get hot lead counts per client
    const { data: hotLeads } = await supabaseAdmin
      .from('re_buyer_leads')
      .select('client_id')
      .eq('lead_score', 'hot');

    // Get visit counts per client
    const { data: visitCounts } = await supabaseAdmin
      .from('re_site_visits')
      .select('client_id');

    // Get user counts per client
    const { data: userCounts } = await supabaseAdmin
      .from('ff_client_users')
      .select('client_id')
      .neq('role', 'finkfold_admin');

    // Aggregate
    const countBy = (arr: { client_id: string }[] | null, clientId: string) =>
      arr?.filter((r) => r.client_id === clientId).length ?? 0;

    const enriched = clients.map((c) => ({
      ...c,
      total_leads: countBy(leadCounts, c.id),
      hot_leads: countBy(hotLeads, c.id),
      total_visits: countBy(visitCounts, c.id),
      users: countBy(userCounts, c.id),
    }));

    const totals = {
      total_clients: clients.length,
      active_clients: clients.filter((c) => c.active).length,
      total_leads: leadCounts?.length ?? 0,
      total_hot_leads: hotLeads?.length ?? 0,
      total_visits: visitCounts?.length ?? 0,
      total_users: userCounts?.length ?? 0,
    };

    return NextResponse.json({ clients: enriched, totals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

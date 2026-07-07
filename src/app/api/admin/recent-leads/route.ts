import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/verify-admin';

export async function GET(req: NextRequest) {
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get recent leads across ALL clients (last 50)
    const { data: leads } = await supabaseAdmin
      .from('re_buyer_leads')
      .select('id, name, phone, lead_score, source, stage, created_at, client_id, property_type_interest')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get client names for mapping
    const { data: clients } = await supabaseAdmin
      .from('ff_clients')
      .select('id, name');

    const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? []);

    const enriched = (leads ?? []).map((l) => ({
      ...l,
      client_name: clientMap.get(l.client_id) ?? 'Unknown',
    }));

    return NextResponse.json({ leads: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

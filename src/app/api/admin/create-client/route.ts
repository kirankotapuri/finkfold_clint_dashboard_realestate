import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/verify-admin';

export async function POST(req: NextRequest) {
  // 1. Verify admin
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 });
  }

  // 2. Parse request body
  const body = await req.json();
  const {
    companyName,
    city,
    clientEmail,
    clientPassword,
    whatsappPhoneNumberId,
    userRole = 'owner',
    agents = [],     // [{ name: string }]
    properties = [], // [{ title: string, area?: string, bhk_config?: string }]
  } = body;

  if (!companyName?.trim() || !clientEmail?.trim() || !clientPassword || !whatsappPhoneNumberId?.trim()) {
    return NextResponse.json(
      { error: 'Company name, WhatsApp Phone Number ID, email, and password are required' },
      { status: 400 }
    );
  }

  if (clientPassword.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  try {
    // 3. Create the client company row
    const { data: client, error: clientError } = await supabaseAdmin
      .from('ff_clients')
      .insert({
        name: companyName.trim(),
        city: city?.trim() || null,
        whatsapp_phone_number_id: whatsappPhoneNumberId.trim(),
        active: true,
      })
      .select('id')
      .single();

    if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);

    const clientId = client.id;

    // 4. Create auth user (no email confirmation — admin is verifying)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: clientEmail.trim(),
      password: clientPassword,
      email_confirm: true, // Auto-confirm since admin is creating
    });

    if (authError) {
      // Rollback: delete the client row
      await supabaseAdmin.from('ff_clients').delete().eq('id', clientId);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 5. Map user to client
    const { error: mapError } = await supabaseAdmin
      .from('ff_client_users')
      .insert({
        user_id: userId,
        client_id: clientId,
        role: userRole,
      });

    if (mapError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('ff_clients').delete().eq('id', clientId);
      throw new Error(`Failed to map user: ${mapError.message}`);
    }

    // 6. Add agents (if any)
    if (agents.length > 0) {
      const agentRows = agents
        .filter((a: { name: string }) => a.name?.trim())
        .map((a: { name: string }) => ({
          name: a.name.trim(),
          client_id: clientId,
        }));

      if (agentRows.length > 0) {
        await supabaseAdmin.from('re_agents').insert(agentRows);
      }
    }

    // 7. Add properties (if any)
    if (properties.length > 0) {
      const propRows = properties
        .filter((p: { title: string }) => p.title?.trim())
        .map((p: { title: string; area?: string; bhk_config?: string }) => ({
          title: p.title.trim(),
          area: p.area?.trim() || null,
          bhk_config: p.bhk_config?.trim() || null,
          client_id: clientId,
        }));

      if (propRows.length > 0) {
        await supabaseAdmin.from('re_properties').insert(propRows);
      }
    }

    return NextResponse.json({
      success: true,
      client_id: clientId,
      user_id: userId,
      email: clientEmail.trim(),
      agents_created: agents.length,
      properties_created: properties.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

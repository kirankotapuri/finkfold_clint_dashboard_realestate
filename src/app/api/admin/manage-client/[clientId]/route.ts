import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/verify-admin';

// DELETE — deactivate or delete a client
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { clientId } = await params;
  const { searchParams } = new URL(req.url);
  const hard = searchParams.get('hard') === 'true';

  try {
    if (hard) {
      // Hard delete: remove user mappings, auth users, then client
      const { data: users } = await supabaseAdmin
        .from('ff_client_users')
        .select('user_id')
        .eq('client_id', clientId)
        .neq('role', 'finkfold_admin');

      // Delete auth users
      if (users) {
        for (const u of users) {
          await supabaseAdmin.auth.admin.deleteUser(u.user_id);
        }
      }

      // Delete related data
      await supabaseAdmin.from('ff_client_users').delete().eq('client_id', clientId).neq('role', 'finkfold_admin');
      await supabaseAdmin.from('re_agents').delete().eq('client_id', clientId);
      await supabaseAdmin.from('re_properties').delete().eq('client_id', clientId);
      await supabaseAdmin.from('ff_clients').delete().eq('id', clientId);

      return NextResponse.json({ success: true, action: 'deleted' });
    } else {
      // Soft delete: just deactivate
      await supabaseAdmin.from('ff_clients').update({ active: false }).eq('id', clientId);
      return NextResponse.json({ success: true, action: 'deactivated' });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

// PATCH — update client details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const adminUserId = await verifyAdmin(req);
  if (!adminUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { clientId } = await params;
  const body = await req.json();

  try {
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.city !== undefined) updates.city = body.city.trim() || null;
    if (body.active !== undefined) updates.active = body.active;
    if (body.whatsapp_phone_number_id !== undefined) updates.whatsapp_phone_number_id = body.whatsapp_phone_number_id.trim();

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.from('ff_clients').update(updates).eq('id', clientId);
      if (error) throw new Error(error.message);
    }

    // Handle agents update if provided
    if (body.agents !== undefined) {
      // Delete existing and re-insert
      await supabaseAdmin.from('re_agents').delete().eq('client_id', clientId);
      const agentRows = body.agents
        .filter((a: { name: string }) => a.name?.trim())
        .map((a: { name: string }) => ({ name: a.name.trim(), client_id: clientId }));
      if (agentRows.length > 0) {
        await supabaseAdmin.from('re_agents').insert(agentRows);
      }
    }

    // Handle properties update if provided
    if (body.properties !== undefined) {
      await supabaseAdmin.from('re_properties').delete().eq('client_id', clientId);
      const propRows = body.properties
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

    // Reset password if provided
    if (body.newPassword) {
      const { data: users } = await supabaseAdmin
        .from('ff_client_users')
        .select('user_id')
        .eq('client_id', clientId)
        .neq('role', 'finkfold_admin')
        .limit(1)
        .maybeSingle();

      if (users?.user_id) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(users.user_id, {
          password: body.newPassword,
        });
        if (error) throw new Error(`Password reset failed: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

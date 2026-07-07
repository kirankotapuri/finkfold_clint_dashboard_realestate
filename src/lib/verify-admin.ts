import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  // Use admin client to verify the JWT — works reliably with service_role key
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  // Check if user has finkfold_admin role
  const { data: adminCheck } = await supabaseAdmin
    .from('ff_client_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'finkfold_admin')
    .limit(1)
    .maybeSingle();

  return adminCheck ? user.id : null;
}

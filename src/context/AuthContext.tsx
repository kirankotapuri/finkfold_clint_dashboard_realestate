'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  client: Client | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  client: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClient(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchClient(session.user.id);
        } else {
          setClient(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchClient(userId: string) {
    // Check all mappings for this user (could be admin or client)
    const { data: mappings } = await supabase
      .from('ff_client_users')
      .select('client_id, role')
      .eq('user_id', userId);

    if (mappings && mappings.length > 0) {
      // Check if any mapping has admin role
      const adminMapping = mappings.find((m) => m.role === 'finkfold_admin');
      setIsAdmin(!!adminMapping);

      // For admins: use the admin mapping's client. For regular users: use their mapping.
      const clientMapping = adminMapping || mappings[0];
      if (clientMapping?.client_id) {
        const { data: clientData } = await supabase
          .from('ff_clients')
          .select('*')
          .eq('id', clientMapping.client_id)
          .single();

        setClient(clientData);
      }
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setClient(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, client, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

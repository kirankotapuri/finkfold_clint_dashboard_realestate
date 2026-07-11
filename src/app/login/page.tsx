'use client';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
    // Auth state change in context handles redirect
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/dashboard/settings`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-8 sm:py-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo & branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Image src="/logo.png" alt="Finkfold" width={160} height={40} className="h-7 sm:h-9 w-auto" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Client Dashboard</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            {view === 'login' ? 'Sign in to view your leads and analytics' : 'Reset your password'}
          </p>
        </div>

        {/* Login form */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 md:p-8">
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-hot bg-hot/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-accent/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); }}
                className="w-full text-sm text-accent hover:text-accent/80 transition-colors mt-2"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm text-text-primary font-medium">Reset link sent!</p>
                  <p className="text-xs text-text-muted mt-1">Check your email for the password reset link.</p>
                  <button
                    onClick={() => { setView('login'); setResetSent(false); setError(''); }}
                    className="text-sm text-accent hover:text-accent/80 mt-4 transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); }}
                    className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-hot bg-hot/10 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent hover:bg-accent/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © {new Date().getFullYear()} Finkfold. All rights reserved.
        </p>
      </div>
    </div>
  );
}

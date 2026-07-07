'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Settings as SettingsIcon, Building2, Lock, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { client, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-accent" />
          Settings
        </h1>
        <p className="text-sm text-text-muted">Manage your account</p>
      </div>

      {/* Company Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-accent" />
          Company Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Company Name</label>
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {client?.name || '—'}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">City</label>
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {client?.city || '—'}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Email</label>
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {user?.email || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-accent" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              placeholder="Enter new password"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              placeholder="Confirm new password"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          {passwordMsg && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                passwordMsg.type === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-hot/10 text-hot'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {passwordMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

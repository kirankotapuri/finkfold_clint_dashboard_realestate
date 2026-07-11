'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/visits', label: 'Site Visits', icon: CalendarCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { href: '/dashboard/admin', label: 'Admin Panel', icon: ShieldCheck },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { client, isAdmin, signOut } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-secondary border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Image src="/logo.png" alt="Finkfold" width={130} height={32} className="h-7 w-auto" />
        <button
          onClick={onClose}
          className="ml-auto lg:hidden text-text-muted hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Client name */}
      {client && (
        <div className="px-6 py-3 border-b border-border">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            {isAdmin ? 'Admin' : 'Client'}
          </p>
          <p className="text-sm font-medium text-text-primary truncate">
            {isAdmin ? 'Finkfold' : client.name}
          </p>
          {!isAdmin && client.city && (
            <p className="text-xs text-text-muted">{client.city}</p>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Admin section — shown first for admins */}
        {isAdmin && (
          <>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-saffron/10 text-saffron border border-saffron/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card'
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard/settings'
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              Settings
            </Link>
          </>
        )}

        {/* Client nav — hidden for admins */}
        {!isAdmin && navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card'
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-hot hover:bg-card transition-colors w-full"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — full width */}
      <aside className="hidden lg:block w-60 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Tablet sidebar — compact icon-only */}
      <aside className="hidden md:flex lg:hidden w-16 fixed inset-y-0 left-0 z-30 flex-col items-center bg-secondary border-r border-border py-4 gap-1">
        <div className="mb-4 px-2">
          <Image src="/logo.png" alt="Finkfold" width={32} height={32} className="h-8 w-8 object-contain" />
        </div>
        {(isAdmin ? adminItems : navItems).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/dashboard/settings"
            title="Settings"
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-card'
            }`}
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
        <div className="mt-auto">
          <button
            onClick={signOut}
            title="Sign Out"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:text-hot hover:bg-card transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

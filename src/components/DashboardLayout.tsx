'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-primary">
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content — offset for tablet (icon sidebar) and desktop (full sidebar) */}
        <div className="md:pl-16 lg:pl-60">
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-20 bg-secondary/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-secondary hover:text-text-primary p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-semibold text-text-primary">Finkfold Dashboard</span>
          </header>

          <main className="p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

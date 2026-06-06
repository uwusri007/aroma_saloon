'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Scissors, Users, Calendar, CreditCard, Clock, Settings, Sparkles, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';
import { useState } from 'react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/treatments', label: 'Treatments', icon: Scissors },
  { href: '/admin/categories', label: 'Categories', icon: Sparkles },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/working-hours', label: 'Working Hours', icon: Clock },
  { href: '/admin/holidays', label: 'Holidays', icon: Calendar },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-soft"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 w-64 bg-charcoal text-white transform transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="font-display text-xl">
            Admin <span className="text-rose-gold">Panel</span>
          </Link>
          <p className="text-xs text-white/50 mt-1">{user?.first_name} {user?.last_name}</p>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
                  active ? 'bg-rose-gold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white px-4 py-2">
            View Site
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-4 py-2 w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}

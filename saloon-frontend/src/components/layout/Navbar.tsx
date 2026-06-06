'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Sparkles, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/treatments', label: 'Treatments' },
  { href: '/book', label: 'Book Now' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) return null;

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-blush/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-rose-gold group-hover:rotate-12 transition-transform" />
            <span className="font-display text-2xl font-semibold text-charcoal">
              Aroma <span className="text-rose-gold">Salon</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm font-medium transition-colors hover:text-rose-gold',
                  pathname === link.href ? 'text-rose-gold' : 'text-charcoal/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="btn-ghost text-sm">
                    <LayoutDashboard className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link href="/dashboard" className="btn-ghost text-sm">
                  <User className="w-4 h-4" /> {user.first_name}
                </Link>
                <button onClick={logout} className="btn-ghost text-sm">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Login</Link>
                <Link href="/register" className="btn-primary text-sm py-2.5 px-5">Sign Up</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-blush/50 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-charcoal/80 hover:text-rose-gold"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-blush/50 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="block py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  {isAdmin && <Link href="/admin" className="block py-2" onClick={() => setMobileOpen(false)}>Admin</Link>}
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-2 text-red-500">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-2" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/register" className="block py-2 text-rose-gold font-medium" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

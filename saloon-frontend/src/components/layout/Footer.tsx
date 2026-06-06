'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-charcoal text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-rose-gold" />
              <span className="font-display text-xl text-white">Aroma Salon</span>
            </div>
            <p className="text-sm leading-relaxed">
              Where beauty meets elegance. Experience premium salon treatments in a luxurious, welcoming environment.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link href="/treatments" className="block hover:text-rose-gold transition-colors">Treatments</Link>
              <Link href="/book" className="block hover:text-rose-gold transition-colors">Book Appointment</Link>
              <Link href="/dashboard" className="block hover:text-rose-gold transition-colors">My Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-gold" /> 123 Beauty Lane, City Center</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-rose-gold" /> 555-SALON</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-rose-gold" /> info@aromasalon.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} Aroma Ladies Salon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

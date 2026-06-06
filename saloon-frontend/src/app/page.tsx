'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, Shield, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import TreatmentCard from '@/components/treatments/TreatmentCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { treatmentApi } from '@/lib/services';
import type { Treatment, Category } from '@/types';

export default function HomePage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      treatmentApi.getTreatments(),
      treatmentApi.getCategories(),
    ]).then(([tRes, cRes]) => {
      setTreatments(tRes.data.data.slice(0, 6));
      setCategories(cRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-blush/30 to-rose-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-rose-gold font-medium mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Premium Ladies Salon
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-charcoal leading-tight mb-6">
              Where Beauty<br /><span className="text-rose-gold">Meets Elegance</span>
            </h1>
            <p className="text-lg text-charcoal/70 mb-8 leading-relaxed">
              Experience luxurious salon treatments from expert stylists. Book your appointment online in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book"><Button size="lg">Book Appointment</Button></Link>
              <Link href="/treatments"><Button variant="secondary" size="lg">View Treatments</Button></Link>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-rose-gold/10 rounded-full blur-3xl" />
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Easy Online Booking', desc: 'Select treatments, pick a time, and confirm with a simple deposit.' },
              { icon: Shield, title: 'Secure Payments', desc: 'Pay your 10% deposit securely via PayPal to confirm your slot.' },
              { icon: Heart, title: 'Expert Care', desc: 'Our skilled professionals deliver premium treatments tailored to you.' },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-blush/50 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-rose-gold" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-charcoal/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-title text-center mb-10">Our Services</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/treatments?category=${cat.id}`}
                  className="px-6 py-3 rounded-full border border-blush hover:border-rose-gold hover:bg-rose-gold/5 transition-all text-sm font-medium"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-title">Popular Treatments</h2>
            <Link href="/treatments" className="text-rose-gold hover:underline text-sm font-medium">View All</Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {treatments.map((t) => <TreatmentCard key={t.id} treatment={t} />)}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-rose-gold to-rose-dark text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Pamper Yourself?</h2>
          <p className="text-white/80 mb-8">Book your appointment today and experience the Aroma difference.</p>
          <Link href="/book"><Button variant="secondary" size="lg" className="border-white text-white hover:bg-white hover:text-rose-gold">Book Now</Button></Link>
        </div>
      </section>
    </>
  );
}

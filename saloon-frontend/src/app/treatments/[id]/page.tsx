'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TreatmentCard from '@/components/treatments/TreatmentCard';
import { treatmentApi } from '@/lib/services';
import type { Treatment } from '@/types';

export default function TreatmentDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    treatmentApi.getTreatment(id).then((res) => setTreatment(res.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!treatment) return <div className="text-center py-20">Treatment not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/treatments" className="inline-flex items-center gap-2 text-rose-gold hover:underline mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Treatments
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-blush to-rose-light/30 overflow-hidden">
          {treatment.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={treatment.image_url} alt={treatment.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display text-8xl text-rose-gold/20">{treatment.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div>
          {treatment.category_name && (
            <span className="badge bg-blush text-rose-gold mb-4">{treatment.category_name}</span>
          )}
          <h1 className="font-display text-4xl font-bold text-charcoal mb-4">{treatment.name}</h1>
          <p className="text-charcoal/70 leading-relaxed mb-6">{treatment.description}</p>
          <div className="flex items-center gap-6 mb-8">
            <span className="flex items-center gap-2 text-charcoal/70"><Clock className="w-5 h-5 text-rose-gold" /> {treatment.duration_minutes} minutes</span>
            <span className="text-2xl font-semibold text-rose-gold">${Number(treatment.price).toFixed(2)}</span>
          </div>
          <Link href={`/book?treatments=${treatment.id}`}>
            <Button size="lg">Book This Treatment</Button>
          </Link>
        </div>
      </div>

      {treatment.suggestions && treatment.suggestions.length > 0 && (
        <div className="mt-16">
          <h2 className="section-title mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatment.suggestions.map((s) => <TreatmentCard key={s.id} treatment={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

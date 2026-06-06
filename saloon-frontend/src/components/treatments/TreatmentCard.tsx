import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import type { Treatment } from '@/types';

interface TreatmentCardProps {
  treatment: Treatment;
  selected?: boolean;
  onSelect?: (treatment: Treatment) => void;
  selectable?: boolean;
}

export default function TreatmentCard({ treatment, selected, onSelect, selectable }: TreatmentCardProps) {
  const content = (
    <div className={`card group hover:shadow-card transition-all duration-300 ${selected ? 'ring-2 ring-rose-gold' : ''}`}>
      <div className="aspect-[4/3] bg-gradient-to-br from-blush to-rose-light/30 relative overflow-hidden">
        {treatment.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={treatment.image_url} alt={treatment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-4xl text-rose-gold/30">{treatment.name.charAt(0)}</span>
          </div>
        )}
        {treatment.category_name && (
          <span className="absolute top-3 left-3 badge bg-white/90 text-charcoal">{treatment.category_name}</span>
        )}
        {selected && (
          <span className="absolute top-3 right-3 badge bg-rose-gold text-white">Selected</span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-charcoal mb-2">{treatment.name}</h3>
        <p className="text-sm text-charcoal/60 line-clamp-2 mb-4">{treatment.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-charcoal/70">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {treatment.duration_minutes} min</span>
            <span className="font-semibold text-rose-gold">${Number(treatment.price).toFixed(2)}</span>
          </div>
          {!selectable && (
            <ArrowRight className="w-4 h-4 text-rose-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  );

  if (selectable && onSelect) {
    return (
      <button type="button" onClick={() => onSelect(treatment)} className="text-left w-full">
        {content}
      </button>
    );
  }

  return <Link href={`/treatments/${treatment.id}`}>{content}</Link>;
}

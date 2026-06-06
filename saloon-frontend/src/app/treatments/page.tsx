'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import TreatmentCard from '@/components/treatments/TreatmentCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { treatmentApi } from '@/lib/services';
import type { Treatment, Category } from '@/types';
import Link from 'next/link';
import Button from '@/components/ui/Button';

function TreatmentsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(categoryParam ? parseInt(categoryParam) : null);

  useEffect(() => {
    treatmentApi.getCategories().then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: { category_id?: number; search?: string } = {};
    if (selectedCategory) params.category_id = selectedCategory;
    if (search) params.search = search;

    treatmentApi.getTreatments(params).then((res) => {
      setTreatments(res.data.data);
    }).finally(() => setLoading(false));
  }, [selectedCategory, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="section-title mb-4">Our Treatments</h1>
        <p className="text-charcoal/60 max-w-xl mx-auto">Discover our range of premium salon services designed to make you look and feel your best.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search treatments..."
            className="input-field pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'bg-rose-gold text-white' : 'bg-blush/50 hover:bg-blush'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id ? 'bg-rose-gold text-white' : 'bg-blush/50 hover:bg-blush'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : treatments.length === 0 ? (
        <EmptyState title="No treatments found" description="Try adjusting your search or filters." action={<Link href="/book"><Button>Book a Consultation</Button></Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.map((t) => <TreatmentCard key={t.id} treatment={t} />)}
        </div>
      )}
    </div>
  );
}

export default function TreatmentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TreatmentsContent />
    </Suspense>
  );
}

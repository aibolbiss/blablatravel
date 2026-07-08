import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import SearchFilters from '@/components/SearchFilters';
import ListingCard from '@/components/ListingCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Listing } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Search = {
  companion?: string;
  country?: string;
  city?: string;
  to_country?: string;
  to_city?: string;
  tourism?: string;
  budget_max?: string;
  date_from?: string;
  date_to?: string;
};

export default async function HomePage({ searchParams }: { searchParams: Search }) {
  const supabase = createClient();

  let query = supabase
    .from('listings')
    .select('*, profiles!listings_user_id_fkey(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48);

  if (searchParams.country) query = query.ilike('country', `%${searchParams.country}%`);
  if (searchParams.city) query = query.ilike('city', `%${searchParams.city}%`);
  if (searchParams.to_country) query = query.ilike('to_country', `%${searchParams.to_country}%`);
  if (searchParams.to_city) query = query.ilike('to_city', `%${searchParams.to_city}%`);
  if (searchParams.budget_max) query = query.lte('budget', Number(searchParams.budget_max));

  const { data } = await query;
  let listings = (data ?? []) as Listing[];

  // Client-side filtering for companion and tourism types (to avoid matching in "кто я" vs "кого ищу")
  if (searchParams.companion) {
    const companion = searchParams.companion;
    listings = listings.filter(l => l.title.startsWith(companion));
  }
  if (searchParams.tourism) {
    const tourism = searchParams.tourism;
    listings = listings.filter(l => l.title.includes(`→ ${tourism}`));
  }

  // Date range filtering
  if (searchParams.date_from || searchParams.date_to) {
    listings = listings.filter(l => {
      const listingFrom = l.date_from ? new Date(l.date_from) : null;
      const listingTo = l.date_to ? new Date(l.date_to) : null;
      const searchFrom = searchParams.date_from ? new Date(searchParams.date_from) : null;
      const searchTo = searchParams.date_to ? new Date(searchParams.date_to) : null;

      // Check if date ranges overlap
      if (searchFrom && listingTo && searchFrom > listingTo) return false;
      if (searchTo && listingFrom && searchTo < listingFrom) return false;
      return true;
    });
  }

  return (
    <div className="py-4 md:py-8">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-route">поиск попутчиков</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
          С кем поедешь <span className="text-route">в этот раз?</span>
        </h1>
        <div className="route-line mt-5 max-w-md" />
      </section>

      <Suspense>
        <SearchFilters />
      </Suspense>

      {listings.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="text-lg font-semibold">Пока ничего не нашлось</p>
          <p className="mt-1 text-sm text-mut">Измените фильтры или создайте первое объявление.</p>
          <Link href="/cabinet/listings/new" className="btn-primary mt-5">Создать объявление</Link>
        </div>
      ) : (
        <Suspense fallback={
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        }>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </Suspense>
      )}
    </div>
  );
}

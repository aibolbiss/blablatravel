import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createPublicClient } from '@/lib/supabase/public';
import SearchFilters from '@/components/SearchFilters';
import ListingCard from '@/components/ListingCard';
import SkeletonCard from '@/components/SkeletonCard';
import { ListingCardData } from '@/lib/types';
import { Link } from '@/i18n/navigation';
import { parseListingTitle } from '@/lib/parseListingTitle';
import { companionEmojis, tourismEmojis } from '@/lib/travel-data';

// Публичные данные (без сессии) — кэшируем на 20с вместо похода в Supabase
// на каждый заход, см. lib/supabase/public.ts.
export const revalidate = 20;

type Search = {
  companion?: string;
  country?: string;
  city?: string;
  to_country?: string;
  to_city?: string;
  tourism?: string;
  date_from?: string;
  date_to?: string;
};

export default async function HomePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Search;
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations('home');
  const supabase = createPublicClient(20);

  let query = supabase
    .from('listings')
    .select('id, title, budget, city, to_city, date_from, date_to, photo_url, profiles!listings_user_id_fkey(name, avatar_url, gender)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48);

  if (searchParams.country) query = query.ilike('country', `%${searchParams.country}%`);
  if (searchParams.city) query = query.ilike('city', `%${searchParams.city}%`);
  if (searchParams.to_country) query = query.ilike('to_country', `%${searchParams.to_country}%`);
  if (searchParams.to_city) query = query.ilike('to_city', `%${searchParams.to_city}%`);

  const { data } = await query;
  let listings = (data ?? []) as unknown as ListingCardData[];

  // Фильтр "кого вы ищете" ищет объявления, автор которых сам является
  // выбранным типом (myType) — чтобы найти собеседников этого типа, а не
  // объявления, где кто-то другой ищет этот тип.
  if (searchParams.companion) {
    const companion = searchParams.companion;
    listings = listings.filter(l => {
      const { myType } = parseListingTitle(l.title);
      return myType ? companionEmojis[myType] === companion : false;
    });
  }
  if (searchParams.tourism) {
    const tourism = searchParams.tourism;
    listings = listings.filter(l => {
      const { tourismType } = parseListingTitle(l.title);
      return tourismType ? tourismEmojis[tourismType] === tourism : false;
    });
  }

  // Если задано только одно поле (от ИЛИ до) — эта дата должна попадать
  // внутрь диапазона объявления. Если заданы оба поля — работает обычное
  // пересечение диапазонов (достаточно общего отрезка внутри обоих).
  if (searchParams.date_from || searchParams.date_to) {
    const searchFrom = searchParams.date_from ? new Date(searchParams.date_from) : null;
    const searchTo = searchParams.date_to ? new Date(searchParams.date_to) : null;
    listings = listings.filter(l => {
      const listingFrom = l.date_from ? new Date(l.date_from) : null;
      const listingTo = l.date_to ? new Date(l.date_to) : null;
      if (!listingFrom || !listingTo) return true;

      if (searchFrom && searchTo) {
        return searchFrom <= listingTo && searchTo >= listingFrom;
      }
      // Только "от" — граница "до" объявления не считается совпадением:
      // в последний день поездки уже не остаётся времени ехать вместе.
      if (searchFrom) {
        return searchFrom >= listingFrom && searchFrom < listingTo;
      }
      // Только "до" — симметрично, граница "от" объявления не считается.
      if (searchTo) {
        return searchTo > listingFrom && searchTo <= listingTo;
      }
      return true;
    });
  }

  return (
    <div className="py-4 md:py-8">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-route">{t('kicker')}</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
          {t('titleLine1')} <span className="text-route">{t('titleLine2')}</span>
        </h1>
        {/* <div className="route-line mt-5 max-w-md" /> */}
      </section>

      <Suspense>
        <SearchFilters />
      </Suspense>

      {listings.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-lg font-semibold">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-mut">{t('emptyText')}</p>
          <Link href="/cabinet/listings/new" className="btn-primary mt-5">{t('createListing')}</Link>
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

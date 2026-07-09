import { createClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FavoriteListingCard from '@/components/FavoriteListingCard';
import { ListingCardData } from '@/lib/types';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('favorites');
  const supabase = createClient();
  const userId = getUserId();

  if (!userId) {
    return (
      <div className="py-4 md:py-10">
        <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-semibold">{t('needLogin')}</p>
          <Link href="/auth/login" className="btn-primary mt-5">{t('login')}</Link>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id, listings(id, title, budget, city, to_city, date_from, date_to, photo_url, profiles!listings_user_id_fkey(name, avatar_url, gender))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Favorites error:', error);
  }

  const listings = (data ?? [])
    .map((f: any) => f.listings)
    .filter(Boolean) as ListingCardData[];

  return (
    <div className="py-4 md:py-10">
      <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-semibold">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-mut">{t('emptyText')}</p>
          <Link href="/" className="btn-primary mt-5">{t('browse')}</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => <FavoriteListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}

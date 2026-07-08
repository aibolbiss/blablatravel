import { createClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import FavoriteListingCard from '@/components/FavoriteListingCard';
import { ListingCardData } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const supabase = createClient();
  const userId = getUserId();

  if (!userId) {
    return (
      <div className="py-4 md:py-10">
        <h1 className="font-display text-2xl font-bold">Избранное</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-semibold">Пожалуйста, войдите в аккаунт</p>
          <Link href="/auth/login" className="btn-primary mt-5">Войти</Link>
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
      <h1 className="font-display text-2xl font-bold">Избранное</h1>
      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-semibold">Здесь пока пусто</p>
          <p className="mt-1 text-sm text-mut">Сохраняйте объявления кнопкой «☆ В избранное».</p>
          <Link href="/" className="btn-primary mt-5">Смотреть объявления</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => <FavoriteListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}

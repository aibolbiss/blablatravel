import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { getUserId } from '@/lib/auth';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Listing } from '@/lib/types';
import { getCountryLabel, getCityLabel } from '@/lib/geo-labels';
import FavoriteButton from '@/components/FavoriteButton';
import StartChatButton from '@/components/StartChatButton';
import MapView from '@/components/MapViewDynamic';
import ImageModal from '@/components/ImageModal';
import ListingTitle from '@/components/ListingTitle';

// Само объявление — публичные данные, кэшируем на 30с (lib/supabase/public.ts).
// Проверка избранного остаётся на авторизованном клиенте и не кэшируется,
// т.к. зависит от конкретного пользователя.
export const revalidate = 30;

export default async function ListingPage({ params }: { params: { locale: string; id: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('listing');
  const tProfile = await getTranslations('profile');
  const locale = await getLocale();
  const userId = getUserId();

  const { data, error } = await createPublicClient(30)
    .from('listings')
    .select('*, profiles!listings_user_id_fkey(*)')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const listing = data as Listing;
  const p = listing.profiles!;
  const genderLabel = p.gender === 'male' ? tProfile('male') : p.gender === 'female' ? tProfile('female') : p.gender ? tProfile('other') : '';

  let isFav = false;
  if (userId) {
    const { data: fav } = await createClient().from('favorites')
      .select('listing_id').match({ user_id: userId, listing_id: listing.id }).maybeSingle();
    isFav = !!fav;
  }

  return (
    <div className="grid gap-8 py-4 md:py-10 md:grid-cols-[1fr_300px]">
      <article>
        {listing.photo_url && (
          <ImageModal src={listing.photo_url} alt={listing.title} />
        )}
        <h1 className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">
          <ListingTitle title={listing.title} />
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-route">
          <span>🛫 {getCityLabel(listing.city, locale)}, {getCountryLabel(listing.country, locale)}</span>
          {listing.to_city && (<><span>→</span><span>{getCityLabel(listing.to_city, locale)}{listing.to_country ? `, ${getCountryLabel(listing.to_country, locale)}` : ''} 🛬</span></>)}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {listing.budget != null && (
            <span className="rounded-full bg-route-light px-3 py-1 font-semibold text-route">{t('budgetUpTo', { amount: listing.budget })}</span>
          )}
          {listing.date_from && (
            <span className="rounded-full bg-route-light px-3 py-1 font-semibold text-route">
              📅 {new Date(listing.date_from).toLocaleDateString(locale)}
              {listing.date_to ? ` — ${new Date(listing.date_to).toLocaleDateString(locale)}` : ''}
            </span>
          )}
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink/90">{listing.description}</p>

        {listing.show_on_map && listing.lat != null && listing.lng != null && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">{t('meetLocationHeading')}</h2>
            <div className="h-72 overflow-hidden rounded-2xl border border-line">
              <MapView markers={[{ id: listing.id, lat: listing.lat, lng: listing.lng, title: listing.title, href: '#' }]}
                center={[listing.lat, listing.lng]} zoom={10} />
            </div>
          </div>
        )}
      </article>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-card md:sticky md:top-24">
        <div className="space-y-3">
          {/* Фото + Имя + Пол */}
          <div className="flex gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-route-light shrink-0">
              {p.avatar_url ? (
                <Image src={p.avatar_url} alt={p.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl bg-route-light">🙂</div>
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="font-semibold text-base leading-tight">{p.name}</p>
              {p.gender && (
                <p className="text-xs text-mut mt-0.5">{genderLabel}</p>
              )}
            </div>
          </div>

          {/* Страна, Город */}
          <div className="text-sm text-mut">
            {p.country && p.city && <p>{p.country}, {p.city}</p>}
            {p.country && !p.city && <p>{p.country}</p>}
            {!p.country && p.city && <p>{p.city}</p>}
          </div>

          {/* О себе */}
          {p.bio && (
            <div className="text-sm text-mut leading-relaxed pt-1 border-t border-line">
              <p>{p.bio}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-2 pt-1">
            <StartChatButton otherUserId={p.id} allowed={p.allow_messages}
              isSelf={userId === p.id} isAuthed={!!userId} />
            {userId !== p.id && <FavoriteButton listingId={listing.id} userId={userId} initial={isFav} />}
          </div>
        </div>
      </aside>
    </div>
  );
}

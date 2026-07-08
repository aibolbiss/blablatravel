import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Listing, GENDER_LABEL } from '@/lib/types';
import FavoriteButton from '@/components/FavoriteButton';
import StartChatButton from '@/components/StartChatButton';
import MapView from '@/components/MapViewDynamic';
import ImageModal from '@/components/ImageModal';

export const dynamic = 'force-dynamic';

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('🔍 Fetching listing:', params.id);
  console.log('👤 Current user:', user?.id);

  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles!listings_user_id_fkey(*)')
    .eq('id', params.id)
    .single();
  
  console.log('📊 Query result - data:', !!data, 'error:', error);
  
  if (error) {
    console.error('❌ Listing fetch error:', error.message);
    notFound();
  }
  
  if (!data) {
    console.error('❌ No listing found for id:', params.id);
    notFound();
  }
  
  console.log('✅ Listing loaded:', data.title);
  const listing = data as Listing;
  const p = listing.profiles!;

  let isFav = false;
  if (user) {
    const { data: fav } = await supabase.from('favorites')
      .select('listing_id').match({ user_id: user.id, listing_id: listing.id }).maybeSingle();
    isFav = !!fav;
  }

  return (
    <div className="grid gap-8 py-4 md:py-10 md:grid-cols-[1fr_300px]">
      <article>
        {listing.photo_url && (
          <ImageModal src={listing.photo_url} alt={listing.title} />
        )}
        <h1 className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">Я {listing.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-route">
          <span>🛫 {listing.city}, {listing.country}</span>
          {listing.to_city && (<><span>→</span><span>{listing.to_city}{listing.to_country ? `, ${listing.to_country}` : ''} 🛬</span></>)}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {listing.budget != null && (
            <span className="rounded-full bg-route-light px-3 py-1 font-semibold text-route">Бюджет: до ${listing.budget}</span>
          )}
          {listing.date_from && (
            <span className="rounded-full bg-route-light px-3 py-1 font-semibold text-route">
              📅 {new Date(listing.date_from).toLocaleDateString('ru-RU')}
              {listing.date_to ? ` — ${new Date(listing.date_to).toLocaleDateString('ru-RU')}` : ''}
            </span>
          )}
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink/90">{listing.description}</p>

        {listing.show_on_map && listing.lat != null && listing.lng != null && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Локация на карте, где можем встретиться</h2>
            <div className="h-72 overflow-hidden rounded-2xl border border-line">
              <MapView markers={[{ id: listing.id, lat: listing.lat, lng: listing.lng, title: listing.title, href: '#' }]}
                center={[listing.lat, listing.lng]} zoom={10} />
            </div>
          </div>
        )}
      </article>

      <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card md:sticky md:top-24">
        <div className="space-y-3">
          {/* Фото + Имя + Пол */}
          <div className="flex gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-route-light shrink-0">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl bg-route-light">🙂</div>
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="font-semibold text-base leading-tight">{p.name}</p>
              {p.gender && (
                <p className="text-xs text-mut mt-0.5">{GENDER_LABEL[p.gender]}</p>
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
              isSelf={user?.id === p.id} isAuthed={!!user} />
            {user?.id !== p.id && <FavoriteButton listingId={listing.id} userId={user?.id ?? null} initial={isFav} />}
          </div>
        </div>
      </aside>
    </div>
  );
}

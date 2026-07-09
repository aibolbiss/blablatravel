import { createPublicClient } from '@/lib/supabase/public';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import MapView from '@/components/MapViewDynamic';
import { ListingMapData } from '@/lib/types';

// Публичные данные, не завязанные на пользователя — кэшируем на 60с вместо
// полного force-dynamic, чтобы не бить в Supabase на каждый заход.
export const revalidate = 60;

export default async function MapPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('map');
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('listings')
    .select('id, title, description, city, country, to_city, to_country, budget, date_from, date_to, photo_url, lat, lng, profiles!listings_user_id_fkey(name, avatar_url, gender)')
    .eq('is_active', true)
    .eq('show_on_map', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(300);

  const listings = (data ?? []) as unknown as ListingMapData[];
  const markers = listings.map((l) => ({
    id: l.id,
    lat: l.lat!,
    lng: l.lng!,
    title: l.title,
    subtitle: `${l.profiles?.name ?? ''} · ${l.city}, ${l.country}`,
    href: `/listing/${l.id}`,
    photo_url: l.photo_url,
    avatar_url: l.profiles?.avatar_url,
    listing: l,
  }));

  return (
    <div className="py-8">
      <h1 className="font-display text-2xl font-bold">{t('heading')}</h1>
      <p className="mt-1 text-sm text-mut">
        {t('subtitle', { count: markers.length })}
      </p>
      <div className="mt-6 h-[70vh] overflow-hidden rounded-2xl border border-line shadow-card">
        <MapView markers={markers} />
      </div>
    </div>
  );
}

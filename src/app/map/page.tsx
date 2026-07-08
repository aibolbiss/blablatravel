import { createClient } from '@/lib/supabase/server';
import MapView from '@/components/MapViewDynamic';
import { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('listings')
    .select('*, profiles!listings_user_id_fkey(*)')
    .eq('is_active', true)
    .eq('show_on_map', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(300);

  const listings = (data ?? []) as Listing[];
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
      <h1 className="font-display text-2xl font-bold">Попутчики на карте</h1>
      <p className="mt-1 text-sm text-mut">
        Показаны только те, кто разрешил отображение своей локации. Всего: {markers.length}
      </p>
      <div className="mt-6 h-[70vh] overflow-hidden rounded-2xl border border-line shadow-card">
        <MapView markers={markers} />
      </div>
    </div>
  );
}

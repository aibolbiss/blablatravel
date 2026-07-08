import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Listing, GENDER_LABEL } from '@/lib/types';

const icon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#1E6E5A;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const createPhotoIcon = (avatarUrl?: string) => {
  if (!avatarUrl) return icon;
  return L.divIcon({
    className: 'map-photo-icon',
    html: `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);background-image:url('${avatarUrl}');background-size:cover;background-position:center"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  href: string;
  subtitle?: string;
  photo_url?: string;
  avatar_url?: string;
  listing?: Listing;
};

function ClickCatcher({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPick?.(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function MapView({
  markers, center = [48.02, 66.92], zoom = 4, onPick,
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
}) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const p = selectedListing?.profiles;

  return (
    <>
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && <ClickCatcher onPick={onPick} />}
        {markers.map((m) => (
          <Marker 
            key={m.id} 
            position={[m.lat, m.lng]} 
            icon={createPhotoIcon(m.avatar_url)} 
            eventHandlers={{
              click: () => {
                if (m.listing) {
                  setSelectedListing(m.listing);
                }
              },
            }}
          />
        ))}
      </MapContainer>

      {selectedListing && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedListing(null)}>
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedListing(null)} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white">
              ✕
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-route-light">
                  {p?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm">🙂</div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{p?.name ?? 'Путешественник'}</p>
                  <p className="text-sm text-mut">{p ? GENDER_LABEL[p.gender] : ''}</p>
                </div>
              </div>

              <h2 className="mt-4 font-display text-lg font-bold">
                Я {selectedListing.title}
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span>🛫 {selectedListing.city}, {selectedListing.country} → {selectedListing.to_city}, {selectedListing.to_country} 🛬</span>
                </div>
                {selectedListing.date_from && (
                  <div className="flex gap-2">
                    <span className="font-medium">Даты:</span>
                    <span>
                      📅 {new Date(selectedListing.date_from).toLocaleDateString('ru-RU')}
                      {selectedListing.date_to ? ` — ${new Date(selectedListing.date_to).toLocaleDateString('ru-RU')}` : ''}
                    </span>
                  </div>
                )}
                {selectedListing.budget && (
                  <div className="flex gap-2">
                    <span className="font-medium">Бюджет:</span>
                    <span>${selectedListing.budget}/человек</span>
                  </div>
                )}
              </div>

              {selectedListing.description && (
                <>
                  <h3 className="mt-4 font-semibold">Описание</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-mut">{selectedListing.description}</p>
                </>
              )}

              <div className="mt-6 flex gap-3">
                <Link href={`/listing/${selectedListing.id}`} className="btn-primary flex-1">
                  Посмотреть объявление →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

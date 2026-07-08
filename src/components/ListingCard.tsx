import Link from 'next/link';
import { Listing, GENDER_LABEL } from '@/lib/types';

export default function ListingCard({ listing }: { listing: Listing }) {
  const p = listing.profiles;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-route/40"
    >
      <div className="relative aspect-[4/3] bg-route-light">
        {listing.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photo_url} alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🧭</div>
        )}
        {listing.budget != null && (
          <span className="absolute right-3 top-3 rounded-full bg-night/80 px-3 py-1 text-xs font-semibold text-white">
            до ${listing.budget}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-route-light">
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm">🙂</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{p?.name ?? 'Путешественник'}</p>
            <p className="text-xs text-mut">{p ? GENDER_LABEL[p.gender] : ''}</p>
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-sm font-medium leading-snug">
          Я {listing.title}
        </h3>
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-route">
          <span className="truncate">🛫 {listing.city}</span>
          {listing.to_city && (
            <>
              <span>→</span>
              <span className="truncate">{listing.to_city} 🛬</span>
            </>
          )}
        </div>
        {listing.date_from && (
          <p className="mt-1.5 text-xs text-mut">
            📅 {new Date(listing.date_from).toLocaleDateString('ru-RU')}
            {listing.date_to ? ` — ${new Date(listing.date_to).toLocaleDateString('ru-RU')}` : ''}
          </p>
        )}
      </div>
    </Link>
  );
}

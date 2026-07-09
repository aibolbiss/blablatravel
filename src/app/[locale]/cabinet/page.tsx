import { createClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Listing, Profile } from '@/lib/types';
import { getCityLabel } from '@/lib/geo-labels';
import DeleteListingButton from '@/components/DeleteListingButton';
import ListingTitle from '@/components/ListingTitle';

export const dynamic = 'force-dynamic';

export default async function CabinetPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations('cabinet');
  const tCommon = await getTranslations('common');
  const tProfile = await getTranslations('profile');
  const locale = await getLocale();
  const supabase = createClient();
  const userId = getUserId()!;

  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const [{ data: profile }, { data: listings }, { count }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('listings').select('*').eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  const p = profile as Profile;
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="py-10 md:py-10">
      <div className="flex flex-col gap-4 md:flex-wrap md:items-center">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-route-light">
          {p.avatar_url ? (
            <Image src={p.avatar_url} alt={p.name} fill sizes="64px" className="object-cover" />
          ) : <div className="flex h-full items-center justify-center text-2xl">🙂</div>}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-mut">{p.city ? `${p.city}, ${p.country}` : tProfile('cityNotSet')}</p>
        </div>
        <div className="flex flex-col gap-2 md:ml-auto md:flex-row md:gap-3">
          <Link href="/cabinet/profile" className="btn-ghost text-center">{t('profileSettings')}</Link>
          <Link href="/cabinet/listings/new" className="btn-primary text-center">{t('newListing')}</Link>
        </div>
      </div>

      <div className="route-line mt-8" />

      <h2 className="mt-8 font-display text-lg font-semibold">{t('myListings')}</h2>
      {(listings ?? []).length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">{t('noListingsTitle')}</p>
          <p className="mt-1 text-sm text-mut">{t('noListingsText')}</p>
          <Link href="/cabinet/listings/new" className="btn-primary mt-5">{t('createListing')}</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {(listings as Listing[]).map((l) => (
            <div key={l.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3 min-w-0 flex-1">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-route-light">
                  {l.photo_url && (
                    <Image src={l.photo_url} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/listing/${l.id}`} className="font-semibold hover:text-route line-clamp-2"><ListingTitle title={l.title} /></Link>
                  <div className="mt-1.5 flex items-center gap-2 text-xs font-medium text-route">
                    <span className="truncate">🛫 {getCityLabel(l.city, locale)}</span>
                    {l.to_city && (
                      <>
                        <span>→</span>
                        <span className="truncate">{getCityLabel(l.to_city, locale)} 🛬</span>
                      </>
                    )}
                  </div>
                  {l.date_from && (
                    <p className="mt-1 text-xs text-mut">
                      📅 {new Date(l.date_from).toLocaleDateString(locale)}
                      {l.date_to ? ` — ${new Date(l.date_to).toLocaleDateString(locale)}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 md:shrink-0">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                  {l.is_active ? t('active') : t('hidden')}
                </span>
                <Link href={`/cabinet/listings/${l.id}/edit`} className="btn-ghost w-full md:w-auto text-center text-sm">{t('edit')}</Link>
                <DeleteListingButton id={l.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && <Link href={`/cabinet?page=${page - 1}`} className="btn-ghost">{tCommon('back')}</Link>}
          <span className="flex items-center px-4 py-2">{tCommon('pageOf', { page, total: totalPages })}</span>
          {page < totalPages && <Link href={`/cabinet?page=${page + 1}`} className="btn-primary">{tCommon('forward')}</Link>}
        </div>
      )}
    </div>
  );
}

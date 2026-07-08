import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Listing, Profile } from '@/lib/types';
import DeleteListingButton from '@/components/DeleteListingButton';

export const dynamic = 'force-dynamic';

export default async function CabinetPage({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const [{ data: profile }, { data: listings }, { count }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('listings').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
  ]);
  const p = profile as Profile;
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="py-10 md:py-10">
      <div className="flex flex-col gap-4 md:flex-wrap md:items-center">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-route-light">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
          ) : <div className="flex h-full items-center justify-center text-2xl">🙂</div>}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-mut">{p.city ? `${p.city}, ${p.country}` : 'Город не указан'}</p>
        </div>
        <div className="flex flex-col gap-2 md:ml-auto md:flex-row md:gap-3">
          <Link href="/cabinet/profile" className="btn-ghost text-center">Настройки профиля</Link>
          <Link href="/cabinet/listings/new" className="btn-primary text-center">+ Новое объявление</Link>
        </div>
      </div>

      <div className="route-line mt-8" />

      <h2 className="mt-8 font-display text-lg font-semibold">Мои объявления</h2>
      {(listings ?? []).length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">У вас пока нет объявлений</p>
          <p className="mt-1 text-sm text-mut">Расскажите, куда вы собираетесь — и найдите компанию.</p>
          <Link href="/cabinet/listings/new" className="btn-primary mt-5">Создать объявление</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {(listings as Listing[]).map((l) => (
            <div key={l.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card md:flex-wrap md:items-center">
              <div className="flex gap-3 min-w-0 flex-1">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-route-light">
                  {l.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/listing/${l.id}`} className="font-semibold hover:text-route line-clamp-2">{l.title}</Link>
                  <div className="mt-1.5 flex items-center gap-2 text-xs font-medium text-route">
                    <span className="truncate">🛫 {l.city}</span>
                    {l.to_city && (
                      <>
                        <span>→</span>
                        <span className="truncate">{l.to_city} 🛬</span>
                      </>
                    )}
                  </div>
                  {l.date_from && (
                    <p className="mt-1 text-xs text-mut">
                      📅 {new Date(l.date_from).toLocaleDateString('ru-RU')}
                      {l.date_to ? ` — ${new Date(l.date_to).toLocaleDateString('ru-RU')}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-wrap md:items-center md:gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                  {l.is_active ? 'Активно' : 'Скрыто'}
                </span>
                <Link href={`/cabinet/listings/${l.id}/edit`} className="btn-ghost w-full md:w-auto text-center text-sm">Редактировать</Link>
                <DeleteListingButton id={l.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && <Link href={`/cabinet?page=${page - 1}`} className="btn-ghost">← Назад</Link>}
          <span className="flex items-center px-4 py-2">Страница {page} из {totalPages}</span>
          {page < totalPages && <Link href={`/cabinet?page=${page + 1}`} className="btn-primary">Вперед →</Link>}
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import AdminDeleteButton from './AdminDeleteButton';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminListingsPage() {
  const supabase = createClient();

  const [{ data: listings }, emailByUser] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, city, to_city, is_active, created_at, user_id, profiles!listings_user_id_fkey(name, avatar_url, created_at)')
      .order('created_at', { ascending: false }),
    getUserEmailMap(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Объявления</h1>
      <p className="mt-1 text-sm text-mut">Всего: {listings?.length ?? 0}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg text-left text-xs uppercase text-mut">
              <th className="px-4 py-3 font-medium">Объявление</th>
              <th className="px-4 py-3 font-medium">Автор</th>
              <th className="px-4 py-3 font-medium">Регистрация автора</th>
              <th className="px-4 py-3 font-medium">Маршрут</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Создано</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l: any) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                <td className="max-w-xs truncate px-4 py-3 font-medium" title={l.title}>{l.title}</td>
                <td className="px-4 py-3">
                  <p className="text-mut">{l.profiles?.name ?? '—'}</p>
                  <p className="truncate text-xs text-mut/70">{emailByUser.get(l.user_id) ?? '—'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mut">
                  {l.profiles?.created_at ? formatDateTime(l.profiles.created_at) : '—'}
                </td>
                <td className="px-4 py-3 text-mut">
                  {l.city}{l.to_city ? ` → ${l.to_city}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                    {l.is_active ? 'Активно' : 'Скрыто'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mut">{formatDateTime(l.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton id={l.id} title={l.title} />
                </td>
              </tr>
            ))}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mut">Объявлений пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import AdminDeleteButton from './AdminDeleteButton';

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const supabase = createClient();

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, city, to_city, is_active, created_at, profiles!listings_user_id_fkey(name, avatar_url)')
    .order('created_at', { ascending: false });

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
                <td className="px-4 py-3 text-mut">{l.profiles?.name ?? '—'}</td>
                <td className="px-4 py-3 text-mut">
                  {l.city}{l.to_city ? ` → ${l.to_city}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                    {l.is_active ? 'Активно' : 'Скрыто'}
                  </span>
                </td>
                <td className="px-4 py-3 text-mut">{new Date(l.created_at).toLocaleDateString('ru-RU')}</td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton id={l.id} title={l.title} />
                </td>
              </tr>
            ))}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mut">Объявлений пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

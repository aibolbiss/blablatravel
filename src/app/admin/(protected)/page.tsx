import { createClient } from '@/lib/supabase/server';
import { GENDER_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from('profiles').select('id, name, gender, city, country, avatar_url, created_at'),
    supabase.from('listings').select('id, user_id, is_active'),
  ]);

  const counts = new Map<string, { total: number; active: number }>();
  for (const l of listings ?? []) {
    const c = counts.get(l.user_id) ?? { total: 0, active: 0 };
    c.total += 1;
    if (l.is_active) c.active += 1;
    counts.set(l.user_id, c);
  }

  const rows = (profiles ?? [])
    .map((p) => ({ ...p, count: counts.get(p.id) ?? { total: 0, active: 0 } }))
    .sort((a, b) => b.count.total - a.count.total);

  const totalListings = listings?.length ?? 0;
  const totalUsers = profiles?.length ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Пользователи</h1>
      <div className="mt-4 flex gap-4">
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs text-mut uppercase">Пользователей</p>
          <p className="text-xl font-bold">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs text-mut uppercase">Объявлений всего</p>
          <p className="text-xl font-bold">{totalListings}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg text-left text-xs uppercase text-mut">
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Пол</th>
              <th className="px-4 py-3 font-medium">Город</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
              <th className="px-4 py-3 text-right font-medium">Объявлений</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-route-light">
                      {p.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-mut">{GENDER_LABEL[p.gender] ?? '—'}</td>
                <td className="px-4 py-3 text-mut">{p.city ? `${p.city}, ${p.country}` : '—'}</td>
                <td className="px-4 py-3 text-mut">{new Date(p.created_at).toLocaleDateString('ru-RU')}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold">{p.count.total}</span>
                  {p.count.total > 0 && p.count.active !== p.count.total && (
                    <span className="ml-1 text-xs text-mut">({p.count.active} активно)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

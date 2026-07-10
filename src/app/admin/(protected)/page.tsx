import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import AdminUsersTable from './AdminUsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ data: profiles }, { data: listings }, emailByUser] = await Promise.all([
    supabase.from('profiles').select('id, name, gender, city, country, avatar_url, created_at'),
    supabase.from('listings').select('id, user_id, is_active'),
    getUserEmailMap(),
  ]);

  const counts = new Map<string, { total: number; active: number }>();
  for (const l of listings ?? []) {
    const c = counts.get(l.user_id) ?? { total: 0, active: 0 };
    c.total += 1;
    if (l.is_active) c.active += 1;
    counts.set(l.user_id, c);
  }

  const rows = (profiles ?? [])
    .map((p) => ({ ...p, email: emailByUser.get(p.id) ?? '—', count: counts.get(p.id) ?? { total: 0, active: 0 } }))
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

      <AdminUsersTable rows={rows} />
    </div>
  );
}

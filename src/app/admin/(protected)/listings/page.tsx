import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import AdminListingsTable, { ListingRow } from './AdminListingsTable';

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const supabase = createClient();

  const [{ data: listings }, emailByUser] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, city, to_city, is_active, created_at, user_id, profiles!listings_user_id_fkey(name, avatar_url, created_at)')
      .order('created_at', { ascending: false }),
    getUserEmailMap(),
  ]);

  const rows: ListingRow[] = (listings ?? []).map((l: any) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    to_city: l.to_city,
    is_active: l.is_active,
    created_at: l.created_at,
    user_id: l.user_id,
    authorName: l.profiles?.name ?? '—',
    authorEmail: emailByUser.get(l.user_id) ?? '—',
    authorRegisteredAt: l.profiles?.created_at ?? null,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Объявления</h1>
      <p className="mt-1 text-sm text-mut">Всего: {rows.length}</p>

      <AdminListingsTable rows={rows} />
    </div>
  );
}

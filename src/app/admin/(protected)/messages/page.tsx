import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import AdminMessagesList, { MessagesRow } from './AdminMessagesList';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const supabase = createClient();

  const [{ data: convs }, emailByUser] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, user_a, user_b, a:profiles!conversations_user_a_fkey(id, name, avatar_url), b:profiles!conversations_user_b_fkey(id, name, avatar_url)'),
    getUserEmailMap(),
  ]);

  const convIds = (convs ?? []).map((c) => c.id);
  const { data: msgs } = convIds.length
    ? await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: true })
    : { data: [] as { conversation_id: string; content: string; created_at: string }[] };

  const stats = new Map<string, { count: number; lastMessage: string; lastAt: string }>();
  for (const m of msgs ?? []) {
    const s = stats.get(m.conversation_id) ?? { count: 0, lastMessage: '', lastAt: '' };
    s.count += 1;
    s.lastMessage = m.content;
    s.lastAt = m.created_at;
    stats.set(m.conversation_id, s);
  }

  // Группируем по каждому участнику: у кого с кем есть переписка —
  // строим карту userId -> [{собеседник, диалог, статистика}]
  type Partner = { convId: string; other: { id: string; name: string; avatar_url: string | null }; count: number; lastMessage: string; lastAt: string };
  const byUser = new Map<string, { user: { id: string; name: string; avatar_url: string | null }; partners: Partner[] }>();

  for (const c of (convs ?? []) as any[]) {
    const a = c.a;
    const b = c.b;
    if (!a || !b) continue;
    const s = stats.get(c.id) ?? { count: 0, lastMessage: '', lastAt: '' };

    if (!byUser.has(a.id)) byUser.set(a.id, { user: a, partners: [] });
    byUser.get(a.id)!.partners.push({ convId: c.id, other: b, ...s });

    if (!byUser.has(b.id)) byUser.set(b.id, { user: b, partners: [] });
    byUser.get(b.id)!.partners.push({ convId: c.id, other: a, ...s });
  }

  const rows: MessagesRow[] = Array.from(byUser.values())
    .map((r) => ({
      user: { ...r.user, email: emailByUser.get(r.user.id) ?? '—' },
      partners: r.partners
        .map((p) => ({ ...p, other: { ...p.other, email: emailByUser.get(p.other.id) ?? '—' } }))
        .sort((x, y) => (y.lastAt || '').localeCompare(x.lastAt || '')),
    }))
    .sort((x, y) => y.partners.length - x.partners.length);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Переписки</h1>
      <p className="mt-1 text-sm text-mut">
        Пользователей с перепиской: {rows.length} · диалогов всего: {convs?.length ?? 0}
      </p>

      <AdminMessagesList rows={rows} />
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import DeleteConversationButton from './DeleteConversationButton';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

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

  const rows = Array.from(byUser.values())
    .map((r) => ({
      ...r,
      partners: r.partners.sort((x, y) => (y.lastAt || '').localeCompare(x.lastAt || '')),
    }))
    .sort((x, y) => y.partners.length - x.partners.length);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Переписки</h1>
      <p className="mt-1 text-sm text-mut">
        Пользователей с перепиской: {rows.length} · диалогов всего: {convs?.length ?? 0}
      </p>

      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.user.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
                {r.user.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.user.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{r.user.name}</p>
                <p className="truncate text-xs text-mut">{emailByUser.get(r.user.id) ?? '—'}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-route-light px-2.5 py-1 text-xs font-semibold text-route">
                {r.partners.length} {r.partners.length === 1 ? 'собеседник' : 'собеседников'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.partners.map((p) => (
                <div
                  key={p.convId}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/messages/${p.convId}`}
                    className="flex min-w-0 items-center gap-2 hover:text-route"
                    title={p.lastMessage ? `${p.lastMessage} — ${formatDateTime(p.lastAt)}` : undefined}
                  >
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-route-light">
                      {p.other.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.other.avatar_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="min-w-0 truncate font-medium">{p.other.name}</span>
                    <span className="shrink-0 text-xs text-mut">({p.count})</span>
                  </Link>
                  <DeleteConversationButton id={p.convId} label={`${r.user.name} ↔ ${p.other.name}`} compact />
                </div>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-mut">
            Переписок пока нет
          </div>
        )}
      </div>
    </div>
  );
}

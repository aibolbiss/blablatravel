import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, getUserEmailMap } from '@/lib/supabase/admin';
import { GENDER_LABEL } from '@/lib/types';
import AdminDeleteUserButton from '../../AdminDeleteUserButton';
import AdminDeleteButton from '../../listings/AdminDeleteButton';
import DeleteConversationButton from '../../messages/DeleteConversationButton';
import DeleteMatchButton from '../../matches/DeleteMatchButton';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const supabase = createClient();
  const admin = createAdminClient();

  const [{ data: profile }, emailByUser] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    getUserEmailMap(),
  ]);
  if (!profile) notFound();

  const [{ data: listings }, { data: convs }, { data: likeRows }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, city, to_city, budget, date_from, date_to, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('conversations')
      .select('id, user_a, user_b, a:profiles!conversations_user_a_fkey(id, name, avatar_url), b:profiles!conversations_user_b_fkey(id, name, avatar_url)')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
    // swipes — RLS показывает только свои строки, для чужих нужен сервисный ключ
    admin.from('swipes').select('from_user_id, to_user_id, created_at').eq('liked', true).or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
  ]);

  // ---- Переписки: подтягиваем статистику сообщений по каждому диалогу ----
  const convIds = (convs ?? []).map((c) => c.id);
  const { data: msgs } = convIds.length
    ? await supabase.from('messages').select('conversation_id, content, created_at').in('conversation_id', convIds).order('created_at', { ascending: true })
    : { data: [] as { conversation_id: string; content: string; created_at: string }[] };

  const msgStats = new Map<string, { count: number; lastMessage: string; lastAt: string }>();
  for (const m of msgs ?? []) {
    const s = msgStats.get(m.conversation_id) ?? { count: 0, lastMessage: '', lastAt: '' };
    s.count += 1;
    s.lastMessage = m.content;
    s.lastAt = m.created_at;
    msgStats.set(m.conversation_id, s);
  }

  const conversations = (convs ?? [])
    .map((c: any) => {
      const other = c.user_a === userId ? c.b : c.a;
      const s = msgStats.get(c.id) ?? { count: 0, lastMessage: '', lastAt: '' };
      return { convId: c.id, other, ...s };
    })
    .filter((c) => c.other)
    .sort((x, y) => (y.lastAt || '').localeCompare(x.lastAt || ''));

  // ---- Взаимности: пересечение "кого лайкнул я" и "кто лайкнул меня" ----
  const likedByMe = new Map<string, string>();
  const likedMe = new Map<string, string>();
  for (const s of likeRows ?? []) {
    if (s.from_user_id === userId) likedByMe.set(s.to_user_id, s.created_at);
    if (s.to_user_id === userId) likedMe.set(s.from_user_id, s.created_at);
  }
  const matchPartnerIds = Array.from(likedByMe.keys()).filter((id) => likedMe.has(id));
  const matchedAtById = new Map(
    matchPartnerIds.map((id) => {
      const a = likedByMe.get(id)!;
      const b = likedMe.get(id)!;
      return [id, a > b ? a : b];
    })
  );
  const { data: matchProfiles } = matchPartnerIds.length
    ? await supabase.from('profiles').select('id, name, avatar_url').in('id', matchPartnerIds)
    : { data: [] as { id: string; name: string; avatar_url: string | null }[] };
  const matches = (matchProfiles ?? [])
    .map((p) => ({ partner: p, matchedAt: matchedAtById.get(p.id)! }))
    .sort((x, y) => y.matchedAt.localeCompare(x.matchedAt));

  const activeCount = (listings ?? []).filter((l) => l.is_active).length;

  return (
    <div>
      <Link href="/admin" className="text-xs text-mut hover:text-route">← Все пользователи</Link>

      {/* ---- Карточка профиля ---- */}
      <div className="mt-2 flex flex-wrap items-start gap-5 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-route-light">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold">{profile.name}</h1>
            {profile.is_admin && (
              <span className="rounded-full bg-night px-2 py-0.5 text-xs font-semibold text-white">админ</span>
            )}
          </div>
          <p className="mt-1 text-sm text-mut">{emailByUser.get(profile.id) ?? '—'}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-mut">
            <span>{GENDER_LABEL[profile.gender] ?? '—'}</span>
            <span>{profile.city ? `${profile.city}, ${profile.country}` : 'Город не указан'}</span>
            <span>Регистрация: {formatDateTime(profile.created_at)}</span>
            <span>Сообщения: {profile.allow_messages ? 'разрешены' : 'закрыты'}</span>
            <span>На карте: {profile.show_on_map ? 'да' : 'нет'}</span>
          </div>
          {profile.bio && <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm text-ink">{profile.bio}</p>}
        </div>
        <AdminDeleteUserButton id={profile.id} name={profile.name} redirectTo="/admin" />
      </div>

      {/* ---- Статистика ---- */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase text-mut">Объявлений</p>
          <p className="text-xl font-bold">{listings?.length ?? 0}{listings?.length ? <span className="ml-1 text-sm font-normal text-mut">({activeCount} активно)</span> : null}</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase text-mut">Переписок</p>
          <p className="text-xl font-bold">{conversations.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase text-mut">Взаимностей</p>
          <p className="text-xl font-bold">{matches.length}</p>
        </div>
      </div>

      {/* ---- Объявления ---- */}
      <h2 className="mt-8 font-display text-lg font-bold">Объявления</h2>
      <div className="mt-3 space-y-2">
        {(listings ?? []).map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" title={l.title}>{l.title}</p>
              <p className="text-xs text-mut">
                {l.city}{l.to_city ? ` → ${l.to_city}` : ''} · создано {formatDateTime(l.created_at)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
              {l.is_active ? 'Активно' : 'Скрыто'}
            </span>
            <AdminDeleteButton id={l.id} title={l.title} />
          </div>
        ))}
        {(listings ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-mut">Объявлений нет</div>
        )}
      </div>

      {/* ---- Переписки ---- */}
      <h2 className="mt-8 font-display text-lg font-bold">Переписки</h2>
      <div className="mt-3 space-y-2">
        {conversations.map((c) => (
          <div key={c.convId} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
              {c.other.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.other.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <Link href={`/admin/messages/${c.convId}`} className="min-w-0 flex-1 hover:text-route">
              <p className="truncate font-medium">{c.other.name}</p>
              <p className="truncate text-xs text-mut">{emailByUser.get(c.other.id) ?? '—'}</p>
              {c.lastMessage && <p className="mt-0.5 truncate text-xs text-mut">{c.lastMessage}</p>}
            </Link>
            <span className="shrink-0 text-xs text-mut">{c.count} {c.count === 1 ? 'сообщение' : 'сообщений'}</span>
            <DeleteConversationButton id={c.convId} label={`${profile.name} ↔ ${c.other.name}`} />
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-mut">Переписок нет</div>
        )}
      </div>

      {/* ---- Взаимности ---- */}
      <h2 className="mt-8 font-display text-lg font-bold">Взаимности</h2>
      <div className="mt-3 space-y-2">
        {matches.map((m) => (
          <div key={m.partner.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
              {m.partner.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.partner.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <Link href={`/admin/users/${m.partner.id}`} className="min-w-0 flex-1 hover:text-route">
              <p className="truncate font-medium">{m.partner.name}</p>
              <p className="truncate text-xs text-mut">{emailByUser.get(m.partner.id) ?? '—'}</p>
            </Link>
            <span className="shrink-0 text-xs text-mut">{formatDateTime(m.matchedAt)}</span>
            <DeleteMatchButton userIdA={userId} userIdB={m.partner.id} label={`${profile.name} ↔ ${m.partner.name}`} />
          </div>
        ))}
        {matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-mut">Взаимных совпадений нет</div>
        )}
      </div>
    </div>
  );
}

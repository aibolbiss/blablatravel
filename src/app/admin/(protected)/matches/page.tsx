import { createAdminClient, getUserEmailMap } from '@/lib/supabase/admin';
import AdminMatchesList, { MatchPair } from './AdminMatchesList';
import AdminNonMutualList, { SwipeRow } from './AdminNonMutualList';

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  const admin = createAdminClient();

  const [{ data: allSwipes }, emailByUser] = await Promise.all([
    admin.from('swipes').select('from_user_id, to_user_id, liked, created_at'),
    getUserEmailMap(),
  ]);

  // Пара — взаимный матч, если существуют обе строки: A→B и B→A с liked=true.
  const likeMap = new Map<string, string>(); // "from:to" -> created_at, только liked=true
  for (const s of allSwipes ?? []) {
    if (s.liked) likeMap.set(`${s.from_user_id}:${s.to_user_id}`, s.created_at);
  }

  const mutualKeys = new Set<string>(); // "from:to" — обе стороны, входящие в матч
  const pairs: { a: string; b: string; matchedAt: string }[] = [];
  const seenPair = new Set<string>();
  for (const s of allSwipes ?? []) {
    if (!s.liked) continue;
    const reverseAt = likeMap.get(`${s.to_user_id}:${s.from_user_id}`);
    if (!reverseAt) continue;
    mutualKeys.add(`${s.from_user_id}:${s.to_user_id}`);
    const pairKey = [s.from_user_id, s.to_user_id].sort().join(':');
    if (seenPair.has(pairKey)) continue;
    seenPair.add(pairKey);
    const matchedAt = s.created_at > reverseAt ? s.created_at : reverseAt;
    pairs.push({ a: s.from_user_id, b: s.to_user_id, matchedAt });
  }
  pairs.sort((x, y) => y.matchedAt.localeCompare(x.matchedAt));

  // Всё, что не вошло во взаимный матч — односторонние лайки и все дизлайки.
  const nonMutual = (allSwipes ?? [])
    .filter((s) => !mutualKeys.has(`${s.from_user_id}:${s.to_user_id}`))
    .sort((x, y) => y.created_at.localeCompare(x.created_at));

  const userIds = Array.from(new Set([
    ...pairs.flatMap((p) => [p.a, p.b]),
    ...nonMutual.flatMap((s) => [s.from_user_id, s.to_user_id]),
  ]));
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, name, avatar_url').in('id', userIds)
    : { data: [] as { id: string; name: string; avatar_url: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const displayPairs: MatchPair[] = pairs
    .map((pair) => {
      const a = profileById.get(pair.a);
      const b = profileById.get(pair.b);
      if (!a || !b) return null;
      return {
        a: { ...a, email: emailByUser.get(a.id) ?? '—' },
        b: { ...b, email: emailByUser.get(b.id) ?? '—' },
        matchedAt: pair.matchedAt,
      };
    })
    .filter((p): p is MatchPair => p !== null);

  const nonMutualRows: SwipeRow[] = nonMutual
    .map((s) => {
      const from = profileById.get(s.from_user_id);
      const to = profileById.get(s.to_user_id);
      if (!from || !to) return null;
      return {
        from: { ...from, email: emailByUser.get(from.id) ?? '—' },
        to: { ...to, email: emailByUser.get(to.id) ?? '—' },
        liked: s.liked,
        createdAt: s.created_at,
      };
    })
    .filter((r): r is SwipeRow => r !== null);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Взаимности</h1>
      <p className="mt-1 text-sm text-mut">Пар с взаимным лайком: {displayPairs.length}</p>

      <AdminMatchesList pairs={displayPairs} />

      <h2 className="mt-10 font-display text-lg font-bold">Не взаимности</h2>
      <p className="mt-1 text-sm text-mut">Односторонние лайки и дизлайки: {nonMutualRows.length}</p>

      <AdminNonMutualList rows={nonMutualRows} />
    </div>
  );
}

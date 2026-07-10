import { createAdminClient, getUserEmailMap } from '@/lib/supabase/admin';
import AdminMatchesList, { MatchPair } from './AdminMatchesList';

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  const admin = createAdminClient();

  const [{ data: likes }, emailByUser] = await Promise.all([
    admin.from('swipes').select('from_user_id, to_user_id, created_at').eq('liked', true),
    getUserEmailMap(),
  ]);

  // Пара — взаимный матч, если существуют обе строки: A→B и B→A с liked=true.
  const likeMap = new Map<string, string>(); // "from:to" -> created_at
  for (const s of likes ?? []) {
    likeMap.set(`${s.from_user_id}:${s.to_user_id}`, s.created_at);
  }

  const seen = new Set<string>();
  const pairs: { a: string; b: string; matchedAt: string }[] = [];
  for (const s of likes ?? []) {
    const reverseAt = likeMap.get(`${s.to_user_id}:${s.from_user_id}`);
    if (!reverseAt) continue;
    const key = [s.from_user_id, s.to_user_id].sort().join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    // Матч состоялся в момент второго (более позднего) лайка
    const matchedAt = s.created_at > reverseAt ? s.created_at : reverseAt;
    pairs.push({ a: s.from_user_id, b: s.to_user_id, matchedAt });
  }
  pairs.sort((x, y) => y.matchedAt.localeCompare(x.matchedAt));

  const userIds = Array.from(new Set(pairs.flatMap((p) => [p.a, p.b])));
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

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Взаимности</h1>
      <p className="mt-1 text-sm text-mut">Пар с взаимным лайком: {displayPairs.length}</p>

      <AdminMatchesList pairs={displayPairs} />
    </div>
  );
}

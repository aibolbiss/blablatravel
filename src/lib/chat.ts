import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/types';
import { conversationPreviewsQuery } from '@/lib/chat-queries';

export type ConvPreview = {
  id: string;
  other: Profile;
  lastMessage: string | null;
  lastAt: string | null;
  hasUnread: boolean;
  isMatch: boolean;
};

// Множество id пользователей, с которыми есть взаимный лайк (см.
// swipes_migration.sql) — определяет бейджик-сердечко в списке чатов и
// подпись "У вас взаимно" в самом диалоге.
export async function getMyMatchIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase.rpc('get_my_matches');
  return new Set((data ?? []).map((r: { other_user_id: string }) => r.other_user_id));
}

export async function getConversations(userId: string, offset = 0, limit = 20): Promise<{ previews: ConvPreview[], count: number }> {
  const supabase = createClient();
  const [{ data: convs, count }, matchIds] = await Promise.all([
    conversationPreviewsQuery(supabase, userId, offset, limit),
    getMyMatchIds(),
  ]);
  if (!convs || convs.length === 0) return { previews: [], count: count || 0 };

  const otherIds = convs.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const previews: ConvPreview[] = [];
  for (const c of convs) {
    const otherId = c.user_a === userId ? c.user_b : c.user_a;
    const other = byId.get(otherId);
    if (!other) continue;
    const last = c.last_message?.[0];
    previews.push({
      id: c.id,
      other,
      lastMessage: last?.content ?? null,
      lastAt: last?.created_at ?? null,
      hasUnread: c.unread.length > 0,
      isMatch: matchIds.has(otherId),
    });
  }
  previews.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
  return { previews, count: count || 0 };
}

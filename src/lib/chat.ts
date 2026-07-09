import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/types';

export type ConvPreview = {
  id: string;
  other: Profile;
  lastMessage: string | null;
  lastAt: string | null;
  hasUnread: boolean;
};

export async function getConversations(userId: string, offset = 0, limit = 20): Promise<{ previews: ConvPreview[], count: number }> {
  const supabase = createClient();
  const { data: convs, count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (!convs || convs.length === 0) return { previews: [], count: count || 0 };

  const otherIds = convs.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const convIds = convs.map((c) => c.id);
  const { data: unreadRows } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convIds)
    .neq('sender_id', userId)
    .is('read_at', null);
  const unreadSet = new Set((unreadRows ?? []).map((r) => r.conversation_id));

  const previews: ConvPreview[] = [];
  for (const c of convs) {
    const otherId = c.user_a === userId ? c.user_b : c.user_a;
    const other = byId.get(otherId);
    if (!other) continue;
    const { data: last } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    previews.push({
      id: c.id,
      other,
      lastMessage: last?.content ?? null,
      lastAt: last?.created_at ?? null,
      hasUnread: unreadSet.has(c.id),
    });
  }
  previews.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
  return { previews, count: count || 0 };
}

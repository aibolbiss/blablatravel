import type { SupabaseClient } from '@supabase/supabase-js';

// Limit each embedded collection, not the entire message history.
export function conversationPreviewsQuery(client: SupabaseClient, userId: string, offset: number, limit: number) {
  return client.from('conversations')
    .select('id,user_a,user_b,created_at,last_message:messages(content,created_at),unread:messages(id)', { count: 'exact' })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'last_message', ascending: false })
    .order('id', { referencedTable: 'last_message', ascending: false })
    .limit(1, { referencedTable: 'last_message' })
    .neq('unread.sender_id', userId)
    .is('unread.read_at', null)
    .limit(1, { referencedTable: 'unread' })
    .range(offset, offset + limit - 1);
}

export function unreadMessageQuery(client: SupabaseClient, userId: string) {
  // Filter membership explicitly: admins can also read unrelated chats via RLS.
  return client.from('messages')
    .select('id,conversations!inner(user_a,user_b)')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`, { referencedTable: 'conversations' })
    .neq('sender_id', userId)
    .is('read_at', null)
    .limit(1);
}

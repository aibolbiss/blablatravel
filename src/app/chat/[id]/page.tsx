import { createClient } from '@/lib/supabase/server';
import { getConversations } from '@/lib/chat';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { notFound } from 'next/navigation';
import { Message, Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: conv } = await supabase
    .from('conversations').select('*').eq('id', params.id).single();
  if (!conv) notFound();

  const otherId = conv.user_a === user!.id ? conv.user_b : conv.user_a;
  const [{ data: other }, { data: msgs }, result] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherId).single(),
    supabase.from('messages').select('*').eq('conversation_id', params.id)
      .order('created_at', { ascending: true }).limit(200),
    getConversations(user!.id, 0, 20),
  ]);
  const conversations = result.previews;
  if (!other) notFound();

  // Пометить все сообщения от другого пользователя как прочитанные
  if (msgs && msgs.length > 0) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', params.id)
      .eq('sender_id', otherId)
      .is('read_at', null);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 py-6">
      <div className="hidden sm:block">
        <ChatSidebar conversations={conversations} activeId={params.id} userId={user!.id} />
      </div>
      <ChatWindow
        conversationId={params.id}
        myId={user!.id}
        other={other as Profile}
        initialMessages={(msgs ?? []) as Message[]}
      />
    </div>
  );
}

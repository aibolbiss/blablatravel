import { createClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import { getConversations } from '@/lib/chat';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { notFound } from 'next/navigation';
import { Message, Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const userId = getUserId()!;

  const { data: conv } = await supabase
    .from('conversations').select('*').eq('id', params.id).single();
  if (!conv) notFound();

  const otherId = conv.user_a === userId ? conv.user_b : conv.user_a;
  const [{ data: other }, { data: msgs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherId).single(),
    supabase.from('messages').select('*').eq('conversation_id', params.id)
      .order('created_at', { ascending: true }).limit(200),
  ]);
  if (!other) notFound();

  // Пометить все сообщения от другого пользователя как прочитанные. msgs уже
  // получен выше — отражаем read_at и в нём, иначе ChatWindow при открытии
  // отрисует их как непрочитанные (зелёным) со старыми данными.
  if (msgs && msgs.length > 0) {
    const nowIso = new Date().toISOString();
    const { error: markReadError } = await supabase
      .from('messages')
      .update({ read_at: nowIso })
      .eq('conversation_id', params.id)
      .eq('sender_id', otherId)
      .is('read_at', null);

    if (markReadError) {
      console.error('[chat] Не удалось пометить сообщения прочитанными:', markReadError.message);
    } else {
      for (const m of msgs) {
        if (m.sender_id === otherId && !m.read_at) m.read_at = nowIso;
      }
    }
  }

  // Список диалогов для боковой панели запрашиваем ПОСЛЕ пометки
  // прочитанным — иначе текущий открытый диалог ещё покажется непрочитанным.
  const { previews: conversations } = await getConversations(userId, 0, 20);
  const isMatch = conversations.find((c) => c.id === params.id)?.isMatch ?? false;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 py-6">
      <div className="hidden sm:block">
        <ChatSidebar conversations={conversations} activeId={params.id} userId={userId} />
      </div>
      <ChatWindow
        conversationId={params.id}
        myId={userId}
        other={other as Profile}
        initialMessages={(msgs ?? []) as Message[]}
        isMatch={isMatch}
      />
    </div>
  );
}

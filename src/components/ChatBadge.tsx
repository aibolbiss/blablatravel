'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ChatBadge({ userId }: { userId: string }) {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = async () => {
    const supabase = createClient();
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (!conversations?.length) {
      setHasUnread(false);
      return;
    }

    // Получаем все сообщения которые не прочитаны (без read_at)
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id, read_at')
      .in('conversation_id', conversations.map((c) => c.id));

    // Проверяем, есть ли сообщения от других пользователей которые не прочитаны
    const hasUnreadMessages = (messages ?? []).some(
      (msg) => msg.sender_id !== userId && !msg.read_at
    );
    setHasUnread(hasUnreadMessages);
  };

  useEffect(() => {
    checkUnread();

    const supabase = createClient();

    // Подписываемся на новые сообщения через Realtime
    const channel = supabase
      .channel(`messages:badge:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Если сообщение не от текущего пользователя, ставим флаг
          if (payload.new.sender_id !== userId) {
            setHasUnread(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Если обновили, перепроверяем
          checkUnread();
        }
      )
      .subscribe();

    // Слушаем broadcast сигнал что сообщения прочитаны
    const statusChannel = supabase
      .channel(`read-status:${userId}`)
      .on('broadcast', { event: 'messages_read' }, () => {
        checkUnread();
      })
      .subscribe();

    return () => {
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel);
      });
      statusChannel.unsubscribe().then(() => {
        supabase.removeChannel(statusChannel);
      });
    };
  }, [userId]);

  return (
    <Link
      href="/chat"
      className="hover:text-ink relative text-sm font-medium text-mut"
    >
      Сообщения
      {hasUnread && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500" />
      )}
    </Link>
  );
}

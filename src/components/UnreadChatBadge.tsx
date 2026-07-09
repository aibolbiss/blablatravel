'use client';
import { useCallback, useEffect, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Красная точка на иконке чата — появляется при непрочитанном сообщении и
// пропадает сама, когда пользователь открывает диалог (chat/[id]/page.tsx
// помечает сообщения read_at на сервере). Перепроверяем и по realtime, и
// при каждом переходе по сайту — второе не зависит от того, долетело ли
// событие realtime, и поэтому надёжнее само по себе.
export default function UnreadChatBadge({ userId }: { userId: string }) {
  const [hasUnread, setHasUnread] = useState(false);
  const pathname = usePathname();
  // Компонент рендерится одновременно в десктопной и мобильной навигации —
  // у каждого экземпляра должен быть свой канал, иначе второй попытается
  // повесить обработчики на уже подписанный канал первого.
  const instanceId = useId();

  const checkUnread = useCallback(async () => {
    const supabase = createClient();
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (!conversations?.length) {
      setHasUnread(false);
      return;
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id, read_at')
      .in('conversation_id', conversations.map((c) => c.id));

    setHasUnread((messages ?? []).some((m) => m.sender_id !== userId && !m.read_at));
  }, [userId]);

  // Перепроверка при каждой навигации (не зависит от realtime)
  useEffect(() => {
    checkUnread();
  }, [pathname, checkUnread]);

  // Живое обновление, пока пользователь остаётся на одной странице
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`unread-badge:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id !== userId) setHasUnread(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => checkUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId, checkUnread]);

  if (!hasUnread) return null;
  return <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />;
}

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MessagesReadSignal({ userId, conversationId }: { userId: string; conversationId: string }) {
  useEffect(() => {
    // Даем ChatBadge время на загрузку, потом отправляем сигнал
    const timeout = setTimeout(() => {
      const channel = createClient()
        .channel(`read-status:${userId}`)
        .subscribe(() => {
          channel.send('broadcast', {
            event: 'messages_read',
            payload: { conversation_id: conversationId },
          });
          
          // Отписываемся после отправки
          setTimeout(() => {
            channel.unsubscribe();
          }, 100);
        });
    }, 200); // Даем время на загрузку

    return () => clearTimeout(timeout);
  }, [userId, conversationId]);

  return null;
}

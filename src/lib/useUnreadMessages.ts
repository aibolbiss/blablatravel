'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { unreadMessageQuery } from '@/lib/chat-queries';

export function useUnreadMessages(userId: string | null) {
  const pathname = usePathname();
  const [state, setState] = useState({ userId, unread: false });
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    if (!userId) return;
    const client = createClient();
    const controller = new AbortController();
    let disposed = false;
    let running = false;
    let queued = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      if (disposed) return;
      if (running) { queued = true; return; }
      running = true;
      try {
        const { data, error } = await unreadMessageQuery(client, userId!)
          .abortSignal(controller.signal);
        if (!disposed && !error) {
          const unread = Boolean(data?.length);
          setState((previous) => previous.userId === userId && previous.unread === unread
            ? previous : { userId, unread });
        }
      } catch {
        // Preserve the current badge on a transient failure; reconnect, focus
        // or the next realtime event will retry without blocking navigation.
      } finally {
        running = false;
        if (queued && !disposed) { queued = false; schedule(); }
      }
    }
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => { void check(); }, 150);
    }
    function onVisible() {
      if (document.visibilityState === 'visible') schedule();
    }
    refresh.current = schedule;
    schedule();
    const channel = client.channel(`header-unread:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, schedule)
      .subscribe((status) => { if (status === 'SUBSCRIBED') schedule(); });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', schedule);
    return () => {
      disposed = true;
      refresh.current = () => {};
      clearTimeout(timer);
      controller.abort();
      void client.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', schedule);
    };
  }, [userId]);

  useEffect(() => { refresh.current(); }, [pathname]);
  return state.userId === userId && state.unread;
}

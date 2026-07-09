'use client';
import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { ConvPreview } from '@/lib/chat';
import { Message } from '@/lib/types';

export default function ChatSidebar({
  conversations,
  activeId,
  userId,
}: {
  conversations: ConvPreview[]
  activeId?: string
  userId: string
}) {
  const t = useTranslations('chat');
  const router = useRouter();
  const instanceId = useId();
  // Локальная копия — обновляем её сразу из realtime-события, не дожидаясь
  // повторного серверного рендера (он может отставать по времени).
  const [items, setItems] = useState(conversations);

  useEffect(() => {
    setItems(conversations);
  }, [conversations]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-sidebar:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message;
          setItems((prev) => {
            const idx = prev.findIndex((c) => c.id === m.conversation_id);
            // Диалог не входит в уже загруженный список (например, только
            // что создан) — просто перезапрашиваем список с сервера целиком.
            if (idx === -1) {
              router.refresh();
              return prev;
            }
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              lastMessage: m.content,
              lastAt: m.created_at,
              hasUnread: m.sender_id !== userId ? true : next[idx].hasUnread,
            };
            next.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId, router]);

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-night text-white sm:w-72">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="font-display text-sm font-semibold">{t('sidebarTitle')}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 && (
          <p className="p-4 text-sm text-white/50">
            {t('noConversations')}
          </p>
        )}
        {items.map((c) => {
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/10 relative ${
                c.id === activeId ? 'bg-white/15' : ''
              }`}
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route">
                {c.other.avatar_url ? (
                  <Image src={c.other.avatar_url} alt="" fill sizes="36px" className="object-cover" />
                ) : <div className="flex h-full items-center justify-center text-sm">🙂</div>}
                {c.hasUnread && (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-night" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.other.name}</p>
                <p className={`truncate text-xs ${c.hasUnread ? 'font-semibold text-green-400' : 'text-white/50'}`}>
                  {c.lastMessage ?? t('noMessages')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

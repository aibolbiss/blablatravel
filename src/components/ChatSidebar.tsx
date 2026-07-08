'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ConvPreview } from '@/lib/chat';

export default function ChatSidebar({
  conversations, 
  activeId,
  userId,
}: { 
  conversations: ConvPreview[]
  activeId?: string
  userId: string
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-night text-white sm:w-72">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="font-display text-sm font-semibold">Сообщения</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-white/50">
            Диалогов пока нет. Откройте объявление и нажмите «Написать сообщение».
          </p>
        )}
        {conversations.map((c) => {
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.other.name}</p>
                <p className="truncate text-xs text-white/50">{c.lastMessage ?? 'Нет сообщений'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

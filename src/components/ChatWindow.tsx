'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message, Profile } from '@/lib/types';
import ChatMessages from './ChatMessages';

const TYPING_BROADCAST_THROTTLE_MS = 2000;
const TYPING_INDICATOR_TIMEOUT_MS = 3000;

export default function ChatWindow({
  conversationId, myId, other, initialMessages, isMatch,
}: {
  conversationId: string;
  myId: string;
  other: Profile;
  initialMessages: Message[];
  isMatch?: boolean;
}) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const typingHideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const readTimers = new Set<ReturnType<typeof setTimeout>>();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          // ChatSidebar updates its preview from the same realtime event.

          // Собеседник прислал сообщение, пока мы уже открыли этот диалог —
          // считаем его прочитанным вскоре после появления (зелёное → серое).
          if (m.sender_id !== myId) {
            setOtherTyping(false);
            clearTimeout(typingHideTimeoutRef.current);
            const timer = setTimeout(async () => {
              readTimers.delete(timer);
              const { error } = await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', m.id);
              if (!error) {
                setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x)));
              }
            }, 1200);
            readTimers.add(timer);
          }
        }
      )
      .subscribe();

    // "Печатает…" — эфемерный статус, не хранится в базе, просто broadcast
    // на канал диалога. Оба участника слушают один и тот же канал.
    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === myId) return;
        setOtherTyping(true);
        clearTimeout(typingHideTimeoutRef.current);
        typingHideTimeoutRef.current = setTimeout(() => setOtherTyping(false), TYPING_INDICATOR_TIMEOUT_MS);
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      clearTimeout(typingHideTimeoutRef.current);
      readTimers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleTextChange(value: string) {
    setText(value);
    const now = Date.now();
    if (value.trim() && now - lastTypingSentAtRef.current > TYPING_BROADCAST_THROTTLE_MS) {
      lastTypingSentAtRef.current = now;
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: myId },
      });
    }
  }

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(false);
    setText('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: myId, content })
      .select('*')
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
    } else {
      setSendError(true);
      setText((draft) => draft ? `${content}\n${draft}` : content);
    }
    setSending(false);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <button
          onClick={() => {
            router.push('/chat');
            // Список диалогов кэшируется — форсируем свежие данные, иначе
            // этот диалог может ещё раз мелькнуть непрочитанным в списке.
            router.refresh();
          }}
          aria-label={t('backToList')}
          title={t('backToList')}
          className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mut hover:bg-bg hover:text-ink sm:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-route-light">
          {other.avatar_url ? (
            <Image src={other.avatar_url} alt="" fill sizes="36px" className="object-cover" />
          ) : <div className="flex h-full items-center justify-center">🙂</div>}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {other.name}
            {isMatch && <span className="text-xs font-medium text-route">❤️ {t('matched')}</span>}
          </p>
          <p className="text-xs text-mut">{other.city ? `${other.city}, ${other.country}` : ''}</p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-5">
        <ChatMessages messages={messages} myId={myId} locale={locale} />
        <div ref={bottomRef} />
      </div>

      {otherTyping && (
        <div className="flex items-center gap-2 px-5 pb-1 text-xs text-mut">
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mut [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mut [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mut" />
          </span>
          {t('typing', { name: other.name })}
        </div>
      )}

      {sendError && <p role="alert" className="px-5 py-2 text-sm text-red-600">{t('sendError')}</p>}

      <div className="flex gap-2 border-t border-line p-3">
        <input
          className="input"
          placeholder={t('placeholder', { name: other.name })}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button className="btn-primary shrink-0" onClick={send} disabled={sending || !text.trim()}>
          {t('send')}
        </button>
      </div>
    </div>
  );
}

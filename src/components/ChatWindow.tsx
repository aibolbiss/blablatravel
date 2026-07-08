'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message, Profile } from '@/lib/types';
import LoadingSpinner from './LoadingSpinner';

export default function ChatWindow({
  conversationId, myId, other, initialMessages,
}: {
  conversationId: string;
  myId: string;
  other: Profile;
  initialMessages: Message[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    
    // Отправляем сигнал что вошли в диалог (для обновления баджиков)
    const statusChannel = supabase
      .channel(`read-status:${myId}`)
      .subscribe(() => {
        // После подписки отправляем сигнал
        statusChannel.send('broadcast', {
          event: 'messages_read',
          payload: { conversation_id: conversationId },
        });
      });

    return () => { 
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: myId, content })
      .select('*')
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
    }
    setSending(false);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <div className="h-9 w-9 overflow-hidden rounded-full bg-route-light">
          {other.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : <div className="flex h-full items-center justify-center">🙂</div>}
        </div>
        <div>
          <p className="text-sm font-semibold">{other.name}</p>
          <p className="text-xs text-mut">{other.city ? `${other.city}, ${other.country}` : ''}</p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-5">
        {messages.map((m, i) => {
          const mine = m.sender_id === myId;
          const prev = messages[i - 1];
          const grouped = prev && prev.sender_id === m.sender_id;
          
          const curr = new Date(m.created_at);
          const prevDate = prev ? new Date(prev.created_at) : null;
          const isDifferentDay = !prevDate || curr.toDateString() !== prevDate.toDateString();
          
          return (
            <div key={m.id}>
              {isDifferentDay && (
                <div className="flex items-center justify-center gap-2 my-4">
                  <div className="flex-1 h-px bg-line" />
                  <p className="text-xs text-mut">{curr.toLocaleDateString('ru-RU')}</p>
                  <div className="flex-1 h-px bg-line" />
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'mt-3'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  mine ? 'bg-route text-white' : 'bg-bg text-ink'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-white/60' : 'text-mut'}`}>
                    {curr.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-line p-3">
        <input
          className="input"
          placeholder={`Написать ${other.name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button className="btn-primary shrink-0" onClick={send} disabled={sending || !text.trim()}>
          Отправить
        </button>
      </div>
      {sending && <LoadingSpinner />}
    </div>
  );
}

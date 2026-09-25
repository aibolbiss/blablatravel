import { memo } from 'react';
import type { Message } from '@/lib/types';

// Typing and typing-indicator updates do not need to render the history again.
const ChatMessages = memo(function ChatMessages({ messages, myId, locale }: {
  messages: Message[];
  myId: string;
  locale: string;
}) {
  return <>
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
                  <p className="text-xs text-mut">{curr.toLocaleDateString(locale)}</p>
                  <div className="flex-1 h-px bg-line" />
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'mt-3'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed transition-colors duration-500 ${
                  mine
                    ? 'bg-route text-white'
                    : m.read_at
                      ? 'bg-bg text-ink'
                      : 'border border-green-300 bg-green-100 text-green-900'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? 'text-right' : 'text-left'} ${
                    mine ? 'text-white/60' : m.read_at ? 'text-mut' : 'text-green-700'
                  }`}>
                    {curr.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
  </>;
});

export default ChatMessages;

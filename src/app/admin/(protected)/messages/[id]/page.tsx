import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserEmailMap } from '@/lib/supabase/admin';
import DeleteMessageButton from './DeleteMessageButton';
import DeleteConversationButton from '../DeleteConversationButton';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: conv }, emailByUser] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, a:profiles!conversations_user_a_fkey(id, name, avatar_url), b:profiles!conversations_user_b_fkey(id, name, avatar_url)')
      .eq('id', params.id)
      .single(),
    getUserEmailMap(),
  ]);
  if (!conv) notFound();

  const a: any = conv.a;
  const b: any = conv.b;

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/admin/messages" className="text-xs text-mut hover:text-route">← Все переписки</Link>
          <h1 className="font-display text-xl font-bold">{a?.name ?? '—'} ↔ {b?.name ?? '—'}</h1>
          <p className="text-xs text-mut">
            {emailByUser.get(a?.id) ?? '—'} ↔ {emailByUser.get(b?.id) ?? '—'}
          </p>
        </div>
        <DeleteConversationButton id={conv.id} label={`${a?.name ?? '—'} ↔ ${b?.name ?? '—'}`} />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-4 shadow-card">
        {(messages ?? []).map((m) => {
          const sender = m.sender_id === a?.id ? a : b;
          return (
            <div key={m.id} className="group flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-bg/60">
              <div className="min-w-0 text-sm">
                <span className="font-semibold">{sender?.name ?? '—'}:</span>{' '}
                <span className="whitespace-pre-wrap break-words">{m.content}</span>
                <span className="ml-2 text-xs text-mut">{formatDateTime(m.created_at)}</span>
                {!m.read_at && <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">не прочитано</span>}
              </div>
              <DeleteMessageButton id={m.id} />
            </div>
          );
        })}
        {(messages ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-mut">Сообщений пока нет</p>
        )}
      </div>
    </div>
  );
}

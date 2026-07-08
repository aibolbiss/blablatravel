'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

export default function StartChatButton({
  otherUserId, allowed, isSelf, isAuthed,
}: { otherUserId: string; allowed: boolean; isSelf: boolean; isAuthed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  if (isSelf) return null;
  if (!allowed) {
    return <p className="text-sm text-mut">🔒 Пользователь закрыл личные сообщения</p>;
  }

  async function start() {
    if (!isAuthed) return router.push('/auth/login');
    setBusy(true); 
    setError('');
    const { data, error } = await supabase.rpc('get_or_create_conversation', { other_user: otherUserId });
    setBusy(false);
    if (error) return setError(error.message);
    router.push(`/chat/${data}`);
  }

  return (
    <div>
      <button className="btn-primary w-full text-center" onClick={start} disabled={busy}>
        {busy ? 'Открываем чат…' : '💌 Написать сообщение'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {busy && <LoadingSpinner />}
    </div>
  );
}

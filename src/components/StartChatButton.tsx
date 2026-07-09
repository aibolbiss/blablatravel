'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import LoadingSpinner from './LoadingSpinner';
import { startNavLoading } from '@/lib/navLoading';

export default function StartChatButton({
  otherUserId, allowed, isSelf, isAuthed,
}: { otherUserId: string; allowed: boolean; isSelf: boolean; isAuthed: boolean }) {
  const t = useTranslations('startChat');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  if (isSelf) return null;
  if (!allowed) {
    return <p className="text-sm text-mut">{t('locked')}</p>;
  }

  async function start() {
    if (!isAuthed) return router.push('/auth/login');
    setBusy(true);
    setError('');
    const { data, error } = await supabase.rpc('get_or_create_conversation', { other_user: otherUserId });
    setBusy(false);
    if (error) return setError(error.message);
    startNavLoading();
    router.push(`/chat/${data}`);
  }

  return (
    <div>
      <button className="btn-primary w-full text-center" onClick={start} disabled={busy}>
        {busy ? t('opening') : t('writeMessage')}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {busy && <LoadingSpinner />}
    </div>
  );
}

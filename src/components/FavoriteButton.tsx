'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import NotificationModal from './NotificationModal';
import LoadingSpinner from './LoadingSpinner';

export default function FavoriteButton({
  listingId, userId, initial,
}: { listingId: string; userId: string | null; initial: boolean }) {
  const t = useTranslations('favoriteButton');
  const tNotif = useTranslations('notif');
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    if (!userId) return router.push('/auth/login');
    setBusy(true);
    if (fav) {
      await supabase.from('favorites').delete().match({ user_id: userId, listing_id: listingId });
      setFav(false);
      setShowNotif(false);
    } else {
      await supabase.from('favorites').insert({ user_id: userId, listing_id: listingId });
      setFav(true);
      setShowNotif(true);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <button
        className={`w-full py-2 px-4 rounded-lg font-medium transition ${
          fav
            ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-900'
            : 'btn-ghost'
        }`}
        onClick={toggle}
        disabled={busy}
      >
        {fav ? t('inFavorites') : t('addToFavorites')}
      </button>
      <NotificationModal isOpen={showNotif} message={tNotif('addedToFavorites')} onClose={() => setShowNotif(false)} />
      {busy && <LoadingSpinner />}
    </>
  );
}

'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import NotificationModal from './NotificationModal';
import LoadingSpinner from './LoadingSpinner';

export default function FavoriteButton({
  listingId, userId, initial,
}: { listingId: string; userId: string | null; initial: boolean }) {
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
        {fav ? '⭐ В избранном' : '⭐ В избранное'}
      </button>
      <NotificationModal isOpen={showNotif} message="✓ Добавилось в Избранное" onClose={() => setShowNotif(false)} />
      {busy && <LoadingSpinner />}
    </>
  );
}

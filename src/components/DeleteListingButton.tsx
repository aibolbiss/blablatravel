'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ConfirmModal from './ConfirmModal';
import LoadingSpinner from './LoadingSpinner';

export default function DeleteListingButton({ id }: { id: string }) {
  const t = useTranslations('cabinet');
  const tConfirm = useTranslations('confirm');
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await supabase.from('listings').delete().eq('id', id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting listing:', error);
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="rounded-xl px-4 py-2.5 text-sm font-semibold w-full md:w-auto text-center bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
        disabled={busy}
        onClick={() => setShowModal(true)}
      >
        {t('delete')}
      </button>
      <ConfirmModal
        isOpen={showModal}
        title={tConfirm('deleteListingTitle')}
        message={tConfirm('deleteListingMessage')}
        confirmText={tConfirm('deleteYes')}
        cancelText={tConfirm('cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={busy}
      />
      {busy && <LoadingSpinner />}
    </>
  );
}

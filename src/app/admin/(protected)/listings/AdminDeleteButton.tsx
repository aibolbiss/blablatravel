'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminDeleteButton({ id, title }: { id: string; title: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    setBusy(false);
    setShowModal(false);
    if (error) {
      alert('Не удалось удалить: ' + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <button
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        onClick={() => setShowModal(true)}
        disabled={busy}
      >
        Удалить
      </button>
      <ConfirmModal
        isOpen={showModal}
        title="Удалить объявление?"
        message={`«${title}» будет удалено безвозвратно и пропадёт с сайта у всех пользователей.`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={busy}
      />
    </>
  );
}

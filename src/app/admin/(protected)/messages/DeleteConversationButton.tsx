'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { deleteConversationAction } from '../actions';

export default function DeleteConversationButton({ id, label, compact = false }: { id: string; label: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteConversationAction(id);
      setShowModal(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={
          compact
            ? 'shrink-0 rounded-md px-1.5 py-0.5 text-xs text-mut transition hover:bg-red-50 hover:text-red-600'
            : 'rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50'
        }
        onClick={() => setShowModal(true)}
        title="Удалить переписку"
      >
        {compact ? '✕' : 'Удалить переписку'}
      </button>
      <ConfirmModal
        isOpen={showModal}
        title="Удалить переписку?"
        message={`Вся переписка «${label}» будет удалена безвозвратно, вместе со всеми сообщениями.`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={busy}
      />
    </>
  );
}

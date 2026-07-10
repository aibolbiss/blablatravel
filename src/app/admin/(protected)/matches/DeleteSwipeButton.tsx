'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { deleteSwipeAction } from '../actions';

export default function DeleteSwipeButton({ fromUserId, toUserId, label }: { fromUserId: string; toUserId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteSwipeAction(fromUserId, toUserId);
      setShowModal(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-mut transition hover:bg-red-50 hover:text-red-600"
        onClick={() => setShowModal(true)}
        title="Удалить свайп"
      >
        ✕
      </button>
      <ConfirmModal
        isOpen={showModal}
        title="Удалить свайп?"
        message={`Оценка «${label}» будет удалена — этот человек снова сможет увидеть и свайпнуть собеседника заново.`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={busy}
      />
    </>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { deleteMatchAction } from '../actions';

export default function DeleteMatchButton({ userIdA, userIdB, label }: { userIdA: string; userIdB: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteMatchAction(userIdA, userIdB);
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
        title="Удалить взаимность"
      >
        ✕
      </button>
      <ConfirmModal
        isOpen={showModal}
        title="Удалить взаимность?"
        message={`Совпадение «${label}» будет сброшено — оба лайка удалятся, и эти пользователи снова смогут свайпнуть друг друга в разделе «Любовь».`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={busy}
      />
    </>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { deleteUserAction } from './actions';

export default function AdminDeleteUserButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteUserAction(id);
      setShowModal(false);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Не удалось удалить пользователя');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
        onClick={() => setShowModal(true)}
      >
        Удалить
      </button>
      <ConfirmModal
        isOpen={showModal}
        title="Удалить пользователя?"
        message={`Аккаунт «${name}» будет удалён безвозвратно — вместе с профилем, объявлениями, избранным и перепиской. Отменить нельзя.${error ? `\n\nОшибка: ${error}` : ''}`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => { setShowModal(false); setError(''); }}
        isLoading={busy}
      />
    </>
  );
}

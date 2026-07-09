'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMessageAction } from '../../actions';

export default function DeleteMessageButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm('Удалить это сообщение?')) return;
    setBusy(true);
    try {
      await deleteMessageAction(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-mut opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
      title="Удалить сообщение"
    >
      ✕
    </button>
  );
}

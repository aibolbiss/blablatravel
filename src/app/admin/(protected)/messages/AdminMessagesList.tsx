'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteConversationButton from './DeleteConversationButton';

export type MessagesRow = {
  user: { id: string; name: string; avatar_url: string | null; email: string };
  partners: {
    convId: string;
    other: { id: string; name: string; avatar_url: string | null; email: string };
    count: number;
    lastMessage: string;
    lastAt: string;
  }[];
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMessagesList({ rows }: { rows: MessagesRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.user.name, r.user.email,
        ...r.partners.map((p) => `${p.other.name} ${p.other.email} ${p.lastMessage} ${formatDateTime(p.lastAt)}`),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Поиск по имени, почте, сообщению, дате…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 space-y-3">
        {filtered.map((r) => (
          <div key={r.user.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
                {r.user.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.user.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <Link href={`/admin/users/${r.user.id}`} className="min-w-0 hover:text-route">
                <p className="font-semibold">{r.user.name}</p>
                <p className="truncate text-xs text-mut">{r.user.email}</p>
              </Link>
              <span className="ml-auto shrink-0 rounded-full bg-route-light px-2.5 py-1 text-xs font-semibold text-route">
                {r.partners.length} {r.partners.length === 1 ? 'собеседник' : 'собеседников'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.partners.map((p) => (
                <div
                  key={p.convId}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/messages/${p.convId}`}
                    className="flex min-w-0 items-center gap-2 hover:text-route"
                    title={p.lastMessage ? `${p.lastMessage} — ${formatDateTime(p.lastAt)}` : undefined}
                  >
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-route-light">
                      {p.other.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.other.avatar_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="min-w-0 truncate font-medium">{p.other.name}</span>
                    <span className="shrink-0 text-xs text-mut">({p.count})</span>
                  </Link>
                  <DeleteConversationButton id={p.convId} label={`${r.user.name} ↔ ${p.other.name}`} compact />
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-mut">
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}

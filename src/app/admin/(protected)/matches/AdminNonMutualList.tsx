'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteSwipeButton from './DeleteSwipeButton';

export type SwipeRow = {
  from: { id: string; name: string; avatar_url: string | null; email: string };
  to: { id: string; name: string; avatar_url: string | null; email: string };
  liked: boolean;
  createdAt: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminNonMutualList({ rows }: { rows: SwipeRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [r.from.name, r.from.email, r.to.name, r.to.email, formatDateTime(r.createdAt)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Поиск по имени, почте, дате…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 space-y-2">
        {filtered.map((r) => (
          <div key={`${r.from.id}:${r.to.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <Link href={`/admin/users/${r.from.id}`} className="flex min-w-0 items-center gap-2 hover:text-route">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-route-light">
                  {r.from.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.from.avatar_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.from.name}</p>
                  <p className="truncate text-xs text-mut">{r.from.email}</p>
                </div>
              </Link>

              <span className="shrink-0 text-lg">{r.liked ? '❤️' : '✕'}</span>

              <Link href={`/admin/users/${r.to.id}`} className="flex min-w-0 items-center gap-2 hover:text-route">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-route-light">
                  {r.to.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.to.avatar_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.to.name}</p>
                  <p className="truncate text-xs text-mut">{r.to.email}</p>
                </div>
              </Link>

              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${r.liked ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                {r.liked ? 'лайк' : 'дизлайк'}
              </span>
            </div>

            <span className="shrink-0 text-xs text-mut">{formatDateTime(r.createdAt)}</span>
            <DeleteSwipeButton fromUserId={r.from.id} toUserId={r.to.id} label={`${r.from.name} → ${r.to.name}`} />
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

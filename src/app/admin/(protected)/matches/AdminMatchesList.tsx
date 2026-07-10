'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteMatchButton from './DeleteMatchButton';

export type MatchPair = {
  a: { id: string; name: string; avatar_url: string | null; email: string };
  b: { id: string; name: string; avatar_url: string | null; email: string };
  matchedAt: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMatchesList({ pairs }: { pairs: MatchPair[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter((p) => {
      const haystack = [p.a.name, p.a.email, p.b.name, p.b.email, formatDateTime(p.matchedAt)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [pairs, query]);

  return (
    <div>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Поиск по имени, почте, дате…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 space-y-2">
        {filtered.map((pair) => (
          <div key={`${pair.a.id}:${pair.b.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <Link href={`/admin/users/${pair.a.id}`} className="flex min-w-0 items-center gap-2 hover:text-route">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
                  {pair.a.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pair.a.avatar_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{pair.a.name}</p>
                  <p className="truncate text-xs text-mut">{pair.a.email}</p>
                </div>
              </Link>

              <span className="shrink-0 text-lg">❤️</span>

              <Link href={`/admin/users/${pair.b.id}`} className="flex min-w-0 items-center gap-2 hover:text-route">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-route-light">
                  {pair.b.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pair.b.avatar_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{pair.b.name}</p>
                  <p className="truncate text-xs text-mut">{pair.b.email}</p>
                </div>
              </Link>
            </div>

            <span className="shrink-0 text-xs text-mut">{formatDateTime(pair.matchedAt)}</span>
            <DeleteMatchButton userIdA={pair.a.id} userIdB={pair.b.id} label={`${pair.a.name} ↔ ${pair.b.name}`} />
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

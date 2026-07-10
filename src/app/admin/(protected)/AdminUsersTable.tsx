'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GENDER_LABEL } from '@/lib/types';
import AdminDeleteUserButton from './AdminDeleteUserButton';

export type UserRow = {
  id: string;
  name: string;
  gender: string;
  city: string;
  country: string;
  avatar_url: string | null;
  created_at: string;
  email: string;
  count: { total: number; active: number };
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminUsersTable({ rows }: { rows: UserRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [r.name, r.email, r.city, r.country, formatDateTime(r.created_at)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Поиск по имени, почте, городу, дате…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg text-left text-xs uppercase text-mut">
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Пол</th>
              <th className="px-4 py-3 font-medium">Город</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
              <th className="px-4 py-3 text-right font-medium">Объявлений</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.id}`} className="flex items-center gap-2 hover:text-route">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-route-light">
                      {p.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="truncate text-xs text-mut">{p.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-mut">{GENDER_LABEL[p.gender] ?? '—'}</td>
                <td className="px-4 py-3 text-mut">{p.city ? `${p.city}, ${p.country}` : '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-mut">{formatDateTime(p.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold">{p.count.total}</span>
                  {p.count.total > 0 && p.count.active !== p.count.total && (
                    <span className="ml-1 text-xs text-mut">({p.count.active} активно)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteUserButton id={p.id} name={p.name} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mut">Ничего не найдено</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

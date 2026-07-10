'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import AdminDeleteButton from './AdminDeleteButton';

export type ListingRow = {
  id: string;
  title: string;
  city: string;
  to_city: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  authorName: string;
  authorEmail: string;
  authorRegisteredAt: string | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminListingsTable({ rows }: { rows: ListingRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((l) => {
      const haystack = [
        l.title, l.city, l.to_city, l.authorName, l.authorEmail,
        formatDateTime(l.created_at), l.authorRegisteredAt ? formatDateTime(l.authorRegisteredAt) : '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Поиск по названию, автору, маршруту, дате…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg text-left text-xs uppercase text-mut">
              <th className="px-4 py-3 font-medium">Объявление</th>
              <th className="px-4 py-3 font-medium">Автор</th>
              <th className="px-4 py-3 font-medium">Регистрация автора</th>
              <th className="px-4 py-3 font-medium">Маршрут</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Создано</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                <td className="max-w-xs truncate px-4 py-3 font-medium" title={l.title}>{l.title}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${l.user_id}`} className="hover:text-route">
                    <p className="text-mut">{l.authorName}</p>
                    <p className="truncate text-xs text-mut/70">{l.authorEmail}</p>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mut">
                  {l.authorRegisteredAt ? formatDateTime(l.authorRegisteredAt) : '—'}
                </td>
                <td className="px-4 py-3 text-mut">
                  {l.city}{l.to_city ? ` → ${l.to_city}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${l.is_active ? 'bg-route-light text-route' : 'bg-line text-mut'}`}>
                    {l.is_active ? 'Активно' : 'Скрыто'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mut">{formatDateTime(l.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton id={l.id} title={l.title} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mut">Ничего не найдено</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

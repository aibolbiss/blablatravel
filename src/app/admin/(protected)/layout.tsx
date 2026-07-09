import Link from 'next/link';
import AdminLogoutButton from '../AdminLogoutButton';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-night text-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Link href="/admin" className="font-display text-lg font-bold">Админка</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:text-route-light">Пользователи</Link>
            <Link href="/admin/listings" className="hover:text-route-light">Объявления</Link>
            <Link href="/admin/messages" className="hover:text-route-light">Переписки</Link>
            <Link href="/admin/settings" className="hover:text-route-light">Настройки</Link>
          </nav>
          <div className="ml-auto">
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}

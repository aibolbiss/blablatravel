'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileNav({ user }: { user?: { id: string } | null }) {
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Мобильная навигация внизу */}
      <nav className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-between gap-2 border-t border-line bg-white px-4 py-3 md:hidden">
        <Link href="/map" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title="Карта">
          🗺️
          <span className="text-xs text-mut">Карта</span>
        </Link>
        
        {user ? (
          <>
            <Link href="/chat" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title="Сообщения">
              💬
              <span className="text-xs text-mut">Чаты</span>
            </Link>
            <Link href="/favorites" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title="Избранное">
              ⭐
              <span className="text-xs text-mut">Избранное</span>
            </Link>
            <Link href="/cabinet" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title="Профиль">
              👤
              <span className="text-xs text-mut">Профиль</span>
            </Link>
          </>
        ) : (
          <div className="relative flex flex-1">
            <button
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              className="flex w-full flex-col items-center gap-1 py-1 text-xl hover:opacity-70"
            >
              👤
              <span className="text-xs text-mut">Вход</span>
            </button>
            
            {showAuthMenu && (
              <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2 rounded-lg border border-line bg-white p-2 shadow-lg">
                <Link href="/auth/login" className="whitespace-nowrap px-3 py-2 text-sm hover:bg-route-light rounded" onClick={() => setShowAuthMenu(false)}>
                  Войти
                </Link>
                <Link href="/auth/register" className="whitespace-nowrap px-3 py-2 text-sm hover:bg-route-light rounded" onClick={() => setShowAuthMenu(false)}>
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Отступ снизу для мобильных */}
      <div className="h-16 md:hidden" />
    </>
  );
}

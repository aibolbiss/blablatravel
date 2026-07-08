'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from './LogoutButton';
import MobileNav from './MobileNav';

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const user = userId ? { id: userId } : null;

  return (
    <>
      <header className="sticky top-0 z-[1000] border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          {/* Логотип */}
          <Link href="/" className="font-display text-xl font-bold text-black">
            BlaBlaTravel
          </Link>

          {/* Десктопная навигация */}
          <div className="hidden md:ml-auto md:flex items-center gap-3">
            <Link href="/map" className="text-lg hover:opacity-70" title="Карта">🗺️</Link>
            {user && (
              <>
                <Link href="/chat" className="text-lg hover:opacity-70" title="Сообщения">💬</Link>
                <Link href="/favorites" className="text-lg hover:opacity-70" title="Избранное">⭐</Link>
              </>
            )}
            {user ? (
              <>
                <Link href="/cabinet" className="btn-ghost">Профиль</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">Войти</Link>
                <Link href="/auth/register" className="btn-primary">Регистрация</Link>
              </>
            )}
          </div>

          {/* Кнопка выхода на мобильной версии */}
          {user && (
            <div className="md:hidden">
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      {/* Мобильная навигация внизу */}
      <MobileNav user={user} />
    </>
  );
}

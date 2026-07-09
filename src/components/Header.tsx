'use client';

import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from './LogoutButton';
import MobileNav from './MobileNav';
import LocaleSwitcher from './LocaleSwitcher';
import UnreadChatBadge from './UnreadChatBadge';

export default function Header() {
  const t = useTranslations('nav');
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
            <Link href="/map" className="text-lg hover:opacity-70" title={t('map')}>🗺️</Link>
            {user && (
              <>
                <Link href="/chat" className="relative text-lg hover:opacity-70" title={t('messages')}>
                  💬
                  <UnreadChatBadge userId={user.id} />
                </Link>
                <Link href="/favorites" className="text-lg hover:opacity-70" title={t('favorites')}>⭐</Link>
              </>
            )}
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
            {user ? (
              <>
                <Link href="/cabinet" className="btn-ghost">{t('profile')}</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">{t('login')}</Link>
                <Link href="/auth/register" className="btn-primary">{t('register')}</Link>
              </>
            )}
          </div>

          {/* Переключатель языка и выход на мобильной версии */}
          <div className="flex items-center gap-1 md:hidden">
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
            {user && <LogoutButton />}
          </div>
        </div>
      </header>

      {/* Мобильная навигация внизу */}
      <MobileNav user={user} />
    </>
  );
}

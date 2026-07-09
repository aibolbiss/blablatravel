'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import UnreadChatBadge from './UnreadChatBadge';

export default function MobileNav({ user }: { user?: { id: string } | null }) {
  const t = useTranslations('nav');
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  return (
    <>
      {/* Мобильная навигация внизу */}
      <nav className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3 md:hidden">
        <Link href="/map" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title={t('map')}>
          🗺️
          <span className="text-xs text-mut">{t('map')}</span>
        </Link>

        {user ? (
          <>
            <Link href="/chat" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title={t('messages')}>
              <span className="relative">
                💬
                <UnreadChatBadge userId={user.id} />
              </span>
              <span className="text-xs text-mut">{t('chats')}</span>
            </Link>
            <Link href="/favorites" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title={t('favorites')}>
              ⭐
              <span className="text-xs text-mut">{t('favorites')}</span>
            </Link>
            <Link href="/cabinet" className="flex flex-1 flex-col items-center gap-1 py-1 text-xl hover:opacity-70" title={t('profile')}>
              👤
              <span className="text-xs text-mut">{t('profile')}</span>
            </Link>
          </>
        ) : (
          <div className="relative flex flex-1">
            <button
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              className="flex w-full flex-col items-center gap-1 py-1 text-xl hover:opacity-70"
            >
              👤
              <span className="text-xs text-mut">{t('mobileLogin')}</span>
            </button>

            {showAuthMenu && (
              <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2 rounded-lg border border-line bg-surface p-2 shadow-lg">
                <Link href="/auth/login" className="whitespace-nowrap px-3 py-2 text-sm hover:bg-route-light rounded" onClick={() => setShowAuthMenu(false)}>
                  {t('login')}
                </Link>
                <Link href="/auth/register" className="whitespace-nowrap px-3 py-2 text-sm hover:bg-route-light rounded" onClick={() => setShowAuthMenu(false)}>
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Отступ снизу для мобильных */}
      {/* <div className="h-16 md:hidden" /> */}
    </>
  );
}

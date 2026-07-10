'use client';
import { useTranslations } from 'next-intl';

export default function LoadingSpinner() {
  const t = useTranslations('common');
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-route-light border-t-route" />
        <p className="text-sm font-medium text-white drop-shadow">{t('loading')}</p>
      </div>
    </div>
  );
}

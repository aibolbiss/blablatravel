'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { routing, localeLabels, type AppLocale } from '@/i18n/routing';

export default function LocaleSwitcher() {
  const t = useTranslations('localeSwitcher');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  function switchTo(next: AppLocale) {
    setOpen(false);
    const query = searchParams.toString();
    router.replace(pathname + (query ? `?${query}` : ''), { locale: next });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('label')}
        title={t('label')}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-lg hover:bg-route-light hover:opacity-100 opacity-80"
      >
        <Globe size={20} className="text-route" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1001] mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-route-light ${
                l === locale ? 'font-semibold text-route' : 'text-ink'
              }`}
            >
              <span>{localeLabels[l].flag}</span>
              <span>{localeLabels[l].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

export default function RouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const currentKey = `${pathname}?${searchParams.toString()}`;
  const prevKey = useRef(currentKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const showLoading = () => {
      setLoading(true);
      clearTimeout(timeoutRef.current);
      // Страховка на случай, если навигация не привела к смене URL
      // (например, повторный клик по текущей странице).
      timeoutRef.current = setTimeout(() => setLoading(false), 8000);
    };

    // Ловим клики по обычным ссылкам/<Link> напрямую через DOM — это
    // единственный надёжный способ поймать старт навигации сразу в момент
    // клика, не завязываясь на внутренние детали роутера Next.js.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const nextKey = `${url.pathname}${url.search}`;
      const currentKeyNow = `${window.location.pathname}${window.location.search}`;
      if (nextKey === currentKeyNow) return;
      showLoading();
    };

    // Явный триггер для кнопок, которые не являются ссылками, а вызывают
    // router.push()/replace() из кода (см. lib/navLoading.ts).
    const onNavStart = () => showLoading();

    document.addEventListener('click', onClick, true);
    window.addEventListener('nav-start', onNavStart);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('nav-start', onNavStart);
    };
  }, []);

  useEffect(() => {
    if (prevKey.current !== currentKey) {
      prevKey.current = currentKey;
      setLoading(false);
      clearTimeout(timeoutRef.current);
    }
  }, [currentKey]);

  return loading ? <LoadingSpinner /> : null;
}

'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { THEME_STORAGE_KEY } from '@/lib/theme';

// Переключатель темы в стиле iOS — ползунок, скользящий между солнцем и
// луной. Слушать системную тему при переключении вручную больше не нужно —
// выбор сохраняется в localStorage и берёт верх при следующих заходах.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — переключение
      // всё равно сработает в рамках текущей сессии
    }
  }

  // До гидратации не знаем реальное состояние — резервируем место, чтобы
  // не было скачка разметки
  if (!mounted) return <div className="h-7 w-12 shrink-0" aria-hidden />;

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label="Тёмная тема"
      title="Тёмная тема"
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
        isDark ? 'bg-route' : 'bg-line'
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {isDark ? <Moon size={12} className="text-route" /> : <Sun size={12} className="text-amber-way" />}
      </span>
    </button>
  );
}

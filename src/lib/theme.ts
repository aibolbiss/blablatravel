export const THEME_STORAGE_KEY = 'poputchik-theme';

// Выполняется как блокирующий инлайн-скрипт до гидратации (см.
// [locale]/layout.tsx) — чтобы страница не мигала светлой темой на долю
// секунды перед переключением на тёмную.
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

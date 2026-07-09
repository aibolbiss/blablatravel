// Явный триггер для кнопок, которые вызывают router.push()/replace() из кода
// (не через клик по <a>) — например, кнопки в SearchFilters. Клики по обычным
// ссылкам/<Link> ловятся автоматически в RouteLoadingOverlay без этого вызова.
export function startNavLoading() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('nav-start'));
}

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ru', 'en', 'es', 'de', 'pt', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
  // Public pages emit their own canonical/hreflang metadata.
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];

export const localeLabels: Record<AppLocale, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Português', flag: '🇵🇹' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

import type { Metadata } from 'next';
import { routing, type AppLocale } from '@/i18n/routing';

export const SITE_URL = 'https://blablatravel.com';

export function languageAlternates(path = ''): Record<string, string> {
  return Object.fromEntries([
    ...routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
    ['x-default', `${SITE_URL}/en${path}`],
  ]);
}

export function pageMetadata(locale: string, path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  const ogLocales: Record<AppLocale, string> = {
    ru: 'ru_RU', en: 'en_US', es: 'es_ES', de: 'de_DE', pt: 'pt_PT', fr: 'fr_FR',
  };
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website', siteName: 'BlaBlaTravel', url, title, description,
      locale: ogLocales[locale as AppLocale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    },
    twitter: { card: 'summary', title, description },
  };
}

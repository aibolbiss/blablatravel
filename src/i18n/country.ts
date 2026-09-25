import type { AppLocale } from './routing';

// Countries with a clear match among the available translations. For multilingual
// countries (e.g. Canada, Switzerland, Belgium), prefer the browser language.
const countries: Partial<Record<AppLocale, readonly string[]>> = {
  ru: ['RU', 'BY', 'KZ', 'KG'],
  en: ['US', 'GB', 'AU', 'NZ', 'IE'],
  de: ['DE', 'AT', 'LI'],
  fr: ['FR', 'MC'],
  pt: ['PT', 'BR', 'AO', 'MZ', 'CV', 'GW', 'ST'],
  es: ['ES', 'MX', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'NI', 'PA', 'PE', 'PY', 'SV', 'UY', 'VE'],
};

export function localeForCountry(country: string | null): AppLocale | undefined {
  const code = country?.trim().toUpperCase();
  return (Object.keys(countries) as AppLocale[]).find((locale) =>
    code ? countries[locale]?.includes(code) : false
  );
}

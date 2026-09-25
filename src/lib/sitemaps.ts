import { routing } from '@/i18n/routing';
import { SITE_URL, languageAlternates } from '@/lib/seo';

export const LISTINGS_PER_SITEMAP = 500;

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[char]!);
}

export function sitemapXml(paths: string[]): string {
  const entries = paths.flatMap((path) => {
    const alternates = Object.entries(languageAlternates(path)).map(([lang, href]) =>
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}"/>`
    ).join('');
    return routing.locales.map((locale) =>
      `<url><loc>${escapeXml(`${SITE_URL}/${locale}${path}`)}</loc>${alternates}</url>`
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

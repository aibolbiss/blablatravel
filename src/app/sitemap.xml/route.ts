import { createPublicClient } from '@/lib/supabase/public';
import { SITE_URL } from '@/lib/seo';
import { LISTINGS_PER_SITEMAP, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 3600;

export async function GET() {
  const { count, error } = await createPublicClient(3600)
    .from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true);
  // Never publish an incomplete index as a successful response on a database outage.
  if (error || count === null) return new Response('Sitemap temporarily unavailable', { status: 503 });
  const urls = [
    `${SITE_URL}/sitemaps/pages.xml`,
    ...Array.from({ length: Math.ceil(count / LISTINGS_PER_SITEMAP) }, (_, page) =>
      `${SITE_URL}/sitemaps/listings/${page}.xml`),
  ];
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${url}</loc></sitemap>`).join('')}</sitemapindex>`);
}

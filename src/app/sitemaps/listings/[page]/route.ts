import { createPublicClient } from '@/lib/supabase/public';
import { LISTINGS_PER_SITEMAP, sitemapXml, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: { page: string } }) {
  if (!/^(0|[1-9]\d*)\.xml$/.test(params.page)) return new Response('Not found', { status: 404 });
  const page = Number(params.page.slice(0, -4));
  const start = page * LISTINGS_PER_SITEMAP;
  if (!Number.isSafeInteger(start + LISTINGS_PER_SITEMAP)) return new Response('Not found', { status: 404 });
  const { data, error } = await createPublicClient(3600)
    .from('listings').select('id').eq('is_active', true).order('id')
    .range(start, start + LISTINGS_PER_SITEMAP - 1);
  if (error) return new Response('Sitemap temporarily unavailable', { status: 503 });
  if (!data?.length) return new Response('Not found', { status: 404 });
  return xmlResponse(sitemapXml(data.map(({ id }) => `/listing/${encodeURIComponent(id)}`)));
}

// Run against a local production server: node scripts/check-seo.mjs http://localhost:3100
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:3100';
const cases = [
  ['Germany', '/', { 'x-vercel-ip-country': 'DE', 'accept-language': 'en' }, '/de'],
  ['Kazakhstan', '/', { 'x-vercel-ip-country': 'KZ' }, '/ru'],
  ['Brazil', '/', { 'x-vercel-ip-country': 'BR' }, '/pt'],
  ['France', '/', { 'x-vercel-ip-country': 'FR' }, '/fr'],
  ['Mexico', '/', { 'x-vercel-ip-country': 'MX' }, '/es'],
  ['Saved preference', '/', { cookie: 'NEXT_LOCALE=fr', 'x-vercel-ip-country': 'DE' }, '/fr'],
  ['Invalid cookie', '/', { cookie: 'NEXT_LOCALE=oops', 'x-vercel-ip-country': 'DE' }, '/de'],
  ['Multilingual country', '/', { 'x-vercel-ip-country': 'CA', 'accept-language': 'fr-CA,en;q=0.8' }, '/fr'],
  ['Browser fallback', '/', { 'accept-language': 'pt-BR' }, '/pt'],
  ['Default fallback', '/', { 'accept-language': '*' }, '/en'],
  ['Query preservation', '/map?city=Paris', { 'x-vercel-ip-country': 'DE' }, '/de/map?city=Paris'],
  ['Explicit locale', '/ru', { 'x-vercel-ip-country': 'DE', cookie: 'NEXT_LOCALE=en' }, null],
  ['Explicit map locale', '/es/map', { 'x-vercel-ip-country': 'DE' }, null],
];

for (const [label, path, headers, expected] of cases) {
  const response = await fetch(base + path, { headers, redirect: 'manual' });
  if (expected) {
    assert.equal(response.status, 307, label);
    const target = new URL(response.headers.get('location'), base);
    assert.equal(target.pathname + target.search, expected, label);
    assert.match(response.headers.get('cache-control'), /no-store/, label);
  } else {
    assert.equal(response.status, 200, label);
    assert.equal(response.headers.get('location'), null, label);
  }
}

for (const locale of ['ru', 'en', 'es', 'de', 'pt', 'fr']) {
  for (const path of ['', '/map']) {
    const response = await fetch(`${base}/${locale}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`lang="${locale}"`));
    assert.ok(html.includes(`rel="canonical" href="https://blablatravel.com/${locale}${path}"`));
    for (const alternate of ['ru', 'en', 'es', 'de', 'pt', 'fr', 'x-default']) {
      assert.ok(html.toLowerCase().includes(`hreflang="${alternate}"`), alternate);
    }
    assert.ok(html.includes('property="og:title"'));
    assert.ok(html.includes('name="description"'));
    if (path === '') {
      const messages = JSON.parse(await readFile(new URL(`../src/messages/${locale}.json`, import.meta.url), 'utf8'));
      assert.ok(html.includes(messages.home.titleLine1), `Search heading: ${locale}`);
      assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
      assert.equal((html.match(/<details[\s>]/g) || []).length, 4);
      const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(structuredData, `Structured data: ${locale}`);
      assert.equal(JSON.parse(structuredData[1])['@type'], 'WebSite');
      for (const language of ['ru', 'en', 'es', 'de', 'pt', 'fr']) {
        assert.ok(html.toLowerCase().includes(`hreflang="${language}" lang="${language}"`), `Language link: ${language}`);
      }
    }
  }
}

for (const path of ['/robots.txt', '/sitemap.xml', '/sitemaps/pages.xml']) {
  const response = await fetch(base + path, { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('location'), null, path);
  const body = await response.text();
  assert.ok(body.includes('https://blablatravel.com/'), path);
  if (path === '/sitemaps/pages.xml') assert.equal((body.match(/<loc>/g) || []).length, 12);
  if (path === '/sitemap.xml') {
    assert.ok(body.includes('<sitemapindex'));
    const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.ok(locations.includes('https://blablatravel.com/sitemaps/pages.xml'));
    const seen = new Set();
    for (const location of locations.filter((url) => url.includes('/listings/'))) {
      const sitemap = await fetch(base + new URL(location).pathname, { redirect: 'manual' });
      assert.equal(sitemap.status, 200);
      const xml = await sitemap.text();
      const entries = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
      assert.ok(entries.length > 0 && entries.length <= 3000);
      assert.equal(entries.length % 6, 0);
      assert.equal((xml.match(/hreflang="x-default"/g) || []).length, entries.length);
      for (const entry of entries) {
        assert.ok(!seen.has(entry), `Duplicate sitemap entry: ${entry}`);
        seen.add(entry);
        assert.match(entry, /^https:\/\/blablatravel\.com\/(ru|en|es|de|pt|fr)\/listing\//);
      }
    }
    console.log(`Listing sitemap checked: ${seen.size} localized URLs.`);
  }
}
const invalidSitemap = await fetch(base + '/sitemaps/listings/invalid.xml');
assert.equal(invalidSitemap.status, 404);
console.log('Passed: 13 language scenarios, metadata on 12 public pages, 6 localized headings/FAQs, structured data, language links and sitemaps.');

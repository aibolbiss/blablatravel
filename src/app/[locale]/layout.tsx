import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Unbounded, Onest } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { themeInitScript } from '@/lib/theme';
import Header from '@/components/Header';
import RouteLoadingOverlay from '@/components/RouteLoadingOverlay';
import '../globals.css';

const display = Unbounded({ subsets: ['cyrillic', 'latin'], weight: ['500', '700'], variable: '--font-display' });
const body = Onest({ subsets: ['cyrillic', 'latin'], variable: '--font-body' });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('title'), description: t('description') };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        <NextIntlClientProvider>
          <Suspense>
            <RouteLoadingOverlay />
          </Suspense>
          <Header />
          <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

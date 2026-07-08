import type { Metadata } from 'next';
import { Unbounded, Onest } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const display = Unbounded({ subsets: ['cyrillic', 'latin'], weight: ['500', '700'], variable: '--font-display' });
const body = Onest({ subsets: ['cyrillic', 'latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Попутчик — найди компаньона для путешествия',
  description: 'Сервис поиска попутчиков: объявления, карта, чат.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16">{children}</main>
      </body>
    </html>
  );
}

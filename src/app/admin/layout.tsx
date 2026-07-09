import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import '../globals.css';

const body = Onest({ subsets: ['cyrillic', 'latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Админка — Попутчик',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={body.variable}>
      <body className="bg-bg text-ink font-body antialiased">{children}</body>
    </html>
  );
}

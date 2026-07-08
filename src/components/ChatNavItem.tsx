'use client';

import Link from 'next/link';

export default function ChatNavItem({ userId }: { userId: string }) {
  return (
    <Link href="/chat" className="hover:text-ink text-sm font-medium text-mut">
      Сообщения
    </Link>
  );
}

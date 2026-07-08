'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatBadge from './ChatBadge';

export default function ChatBadgeWrapper({ userId }: { userId: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Не рендерим на /chat/[id] даже при гидрации
  if (!mounted || (pathname.startsWith('/chat/') && pathname !== '/chat')) {
    return null;
  }

  return <ChatBadge userId={userId} />;
}

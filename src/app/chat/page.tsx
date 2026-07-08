import { getUserId } from '@/lib/auth';
import { getConversations } from '@/lib/chat';
import ChatSidebar from '@/components/ChatSidebar';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ChatIndexPage({ searchParams }: { searchParams: { page?: string } }) {
  const userId = getUserId()!;

  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const { previews: conversations, count } = await getConversations(userId, offset, pageSize);
  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 py-6 flex-col">
      <div className="flex flex-1 gap-4 overflow-hidden">
        <ChatSidebar conversations={conversations} userId={userId} />
        <div className="hidden flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-white sm:flex">
          <div className="text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-2 font-semibold">Выберите диалог</p>
            <p className="mt-1 text-sm text-mut">или напишите кому-нибудь со страницы объявления</p>
          </div>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={`/chat?page=${page - 1}`} className="btn-ghost">← Назад</Link>}
          <span className="flex items-center px-4 py-2 text-sm">Страница {page} из {totalPages}</span>
          {page < totalPages && <Link href={`/chat?page=${page + 1}`} className="btn-primary">Вперед →</Link>}
        </div>
      )}
    </div>
  );
}

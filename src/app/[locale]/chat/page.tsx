import { getUserId } from '@/lib/auth';
import { getConversations } from '@/lib/chat';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ChatSidebar from '@/components/ChatSidebar';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export default async function ChatIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations('chat');
  const tCommon = await getTranslations('common');
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
        <div className="hidden flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-surface sm:flex">
          <div className="text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-2 font-semibold">{t('chooseConversation')}</p>
            <p className="mt-1 text-sm text-mut">{t('chooseConversationHint')}</p>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={`/chat?page=${page - 1}`} className="btn-ghost">{tCommon('back')}</Link>}
          <span className="flex items-center px-4 py-2 text-sm">{tCommon('pageOf', { page, total: totalPages })}</span>
          {page < totalPages && <Link href={`/chat?page=${page + 1}`} className="btn-primary">{tCommon('forward')}</Link>}
        </div>
      )}
    </div>
  );
}

'use client';
import { useTranslations } from 'next-intl';
import { parseListingTitle } from '@/lib/parseListingTitle';
import { companionEmojis } from '@/lib/travel-data';

// Восстанавливает "кто кого ищет" из хранимого заголовка и рендерит фразу
// на текущем языке интерфейса, а не на языке, на котором объявление было
// создано (title в БД всегда собирается по одному эмодзи-шаблону).
export default function ListingTitle({ title }: { title: string }) {
  const t = useTranslations('listing');
  const tTypes = useTranslations('travelTypes');
  const { myType, searchType, tourismType } = parseListingTitle(title);

  if (!myType && !searchType) return <>{title}</>;

  const myEmoji = myType ? companionEmojis[myType] : '';
  const whomEmoji = searchType ? companionEmojis[searchType] : '';

  return (
    <>
      {t('titleTemplate', { my: myEmoji, whom: whomEmoji })}
      {tourismType && ` → ${tTypes(`tourism.${tourismType}`)}`}
    </>
  );
}

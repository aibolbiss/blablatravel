'use client';
import { useTranslations } from 'next-intl';
import { parseListingTitle } from '@/lib/parseListingTitle';
import { companionEmojis, tourismEmojis } from '@/lib/travel-data';

// Восстанавливает "кто кого ищет" из хранимого заголовка и рендерит фразу
// на текущем языке интерфейса, а не на языке, на котором объявление было
// создано (title в БД всегда собирается по одному эмодзи-шаблону).
export default function ListingTitle({ title, stackTourism = false }: { title: string; stackTourism?: boolean }) {
  const t = useTranslations('listing');
  const tTypes = useTranslations('travelTypes');
  const { myType, searchType, tourismType } = parseListingTitle(title);

  if (!myType && !searchType) return <>{title}</>;

  const myEmoji = myType ? companionEmojis[myType] : '';
  const whomEmoji = searchType ? companionEmojis[searchType] : '';
  const mainPhrase = t('titleTemplate', { my: myEmoji, whom: whomEmoji });

  if (!tourismType) return <>{mainPhrase}</>;

  const tourismPhrase = `${tourismEmojis[tourismType]} ${tTypes(`tourism.${tourismType}`)}`;

  if (!stackTourism) {
    return <>{mainPhrase} → {tourismPhrase}</>;
  }

  // На мобильном тип отдыха уходит под основную фразу без стрелки,
  // на md+ остаётся исходная строка "фраза → тип отдыха".
  return (
    <span className="flex flex-col md:flex-row md:items-baseline md:gap-1">
      <span>{mainPhrase}</span>
      <span><span className="hidden md:inline">→ </span>{tourismPhrase}</span>
    </span>
  );
}

import { companionEmojis, tourismEmojis, type CompanionType, type TourismType } from './travel-data';

// Заголовок объявления хранится в БД в виде эмодзи-формата (например
// "Я 👨 ищу 👩 → 🌴 Экзотический") независимо от языка интерфейса — эмодзи
// не переводятся, поэтому на них можно опираться, чтобы восстановить, кто
// кого ищет, и показать это на карточке уже на языке текущего пользователя.
export function parseListingTitle(title: string): {
  myType: CompanionType | null;
  searchType: CompanionType | null;
  tourismType: TourismType | null;
} {
  const searchIndex = title.indexOf('ищу');
  const beforeSearch = searchIndex >= 0 ? title.slice(0, searchIndex) : '';
  const afterSearch = searchIndex >= 0 ? title.slice(searchIndex + 'ищу'.length) : title;

  const myEntry = (Object.entries(companionEmojis) as [CompanionType, string][])
    .find(([, emoji]) => beforeSearch.includes(emoji));
  const searchEntry = (Object.entries(companionEmojis) as [CompanionType, string][])
    .find(([, emoji]) => afterSearch.includes(emoji));
  const tourismEntry = (Object.entries(tourismEmojis) as [TourismType, string][])
    .find(([, emoji]) => title.includes(emoji));

  return {
    myType: myEntry?.[0] ?? null,
    searchType: searchEntry?.[0] ?? null,
    tourismType: tourismEntry?.[0] ?? null,
  };
}

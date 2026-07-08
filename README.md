# Попутчик — сервис поиска попутчиков

Next.js 14 (App Router) + Supabase (Auth, Postgres, Storage, Realtime) + Leaflet.

## Возможности

- Лента объявлений на главной: фото, имя, маршрут «откуда → куда», бюджет, даты
- Страница объявления с профилем автора
- Поиск и фильтры: текст, страна, город, пол, бюджет
- Карта попутчиков (OpenStreetMap): показываются те, кто разрешил отображение локации
- Регистрация / вход (email + пароль, Supabase Auth)
- Личный кабинет: профиль «как в Facebook» (фото, био, город, пол), мои объявления
- Создание объявления с загрузкой фото и отметкой на карте
- Избранное
- Чат в стиле Discord (реалтайм через Supabase Realtime) с настройкой «разрешить писать мне»
- Row Level Security на всех таблицах

## Установка

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Откройте **SQL Editor** и выполните целиком файл `supabase/schema.sql`
   (создаст таблицы, RLS-политики, триггеры, bucket `photos` и включит Realtime для чата)
3. В **Authentication → Providers → Email** можно отключить «Confirm email»,
   чтобы вход работал сразу после регистрации (для разработки)

### 2. Переменные окружения

```bash
cp .env.local.example .env.local
```

Заполните из **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000

## Структура

```
supabase/schema.sql        — вся база: таблицы, RLS, триггеры, storage, realtime
src/middleware.ts          — сессии + защита /cabinet, /favorites, /chat
src/lib/supabase/          — клиенты Supabase (browser / server)
src/app/page.tsx           — главная: лента + фильтры
src/app/listing/[id]/      — страница объявления
src/app/map/               — карта попутчиков
src/app/auth/              — вход / регистрация
src/app/cabinet/           — кабинет: профиль, мои объявления, создание
src/app/favorites/         — избранное
src/app/chat/              — чат (сайдбар как в Discord + реалтайм)
src/components/            — UI-компоненты
```

## Как работает бэкенд

Бэкенд — это Supabase: Postgres с RLS-политиками заменяет собственный API-сервер.

- **Безопасность:** каждая таблица закрыта политиками — редактировать можно только своё,
  чужие сообщения не прочитать, диалог нельзя создать с тем, кто закрыл ЛС
  (проверяется в RPC-функции `get_or_create_conversation`).
- **Чат в реальном времени:** подписка `postgres_changes` на таблицу `messages`.
- **Фото:** bucket `photos`, файлы кладутся в папку `{user_id}/...`,
  загрузка разрешена только в свою папку.

## Деплой

Проще всего — Vercel: подключите репозиторий, добавьте те же две переменные окружения.
В Supabase → Authentication → URL Configuration укажите домен продакшена.

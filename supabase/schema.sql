-- ============================================================
-- ПОПУТЧИК — схема базы данных Supabase
-- Выполните этот файл целиком в Supabase → SQL Editor
-- ============================================================

-- ---------- ПРОФИЛИ ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Путешественник',
  gender text check (gender in ('male','female','other')) default 'other',
  country text default '',
  city text default '',
  bio text default '',
  avatar_url text,
  allow_messages boolean not null default true,
  show_on_map boolean not null default false,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Путешественник'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ОБЪЯВЛЕНИЯ ----------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  country text not null,
  city text not null,
  to_country text default '',
  to_city text default '',
  companion_type text,          -- тип путешественника (male, female, male_group, и т.д.)
  tourism_type text,             -- тип туризма (exotic, resort, historical, и т.д.)
  budget integer,               -- бюджет в USD
  date_from date,
  date_to date,
  photo_url text,
  lat double precision,
  lng double precision,
  show_on_map boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists listings_country_idx on public.listings (country);
create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_created_idx on public.listings (created_at desc);

-- ---------- ИЗБРАННОЕ ----------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- ЧАТ ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

-- RPC: найти или создать диалог (проверяет разрешение на сообщения)
create or replace function public.get_or_create_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid; b uuid; conv uuid; allowed boolean;
begin
  if me is null then raise exception 'Не авторизован'; end if;
  if me = other_user then raise exception 'Нельзя написать самому себе'; end if;

  select allow_messages into allowed from public.profiles where id = other_user;
  if allowed is distinct from true then
    raise exception 'Пользователь закрыл личные сообщения';
  end if;

  a := least(me, other_user);
  b := greatest(me, other_user);

  select id into conv from public.conversations where user_a = a and user_b = b;
  if conv is null then
    insert into public.conversations (user_a, user_b) values (a, b) returning id into conv;
  end if;
  return conv;
end $$;

-- RPC: создать объявление со всеми полями
create or replace function public.create_listing(
  p_title text,
  p_description text,
  p_country text,
  p_city text,
  p_to_country text,
  p_to_city text,
  p_companion_type text,
  p_tourism_type text,
  p_budget integer,
  p_date_from date,
  p_date_to date,
  p_photo_url text,
  p_show_on_map boolean,
  p_lat double precision,
  p_lng double precision
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  listing_id uuid;
begin
  insert into public.listings (
    user_id, title, description, country, city, to_country, to_city,
    companion_type, tourism_type, budget, date_from, date_to, photo_url,
    show_on_map, lat, lng
  ) values (
    auth.uid(), p_title, p_description, p_country, p_city, p_to_country, p_to_city,
    p_companion_type, p_tourism_type, p_budget, p_date_from, p_date_to, p_photo_url,
    p_show_on_map, p_lat, p_lng
  ) returning id into listing_id;
  return listing_id;
end $$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Профили: читать могут все, менять — только свой
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Объявления: активные видят все, свои — всегда; CRUD только своих
drop policy if exists "listings_select" on public.listings;
drop policy if exists "listings_insert" on public.listings;
drop policy if exists "listings_update" on public.listings;
drop policy if exists "listings_delete" on public.listings;
create policy "listings_select" on public.listings for select
  using (is_active or auth.uid() = user_id);
create policy "listings_insert" on public.listings for insert with check (auth.uid() = user_id);
create policy "listings_update" on public.listings for update using (auth.uid() = user_id);
create policy "listings_delete" on public.listings for delete using (auth.uid() = user_id);

-- Избранное: только своё
drop policy if exists "favorites_select" on public.favorites;
drop policy if exists "favorites_insert" on public.favorites;
drop policy if exists "favorites_delete" on public.favorites;
create policy "favorites_select" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete using (auth.uid() = user_id);

-- Диалоги/сообщения: только участники
drop policy if exists "conversations_select" on public.conversations;
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
create policy "conversations_select" on public.conversations for select
  using (auth.uid() in (user_a, user_b));
create policy "messages_select" on public.messages for select
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "messages_insert" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
  );

-- ---------- REALTIME для чата ----------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then
  null;
end $$;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_read" on storage.objects;
drop policy if exists "photos_upload" on storage.objects;
drop policy if exists "photos_delete" on storage.objects;
create policy "photos_read" on storage.objects for select using (bucket_id = 'photos');
create policy "photos_upload" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated'
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_delete" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

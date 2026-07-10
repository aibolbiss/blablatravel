-- ============================================================
-- ПОПУТЧИК — фича "Любовь": свайпы объявлений и взаимные матчи
-- Выполните в Supabase → SQL Editor
-- ============================================================
-- Совпадение — по человеку, а не по конкретному объявлению: если A свайпнул
-- вправо ЛЮБОЕ объявление B, и B свайпнул вправо ЛЮБОЕ объявление A —
-- это взаимно. listing_id хранится только для контекста (какое объявление
-- показывалось в момент свайпа), в логике матчинга не участвует.

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);
create index if not exists swipes_to_user_idx on public.swipes (to_user_id);

alter table public.swipes enable row level security;

-- Видеть можно только свою историю свайпов (кого я уже оценил) — иначе
-- было бы видно, кто лайкнул тебя, до того как ты лайкнул его в ответ.
drop policy if exists "swipes_select_own" on public.swipes;
create policy "swipes_select_own" on public.swipes for select using (from_user_id = auth.uid());
-- INSERT/UPDATE намеренно без политик — запись только через record_swipe()
-- ниже (security definer), напрямую через таблицу вставить нельзя.

-- RPC: записать свайп и вернуть, образовался ли взаимный матч
create or replace function public.record_swipe(p_to_user_id uuid, p_listing_id uuid, p_liked boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  matched boolean;
begin
  if me is null then raise exception 'Не авторизован'; end if;
  if me = p_to_user_id then raise exception 'Нельзя свайпнуть самого себя'; end if;

  insert into public.swipes (from_user_id, to_user_id, listing_id, liked)
  values (me, p_to_user_id, p_listing_id, p_liked)
  on conflict (from_user_id, to_user_id)
  do update set liked = excluded.liked, listing_id = excluded.listing_id, created_at = now();

  if not p_liked then
    return false;
  end if;

  select exists (
    select 1 from public.swipes
    where from_user_id = p_to_user_id and to_user_id = me and liked = true
  ) into matched;

  return coalesce(matched, false);
end $$;

-- RPC: список пользователей, с которыми взаимный матч (для бейджика-сердечка
-- в списке чатов и подписи "У вас взаимно" в самом диалоге)
create or replace function public.get_my_matches()
returns table(other_user_id uuid)
language sql security definer set search_path = public stable as $$
  select s1.to_user_id
  from public.swipes s1
  where s1.from_user_id = auth.uid() and s1.liked = true
    and exists (
      select 1 from public.swipes s2
      where s2.from_user_id = s1.to_user_id and s2.to_user_id = auth.uid() and s2.liked = true
    );
$$;

-- ============================================================
-- ПОПУТЧИК — миграция для админ-панели
-- Выполните этот файл целиком в Supabase → SQL Editor (после schema.sql)
-- ============================================================

-- Флаг администратора на профиле
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Защита: обычный клиент (даже владелец профиля) не может сам себе
-- выставить is_admin через update — новое значение обязано совпадать
-- со старым. Менять флаг можно только вручную через SQL Editor.
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
  );

-- Админы видят все объявления (включая скрытые/чужие) для модерации
drop policy if exists "listings_select" on public.listings;
create policy "listings_select" on public.listings for select
  using (
    is_active or auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Админы могут удалять любые объявления
drop policy if exists "listings_delete" on public.listings;
create policy "listings_delete" on public.listings for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- Сделать себя администратором ----------
-- Замените email на свой и выполните отдельно (уже после регистрации в приложении):
--
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'you@example.com');

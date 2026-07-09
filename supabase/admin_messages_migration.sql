-- ============================================================
-- ПОПУТЧИК — миграция: доступ админа к перепискам (просмотр + удаление)
-- Выполните в Supabase → SQL Editor
-- ============================================================

-- Админы видят все диалоги (не только свои)
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select" on public.conversations for select
  using (
    auth.uid() in (user_a, user_b)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Админы видят все сообщения (не только свои диалоги)
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select
  using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Админы могут удалять отдельные сообщения
drop policy if exists "messages_delete_admin" on public.messages;
create policy "messages_delete_admin" on public.messages for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Админы могут удалять диалоги целиком (сообщения удалятся каскадом)
drop policy if exists "conversations_delete_admin" on public.conversations;
create policy "conversations_delete_admin" on public.conversations for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

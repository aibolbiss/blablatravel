-- ============================================================
-- ПОПУТЧИК — фикс №2: упрощаем политику UPDATE для messages
-- Выполните в Supabase → SQL Editor
-- ============================================================
-- Предыдущая политика (read_receipts_migration.sql) использовала
-- самоссылающийся подзапрос в with check, который, похоже, блокировал
-- обновление read_at. Убираем его — оставляем только проверку, что
-- пользователь состоит в диалоге.

drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read" on public.messages for update
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)))
  with check (exists (select 1 from public.conversations c
                       where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));

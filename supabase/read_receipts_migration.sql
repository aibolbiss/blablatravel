-- ============================================================
-- ПОПУТЧИК — фикс: сообщения никогда не помечались прочитанными
-- Выполните в Supabase → SQL Editor
-- ============================================================
-- В таблице messages включена RLS, но политики на UPDATE не было —
-- запрос "пометить прочитанным" (read_at) при открытии диалога молча
-- блокировался базой, поэтому бейджик непрочитанных никогда не пропадал.

drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read" on public.messages for update
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)))
  with check (
    content = (select m.content from public.messages m where m.id = messages.id)
    and sender_id = (select m.sender_id from public.messages m where m.id = messages.id)
    and conversation_id = (select m.conversation_id from public.messages m where m.id = messages.id)
  );

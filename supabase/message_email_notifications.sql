-- Apply after schema.sql. No existing messages are backfilled.
create table if not exists public.message_email_jobs (
  message_id uuid primary key references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  locale text not null,
  payload jsonb,
  attempts integer not null default 0,
  claim_token uuid,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);
alter table public.message_email_jobs enable row level security;
revoke all on public.message_email_jobs from anon, authenticated;
grant select, update, delete on public.message_email_jobs to service_role;
create index if not exists message_email_jobs_pending_idx
  on public.message_email_jobs (available_at) where sent_at is null and attempts < 6;

create or replace function public.enqueue_message_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end
    into recipient from public.conversations c
    where c.id = new.conversation_id and new.sender_id in (c.user_a, c.user_b);
  insert into public.message_email_jobs (message_id, conversation_id, recipient_id, recipient_email, locale)
    select new.id, new.conversation_id, u.id, u.email,
      case when u.raw_user_meta_data->>'locale' in ('ru','en','de','es','pt','fr')
        then u.raw_user_meta_data->>'locale' else 'en' end
    from auth.users u where u.id = recipient and u.email is not null and u.email_confirmed_at is not null
    on conflict (message_id) do nothing;
  return new;
end $$;
revoke all on function public.enqueue_message_email() from public, anon, authenticated;
drop trigger if exists enqueue_message_email on public.messages;
create trigger enqueue_message_email after insert on public.messages
  for each row execute function public.enqueue_message_email();

-- Atomic leases prevent concurrent workers from handling the same job.
-- Automatic retries stay within Resend's 24-hour idempotency window.
create or replace function public.claim_message_email_jobs()
returns setof public.message_email_jobs language sql security definer set search_path = '' as $$
  update public.message_email_jobs j
  set attempts = attempts + 1, claim_token = gen_random_uuid(), available_at = now() + interval '2 minutes'
  where j.message_id in (
    select q.message_id from public.message_email_jobs q
    where q.sent_at is null and q.attempts < 6 and q.available_at <= now()
      and q.created_at > now() - interval '20 hours'
    order by q.created_at for update skip locked limit 3
  ) returning j.*;
$$;
revoke all on function public.claim_message_email_jobs() from public, anon, authenticated;
grant execute on function public.claim_message_email_jobs() to service_role;

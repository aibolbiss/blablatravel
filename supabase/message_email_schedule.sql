-- First enable Supabase Cron and pg_net in the dashboard.
-- Add two secrets in Supabase Vault (do not commit real values):
-- message_email_url = https://blablatravel.com/api/notifications/email
-- message_email_secret = same value as EMAIL_NOTIFICATIONS_SECRET on the host
-- Run only after deploying the endpoint and applying message_email_notifications.sql.
do $$ begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'message_email_url')
    or not exists (select 1 from vault.decrypted_secrets where name = 'message_email_secret') then
    raise exception 'Configure message_email_url and message_email_secret in Vault first';
  end if;
end $$;

select cron.schedule('blablatravel-message-emails', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'message_email_url'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'message_email_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);

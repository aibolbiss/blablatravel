import type { SupabaseClient } from '@supabase/supabase-js';
import { messageEmail } from './message-template';

type EmailPayload = ReturnType<typeof messageEmail> & { from: string; to: string[] };
export type EmailJob = {
  message_id: string; conversation_id: string; recipient_email: string;
  locale: string; payload: EmailPayload | null; claim_token: string; attempts: number;
};

export async function deliverMessageEmail(client: SupabaseClient, job: EmailJob,
  config: { apiKey: string; from: string }, send: typeof fetch = fetch) {
  const update = (values: Record<string, unknown>) => client.from('message_email_jobs')
    .update(values).eq('message_id', job.message_id).eq('claim_token', job.claim_token);
  try {
    const payload = job.payload ?? {
      from: config.from, to: [job.recipient_email], ...messageEmail(job.locale, job.conversation_id),
    };
    // Persist exact bytes before contacting the provider so retries remain
    // idempotent even if a template, sender address or language changes.
    const { data: saved, error: saveError } = await update({ payload }).select('message_id').maybeSingle();
    if (saveError || !saved) throw new Error('payload_persistence_failed');
    const response = await send('https://api.resend.com/emails', {
      method: 'POST', headers: {
        Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `message-email/${job.message_id}`,
      }, body: JSON.stringify({ from: payload.from, to: payload.to, subject: payload.subject,
        html: payload.html, text: payload.text }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const result = await response.json();
    if (!result.id) throw new Error('invalid_provider_response');
    const { data: completed, error } = await update({ sent_at: new Date().toISOString(), last_error: null })
      .select('message_id').maybeSingle();
    if (error || !completed) throw new Error('delivery_persistence_failed');
    return true;
  } catch (error) {
    const reason = error instanceof Error && /^(provider_http_\d+|payload_persistence_failed|delivery_persistence_failed|invalid_provider_response)$/.test(error.message)
      ? error.message : 'delivery_request_failed';
    await update({ last_error: reason,
      available_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** (job.attempts - 1)) * 1000).toISOString(),
    });
    return false;
  }
}

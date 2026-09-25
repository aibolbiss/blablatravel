import { timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverMessageEmail, type EmailJob } from '@/lib/email/worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.EMAIL_NOTIFICATIONS_SECRET;
  const received = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.length < 32 || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Email service not configured', { status: 503 });
  }
  try {
    const client = createAdminClient();
    const { data, error } = await client.rpc('claim_message_email_jobs');
    if (error) return new Response('Email queue unavailable', { status: 503 });
    let sent = 0;
    for (const job of (data || []) as EmailJob[]) {
      if (await deliverMessageEmail(client, job, { apiKey, from })) sent++;
    }
    return Response.json({ processed: data?.length || 0, sent }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new Response('Email worker unavailable', { status: 503 });
  }
}

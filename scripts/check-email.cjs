const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, module, module.exports);
  return module.exports;
}
const template = load('src/lib/email/message-template.ts');
const { deliverMessageEmail } = load('src/lib/email/worker.ts', { './message-template': template });
const { afterLoginPath } = load('src/lib/auth-redirect.ts');
const id = '00000000-0000-4000-8000-000000000001';
const job = { message_id: id, conversation_id: id, recipient_email: 'recipient@example.invalid', locale: 'ru', claim_token: 'test-lease', attempts: 1, payload: null };
function database(failCompletion = false, failPayload = false) {
  const updates = [];
  return { updates, from(table) {
    assert.equal(table, 'message_email_jobs');
    return { update(values) {
      updates.push(values);
      const query = {
        eq(column, value) { assert.ok(['message_id', 'claim_token'].includes(column)); assert.equal(value, job[column]); return query; },
        select() { return query; },
        maybeSingle: async () => (failCompletion && values.sent_at) || (failPayload && values.payload)
          ? { data: null, error: { message: 'database failure' } } : { data: { message_id: id }, error: null },
        then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
      };
      return query;
    } };
  } };
}
async function main() {
  for (const locale of ['ru','en','de','es','pt','fr']) {
    const email = template.messageEmail(locale, id);
    assert.ok(email.html.includes(`lang="${locale}"`));
    assert.ok(email.html.includes(`https://blablatravel.com/${locale}/chat/${id}`));
    assert.ok(email.text.includes(`/chat/${id}`));
    assert.ok(email.subject.includes('BlaBlaTravel'));
    assert.ok(!/<script/i.test(email.html));
  }
  assert.throws(() => template.messageEmail('ru', '\"><img src=x onerror=alert(1)>'));
  assert.ok(template.messageEmail('__proto__', id).html.includes('lang="en"'));
  assert.equal(afterLoginPath(`/chat/${id}`), `/chat/${id}`);
  for (const next of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/chat/../../admin', null]) assert.equal(afterLoginPath(next), '/cabinet');
  const config = { apiKey: 'fake-key', from: 'BlaBlaTravel <test@example.invalid>' };
  let requests = [];
  const fakeSend = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.headers['Idempotency-Key'], `message-email/${id}`);
    requests.push(options.body);
    assert.deepEqual(JSON.parse(options.body).to, [job.recipient_email]);
    return Response.json({ id: 'provider-id' });
  };
  const db = database();
  assert.equal(await deliverMessageEmail(db, job, config, fakeSend), true);
  assert.ok(db.updates[0].payload);
  assert.ok(db.updates[1].sent_at);
  const failedDb = database(true);
  assert.equal(await deliverMessageEmail(failedDb, job, config, fakeSend), false);
  assert.equal(failedDb.updates.at(-1).last_error, 'delivery_persistence_failed');
  const reloadedPayload = Object.fromEntries(Object.entries(failedDb.updates[0].payload).reverse());
  assert.equal(await deliverMessageEmail(database(), { ...job, payload: reloadedPayload, attempts: 2 }, { ...config, from: 'changed@example.invalid' }, fakeSend), true);
  assert.equal(requests[1], requests[2], 'Retries must reuse the identical payload');
  const initialCount = requests.length;
  assert.equal(await deliverMessageEmail(database(false, true), job, config, fakeSend), false);
  assert.equal(requests.length, initialCount, 'Never send if the payload was not persisted');
  const failure = database();
  assert.equal(await deliverMessageEmail(failure, job, config, async () => new Response('', { status: 429 })), false);
  assert.equal(failure.updates.at(-1).last_error, 'provider_http_429');
  assert.ok(Date.parse(failure.updates.at(-1).available_at) > Date.now());
  const route = load('src/app/api/notifications/email/route.ts', {
    'node:crypto': require('node:crypto'),
    '@/lib/supabase/admin': { createAdminClient() { throw new Error('Must not access DB without authorization'); } },
    '@/lib/email/worker': { deliverMessageEmail },
  });
  const previous = process.env.EMAIL_NOTIFICATIONS_SECRET;
  process.env.EMAIL_NOTIFICATIONS_SECRET = 'x'.repeat(40);
  assert.equal((await route.POST(new Request('https://example.invalid'))).status, 401);
  assert.equal((await route.POST(new Request('https://example.invalid', { headers: { authorization: 'Bearer wrong' } }))).status, 401);
  if (previous === undefined) delete process.env.EMAIL_NOTIFICATIONS_SECRET; else process.env.EMAIL_NOTIFICATIONS_SECRET = previous;
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/email-preview.html', template.messageEmail('ru', id).html);
  console.log('Passed: 6 templates, safe links, worker authorization, delivery, retries, idempotent payloads and provider failure. No real emails sent. Preview: docs/email-preview.html');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

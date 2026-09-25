// Query-shape and regression tests without an account or production writes.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
// These tests only use HTTP. Fail if a realtime connection is attempted.
const realtime = { transport: class { constructor() { throw new Error('Unexpected realtime connection in HTTP tests'); } } };

function loadTypescript(file, imports = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, module, module.exports);
  return module.exports;
}
const queries = loadTypescript('src/lib/chat-queries.ts');
const userId = '00000000-0000-4000-8000-000000000001';

async function main() {
  const requests = [];
  const client = createClient('https://test.invalid', 'test-key', {
    realtime,
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      const url = new URL(input);
      requests.push(url);
      let data;
      if (url.pathname.endsWith('/conversations')) {
        assert.equal(url.searchParams.get('last_message.limit'), '1');
        assert.equal(url.searchParams.get('unread.limit'), '1');
        assert.equal(url.searchParams.get('unread.read_at'), 'is.null');
        assert.equal(url.searchParams.get('unread.sender_id'), `neq.${userId}`);
        assert.equal(url.searchParams.get('or'), `(user_a.eq.${userId},user_b.eq.${userId})`);
        assert.equal(url.searchParams.get('offset'), '20');
        assert.equal(url.searchParams.get('limit'), '20');
        assert.equal(url.searchParams.get('last_message.order'), 'created_at.desc,id.desc');
        data = Array.from({ length: 20 }, (_, i) => ({
          id: String(i), user_a: userId, user_b: `other-${i}`,
          last_message: i === 0 ? [] : [{ content: `message-${i}`, created_at: `2026-09-${String(i + 1).padStart(2, '0')}` }],
          unread: i === 2 ? [{ id: 'unread' }] : [],
        }));
      } else if (url.pathname.endsWith('/profiles')) {
        data = Array.from({ length: 20 }, (_, i) => ({ id: `other-${i}`, name: `Person ${i}` }));
      } else if (url.pathname.endsWith('/rpc/get_my_matches')) {
        data = [{ other_user_id: 'other-2' }];
      } else if (url.pathname.endsWith('/messages')) {
        assert.equal(url.searchParams.get('limit'), '1');
        assert.equal(url.searchParams.get('read_at'), 'is.null');
        assert.equal(url.searchParams.get('sender_id'), `neq.${userId}`);
        assert.equal(url.searchParams.get('conversations.or'), `(user_a.eq.${userId},user_b.eq.${userId})`);
        assert.ok(url.searchParams.get('select').includes('conversations!inner'));
        data = [];
      } else throw new Error('Unexpected request');
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Content-Range': '20-39/40' } });
    } },
  });
  const chat = loadTypescript('src/lib/chat.ts', {
    '@/lib/supabase/server': { createClient: () => client },
    '@/lib/chat-queries': queries,
  });
  const { previews, count } = await chat.getConversations(userId, 20, 20);
  assert.equal(requests.length, 3, '20 chat previews must use only three requests');
  assert.equal(previews.length, 20);
  assert.equal(count, 40);
  assert.equal(previews[0].id, '19');
  assert.equal(previews.at(-1).lastMessage, null);
  assert.equal(previews.find((c) => c.id === '2').hasUnread, true);
  assert.equal(previews.find((c) => c.id === '2').isMatch, true);
  assert.equal(previews.find((c) => c.id === '1').hasUnread, false);
  const before = requests.length;
  await queries.unreadMessageQuery(client, userId);
  assert.equal(requests.length - before, 1);
  console.log('Passed: 20 conversations use 3 requests; unread check uses 1 bounded request; membership, pagination, sort, unread and match flags preserved.');

  if (process.argv.includes('--live')) {
    require('@next/env').loadEnvConfig(process.cwd());
    const live = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { realtime, auth: { persistSession: false, autoRefreshToken: false } });
    // Anonymous schema validation only. No login, service role or writes.
    const results = await Promise.all([
      queries.conversationPreviewsQuery(live, userId, 0, 1),
      queries.unreadMessageQuery(live, userId),
    ]);
    for (const result of results) {
      assert.equal(result.error, null, result.error?.message);
      assert.deepEqual(result.data, [], 'Anonymous users must not see private messages');
    }
    console.log('Passed: both embedded queries accepted by live PostgREST; anonymous access returns no private data.');
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

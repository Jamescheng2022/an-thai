#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  return res;
}

async function testProxyHandler() {
  const mod = await import(pathToFileURL(path.join(__dirname, '../api/sr-bridge.js')).href);
  const handler = mod.default;
  const origEnv = { ...process.env };
  const origFetch = global.fetch;

  try {
    // 1. Unconfigured SR_BRIDGE_BASE_URL fails closed with 503
    delete process.env.SR_BRIDGE_BASE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.ALLOW_SR_BRIDGE_IN_PROD;
    let res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health', headers: {} }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(res.body.configured, false);

    // 2. Production V1.0 host fail-closed unless explicitly allowed
    process.env.SR_BRIDGE_BASE_URL = 'https://sourcerating-staging.example.com';
    process.env.VERCEL_ENV = 'production';
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health', headers: {} }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'BRIDGE_DISABLED_IN_V1_PROD');

    // 3. Rejects forbidden SR production Supabase hostname
    delete process.env.VERCEL_ENV;
    process.env.SR_BRIDGE_BASE_URL = 'https://qnozpurjtgkmwtvsrjoi.supabase.co';
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health', headers: {} }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'SR_BRIDGE_BASE_URL_UNCONFIGURED');

    // 4. Route & UUID & Size validation + strict Staging origin & bypass gating
    process.env.SR_BRIDGE_BASE_URL = 'https://evil.example.com';
    process.env.SR_VERCEL_PROTECTION_BYPASS = 'dummy_bypass_token_test';
    let leakedCall = false;
    global.fetch = async () => { leakedCall = true; return { status: 200 }; };
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health', headers: { authorization: 'Bearer visitor_secret' } }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'SR_BRIDGE_BASE_URL_UNCONFIGURED');
    assert.strictEqual(leakedCall, false);

    // ALLOW_SR_BRIDGE_IN_PROD in VERCEL_ENV=production MUST NOT forward staging bypass secret
    process.env.VERCEL_ENV = 'production';
    process.env.ALLOW_SR_BRIDGE_IN_PROD = 'true';
    process.env.SR_BRIDGE_BASE_URL = 'https://sourcerating-staging-test.vercel.app';
    let prodBypassSeen;
    global.fetch = async (url, init) => {
      prodBypassSeen = init.headers['x-vercel-protection-bypass'];
      return { status: 200, headers: new Map([['content-type', 'application/json']]), json: async () => ({ ok: true }) };
    };
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health', headers: {} }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(prodBypassSeen, undefined);
    delete process.env.ALLOW_SR_BRIDGE_IN_PROD;
    process.env.VERCEL_ENV = 'preview';

    process.env.SR_BRIDGE_BASE_URL = 'https://sourcerating-staging-test.vercel.app';
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=bogus', headers: {} }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'INVALID_BRIDGE_ROUTE');

    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=messages&sessionId=not-a-uuid', headers: {} }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'INVALID_SESSION_ID');

    res = createMockRes();
    await handler({
      method: 'POST',
      url: '/api/sr-bridge?route=sessions',
      headers: {},
      body: { message: 'x'.repeat(17000) }
    }, res);
    assert.strictEqual(res.statusCode, 413);
    assert.strictEqual(res.body.error, 'PAYLOAD_TOO_LARGE');

    // 5. Upstream 302 Deployment Protection fails closed with 503 upstreamProtected: true
    let capturedRedirectMode = null;
    global.fetch = async (url, init) => {
      capturedRedirectMode = init.redirect;
      return {
        status: 302,
        headers: new Map([['location', 'https://vercel.com/login']]),
        json: async () => ({})
      };
    };
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=health&workspaceKey=an-thai-th', headers: {} }, res);
    assert.strictEqual(capturedRedirectMode, 'manual');
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.upstreamProtected, true);
    assert.strictEqual(res.body.error, 'SR_STAGING_DEPLOYMENT_PROTECTED_302');

    // 6. Upstream HTML SSO non-JSON fails closed with 503
    global.fetch = async () => ({
      status: 200,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      json: async () => { throw new Error('html'); }
    });
    res = createMockRes();
    await handler({ method: 'GET', url: '/api/sr-bridge?route=posts', headers: {} }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'SR_STAGING_NON_JSON_RESPONSE');

    // 7. Upstream JSON passes cleanly with bypass, Origin, x-bridge-challenge & x-turnstile-token headers preserved
    let capturedUrl = '';
    let capturedHeaders = null;
    process.env.SR_VERCEL_PROTECTION_BYPASS = 'dummy_bypass_token_test';
    global.fetch = async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      return {
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ ok: true, sessionId: '11111111-1111-4111-8111-111111111111', requestId: 'SR-OK-1' })
      };
    };
    res = createMockRes();
    await handler({
      method: 'POST',
      url: '/api/sr-bridge?route=sessions',
      headers: { host: 'an-thai-preview.vercel.app', 'x-bridge-challenge': 'chal_123', 'x-turnstile-token': 'tok_123' },
      body: { workspaceKey: 'an-thai-th', message: 'hello' }
    }, res);
    assert.strictEqual(capturedUrl, 'https://sourcerating-staging-test.vercel.app/api/bridge/v1/sessions');
    assert.strictEqual(capturedHeaders['x-vercel-protection-bypass'], 'dummy_bypass_token_test');
    assert.strictEqual(capturedHeaders['x-vercel-set-bypass-cookie'], 'false');
    assert.strictEqual(capturedHeaders.Origin, 'https://an-thai-preview.vercel.app');
    assert.strictEqual(capturedHeaders['x-bridge-challenge'], 'chal_123');
    assert.strictEqual(capturedHeaders['x-turnstile-token'], 'tok_123');
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.requestId, 'SR-OK-1');
    // 8. Stalled body TimeoutError returns 504 SR_UPSTREAM_TIMEOUT (not 502 UPSTREAM_INVALID_JSON)
    global.fetch = async () => ({
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => {
        const err = new Error('body timed out');
        err.name = 'TimeoutError';
        throw err;
      }
    });
    res = createMockRes();
    await handler({ method: 'POST', url: '/api/sr-bridge?route=sessions', headers: { host: 'an-thai-preview.vercel.app' }, body: { workspaceKey: 'an-thai-th', message: 'hi' } }, res);
    assert.strictEqual(res.statusCode, 504);
    assert.strictEqual(res.body.error, 'SR_UPSTREAM_TIMEOUT');
  } finally {
    process.env = origEnv;
    global.fetch = origFetch;
  }
}

async function testAdapterAndMock() {
  const mockSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sr-bridge-mock.js'), 'utf8');
  const adapterSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sourcerating-embed-adapter.js'), 'utf8');

  const store = new Map();
  let fetchMode = '302';
  let postSessionsCalls = 0;
  let lastCreateSessionBody = null;
  let lastHandoffPostBody = null;

  const sandbox = {
    window: null,
    console,
    Date,
    Math,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    JSON,
    crypto: require('node:crypto').webcrypto,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    },
    location: { href: 'https://an-thai-preview.vercel.app/contact.html', protocol: 'https:' },
    fetch: async (url, init) => {
      if (fetchMode === '302') {
        return { ok: false, status: 503, json: async () => ({ ok: false, configured: false, upstreamProtected: true }) };
      }
      if (url.includes('route=health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            configured: true,
            online: true,
            organizationId: '00000000-0000-4000-8000-00000000a771',
            challengeToken: 'live_tok_1'
          })
        };
      }
      if (url.includes('route=sessions')) {
        postSessionsCalls += 1;
        lastCreateSessionBody = JSON.parse((init && init.body) || '{}');
        if (postSessionsCalls === 1) {
          return { ok: false, status: 409, json: async () => ({ ok: false, error: 'IDEMPOTENCY_TOKEN_UNRECOVERABLE' }) };
        }
        return {
          ok: true,
          status: 201,
          json: async () => {
            if (init && init.signal) assert.strictEqual(init.signal.aborted, false);
            return {
              ok: true,
              sessionId: '22222222-2222-4222-8222-222222222222',
              visitorToken: 'vtok_live_123',
              requestId: 'SR-20261126-TEST'
            };
          }
        };
      }
      if (url.includes('route=messages')) {
        if (fetchMode === 'network_error') {
          throw new TypeError('network drop');
        }
        if (fetchMode === '401') {
          return { ok: false, status: 401, json: async () => ({ ok: false, error: 'Unauthorized' }) };
        }
        if (fetchMode === 'paginated501') {
          const sp = new URL('http://localhost' + url).searchParams;
          const after = Number(sp.get('afterSeq') || '0');
          if (after < 500) {
            const batch = Array.from({ length: 50 }, (_, i) => ({ id: 'm-' + (after + i + 1), seq: after + i + 1, senderKind: 'visitor', text: 'msg ' + (after + i + 1) }));
            return { ok: true, status: 200, json: async () => ({ ok: true, messages: batch, nextAfterSeq: after + 50, hasMore: true }) };
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              messages: [{ id: 'm-501', seq: 501, senderKind: 'staff', senderLabel: 'Engineer', text: 'reply 501' }],
              nextAfterSeq: 501,
              hasMore: false
            })
          };
        }
        if (fetchMode === 'handoff_human_active' && init && init.method === 'POST') {
          lastHandoffPostBody = JSON.parse(init.body || '{}');
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, persisted: true, sessionStatus: 'human_active' })
          };
        }
        if (fetchMode === 'paginated') {
          const sp = new URL('http://localhost' + url).searchParams;
          const after = Number(sp.get('afterSeq') || '0');
          if (after === 0) {
            const page1 = Array.from({ length: 50 }, (_, i) => ({ id: 'm-' + (i + 1), seq: i + 1, senderKind: 'visitor', text: 'msg ' + (i + 1) }));
            return { ok: true, status: 200, json: async () => ({ ok: true, messages: page1, nextAfterSeq: 50 }) };
          }
          const page2 = [
            { id: 'm-51', seq: 51, senderKind: 'staff', text: 'reply 51' },
            { id: 'm-52', seq: 52, senderKind: 'staff', text: 'reply 52' },
          ];
          return { ok: true, status: 200, json: async () => ({ ok: true, messages: page2, nextAfterSeq: 52 }) };
        }
        return { ok: true, status: 200, json: async () => ({ ok: true, messages: [] }) };
      }
      if (url.includes('route=posts')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            posts: [
              { id: 'pub-1', visibility: 'public', publish_status: 'published', title: 'Live Public' },
              { id: 'priv-1', visibility: 'private', publish_status: 'published', title: 'Private' },
              { id: 'ret-1', visibility: 'public', publish_status: 'retracted', title: 'Retracted' }
            ]
          })
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(mockSrc, sandbox);
  vm.runInContext(adapterSrc, sandbox);

  // 1. Staging protected (503) -> falls into explicit mockFallback with isMock: true & persistedToSr: false
  const mockAdapter = new sandbox.SourceRatingEmbedAdapter({
    bridgeEndpoint: '/api/sr-bridge',
    workspaceKey: 'an-thai-th',
    mockFallback: true
  });
  const initRes = await mockAdapter.init();
  assert.strictEqual(initRes.ok, true);
  assert.strictEqual(initRes.mode, 'mock');
  assert.strictEqual(initRes.isMock, true);

  const posts1 = await mockAdapter.listPublicPosts();
  assert.strictEqual(posts1.isMock, true);
  assert.strictEqual(posts1.posts.length, 1);
  assert.strictEqual(posts1.posts[0].id, 'TEST-ANTHAI-UPD-0001');

  const sessRes = await mockAdapter.createSession({ message: 'SLT inquiry 40 piles', roomLabel: '01 Testing' });
  assert.strictEqual(sessRes.ok, true);
  assert.strictEqual(sessRes.isMock, true);
  assert.strictEqual(sessRes.persistedToSr, false);
  assert.ok(sessRes.requestId.startsWith('SR-MOCK-'));

  const handoffRes = await mockAdapter.requestHumanHandoff({ reason: 'visitor_requested' });
  assert.strictEqual(handoffRes.ok, true);
  assert.strictEqual(handoffRes.sessionStatus, 'waiting_human');

  // Verify first-click requestHumanHandoff on a fresh mock adapter creates AND transitions session to waiting_human
  const freshHandoffAdapter = new sandbox.SourceRatingEmbedAdapter({
    bridgeEndpoint: '/api/sr-bridge',
    workspaceKey: 'an-thai-first-handoff',
    mockFallback: true
  });
  await freshHandoffAdapter.init();
  const firstHandoff = await freshHandoffAdapter.requestHumanHandoff({ reason: 'visitor_requested' });
  assert.strictEqual(firstHandoff.ok, true);
  assert.strictEqual(firstHandoff.sessionStatus, 'waiting_human');
  const firstSess = await freshHandoffAdapter.getSession();
  assert.strictEqual(firstSess.session.status, 'waiting_human');

  // Simulate post correction + retraction lifecycle
  sandbox.ANTHAI_SR_MOCK.upsertPublicPost('an-thai-th', {
    id: 'TEST-ANTHAI-UPD-0001',
    publish_status: 'corrected',
    revision_no: 2,
    title: '[TEST] Corrected post'
  });
  let posts2 = await mockAdapter.listPublicPosts();
  assert.strictEqual(posts2.posts[0].publish_status, 'corrected');
  assert.strictEqual(posts2.posts[0].revision_no, 2);

  sandbox.ANTHAI_SR_MOCK.retractPublicPost('an-thai-th', 'TEST-ANTHAI-UPD-0001');
  let posts3 = await mockAdapter.listPublicPosts();
  assert.strictEqual(posts3.posts.length, 0);

  // 2. forceOffline skips mock and live completely
  const offAdapter = new sandbox.SourceRatingEmbedAdapter({
    bridgeEndpoint: '/api/sr-bridge',
    workspaceKey: 'an-thai-th',
    mockFallback: true,
    forceOffline: true
  });
  const offRes = await offAdapter.init();
  assert.strictEqual(offRes.mode, 'offline');
  assert.strictEqual(offRes.isMock, false);

  // 3. Live mode 409 recovery, post filtering, and 401 sessionReset
  fetchMode = 'live';
  const liveAdapter = new sandbox.SourceRatingEmbedAdapter({
    bridgeEndpoint: '/api/sr-bridge',
    workspaceKey: 'an-thai-th',
    mockFallback: true
  });
  const liveInit = await liveAdapter.init();
  assert.strictEqual(liveInit.mode, 'live');
  assert.strictEqual(liveInit.isMock, false);

  const liveSess = await liveAdapter.createSession({ message: 'Live inquiry test' });
  assert.strictEqual(postSessionsCalls, 2); // recovered after 409
  assert.strictEqual(liveSess.ok, true);
  assert.strictEqual(liveSess.persistedToSr, true);
  assert.strictEqual(liveSess.isMock, false);

  const livePosts = await liveAdapter.listPublicPosts();
  assert.strictEqual(livePosts.posts.length, 1);
  assert.strictEqual(livePosts.posts[0].id, 'pub-1');

  fetchMode = 'paginated';
  const pagedRes = await liveAdapter.listMessages();
  assert.strictEqual(pagedRes.ok, true);
  assert.strictEqual(pagedRes.messages.length, 52);
  assert.strictEqual(pagedRes.messages[51].senderKind, 'staff');

  fetchMode = 'paginated501';
  const paged501 = await liveAdapter.listMessages();
  assert.strictEqual(paged501.ok, true);
  assert.strictEqual(paged501.messages.length, 501);
  assert.strictEqual(paged501.messages[500].seq, 501);
  assert.strictEqual(paged501.messages[500].senderKind, 'staff');

  // Verify live first-click handoff with explicit text never duplicates text and preserves human_active
  const liveFirstHandoff = new sandbox.SourceRatingEmbedAdapter({
    bridgeEndpoint: '/api/sr-bridge',
    workspaceKey: 'an-thai-live-handoff'
  });
  fetchMode = 'live';
  await liveFirstHandoff.init();
  fetchMode = 'handoff_human_active';
  postSessionsCalls = 1; // skip 409 retry path
  const hRes = await liveFirstHandoff.requestHumanHandoff({ text: 'Custom first opener' });
  assert.strictEqual(hRes.ok, true);
  assert.strictEqual(hRes.sessionStatus, 'human_active');
  assert.strictEqual(liveFirstHandoff.session.status, 'human_active');
  assert.strictEqual(lastCreateSessionBody.message, 'Custom first opener');
  assert.notStrictEqual(lastHandoffPostBody.text, 'Custom first opener');

  fetchMode = 'network_error';
  const netErrRes = await liveAdapter.sendMessage({ text: 'drop test' });
  assert.strictEqual(netErrRes.ok, false);
  assert.strictEqual(netErrRes.persisted, false);
  assert.ok(netErrRes.error.includes('network drop'));

  fetchMode = '401';
  const expiredRes = await liveAdapter.listMessages();
  assert.strictEqual(expiredRes.sessionReset, true);
  assert.strictEqual(liveAdapter.session, null);
}

async function testEnquiryHandler() {
  const enqSrc = fs.readFileSync(path.join(__dirname, '../api/enquiry.js'), 'utf8');
  const mod = { exports: {} };
  const fn = new Function('exports', 'module', 'process', 'fetch', 'AbortSignal', enqSrc.replace(/export\s+default\s+async\s+function\s+handler/, 'module.exports = async function handler'));

  const origEnv = { ...process.env };
  const origFetch = global.fetch;
  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.INQUIRY_WEBHOOK_URL;
    delete process.env.ENQUIRY_FROM_EMAIL;
    delete process.env.ENQUIRY_TO_EMAIL;
    let handler;
    fn(mod.exports, mod, process, global.fetch, AbortSignal);
    handler = mod.exports;

    // 1. GET unconfigured
    let res = createMockRes();
    await handler({ method: 'GET', headers: {} }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.configured, false);
    assert.strictEqual(res.body.backend, 'unconfigured');

    // 2. POST unconfigured fails closed 503 with delivered: false; key alone without sender/recipient MUST still fail closed 503
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: {},
      body: { route: '01 Testing', contact: 'qa@example.invalid', notes: 'test backup unconfigured' }
    }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.delivered, false);
    assert.strictEqual(res.body.error, 'RESEND_UNCONFIGURED');

    process.env.RESEND_API_KEY = 'dummy_resend_key_without_routing';
    fn(mod.exports, mod, process, async () => { throw new Error('must not fetch'); }, AbortSignal);
    handler = mod.exports;
    res = createMockRes();
    await handler({ method: 'GET', headers: {} }, res);
    assert.strictEqual(res.body.configured, false);
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: {},
      body: { route: '01 Testing', contact: 'qa@example.invalid', notes: 'missing recipient must not send' }
    }, res);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'RESEND_UNCONFIGURED');

    // 2b. Malformed JSON null & oversized parsed object without Content-Length fail cleanly
    res = createMockRes();
    await handler({ method: 'POST', headers: {}, body: null }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'INVALID_JSON_OBJECT');

    res = createMockRes();
    await handler({ method: 'POST', headers: {}, body: { route: '01 Testing', contact: 'a@b.c', notes: 'x'.repeat(17000) } }, res);
    assert.strictEqual(res.statusCode, 413);
    assert.strictEqual(res.body.error, 'PAYLOAD_TOO_LARGE');

    // 3. POST with RESEND_API_KEY + explicit routing sends plain text via Resend & returns delivered: true
    process.env.RESEND_API_KEY = 'dummy_resend_key';
    process.env.ENQUIRY_FROM_EMAIL = 'AN-THAI <enquiry@an-thai.com>';
    process.env.ENQUIRY_TO_EMAIL = 'info@an-thai.com,anthaicheng@gmail.com';
    let resendReq = null;
    fn(mod.exports, mod, process, async (url, init) => {
      resendReq = { url, body: JSON.parse(init.body), headers: init.headers, redirect: init.redirect, signal: init.signal };
      return { ok: true, status: 200, json: async () => ({ id: 're_test_123' }) };
    }, AbortSignal);
    handler = mod.exports;
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.10' },
      body: { route: "01 Testing\r\nBcc: evil@example.com", contact: 'qa@example.invalid', notes: 'SR outage failover check', mode: 'sr_failover_backup' }
    }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.delivered, true);
    assert.strictEqual(res.body.status, 'accepted_for_delivery');
    assert.strictEqual(res.body.providerMessageId, 're_test_123');
    assert.strictEqual(resendReq.redirect, 'manual');
    assert.ok(resendReq.signal);
    assert.ok(resendReq.body.subject.includes('[Resend Backup'));
    assert.ok(!/[\r\n]/.test(resendReq.body.subject));
    assert.deepStrictEqual(resendReq.body.to, ['info@an-thai.com', 'anthaicheng@gmail.com']);

    // 3b. Stalled createSession body keeps AbortSignal active during res.json() & rejects non-string/empty id
    fn(mod.exports, mod, process, async () => ({ ok: true, status: 200, json: async () => ({ id: true }) }), AbortSignal);
    handler = mod.exports;
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.12' },
      body: { route: '01 Testing', contact: 'qa@example.invalid', notes: 'non-string id check' }
    }, res);
    assert.strictEqual(res.statusCode, 502);
    assert.strictEqual(res.body.delivered, false);
    assert.strictEqual(res.body.error, 'RESEND_UNCERTAIN_RESPONSE');

    fn(mod.exports, mod, process, async () => ({ ok: true, status: 200, json: async () => ({ id: '   ' }) }), AbortSignal);
    handler = mod.exports;
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.13' },
      body: { route: '01 Testing', contact: 'qa@example.invalid', notes: 'whitespace id check' }
    }, res);
    assert.strictEqual(res.statusCode, 502);
    assert.strictEqual(res.body.delivered, false);

    // 4. Upstream Resend error returns 502 delivered: false
    fn(mod.exports, mod, process, async () => ({ ok: false, status: 500, json: async () => ({}) }), AbortSignal);
    handler = mod.exports;
    res = createMockRes();
    await handler({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.11' },
      body: { route: '01 Testing', contact: 'qa@example.invalid', notes: 'Resend failure test' }
    }, res);
    assert.strictEqual(res.statusCode, 502);
    assert.strictEqual(res.body.delivered, false);
  } finally {
    process.env = origEnv;
    global.fetch = origFetch;
  }
}

async function testSingleFlightAndIdempotency() {
  const mockSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sr-bridge-mock.js'), 'utf8');
  const adapterSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sourcerating-embed-adapter.js'), 'utf8');

  const store = new Map();
  let createCalls = 0;
  let createMode = 'delayed_ok'; // 'delayed_ok' | 'fail_once_then_ok'
  const seenClientReqIds = [];
  let messageCalls = 0;
  const seenClientMsgIds = [];

  const createSandbox = () => {
    const sb = {
      window: null,
      console,
      Date,
      Math,
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      JSON,
      crypto: require('node:crypto').webcrypto,
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k)
      },
      location: { href: 'https://an-thai-preview.vercel.app/zh/index.html', protocol: 'https:' },
      fetch: async (url, init) => {
        if (url.includes('route=health')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              configured: true,
              online: true,
              organizationId: '00000000-0000-4000-8000-00000000a771',
              challengeToken: 'tok_sf_1'
            })
          };
        }
        if (url.includes('route=sessions')) {
          createCalls += 1;
          const body = JSON.parse((init && init.body) || '{}');
          seenClientReqIds.push(body.clientRequestId);
          await new Promise((r) => setTimeout(r, 40));
          if (createMode === 'fail_once_then_ok' && createCalls === 1) {
            return { ok: false, status: 503, json: async () => ({ ok: false, error: 'TEMPORARY_UNAVAILABLE' }) };
          }
          return {
            ok: true,
            status: 201,
            json: async () => ({
              ok: true,
              sessionId: '33333333-3333-4333-8333-333333333333',
              visitorToken: 'vtok_persistent_sf_999',
              requestId: 'SR-SF-001',
              status: 'ai_active'
            })
          };
        }
        if (url.includes('route=messages')) {
          if (init && init.method === 'POST') {
            messageCalls += 1;
            const b = JSON.parse(init.body || '{}');
            seenClientMsgIds.push(b.clientMsgId);
            await new Promise((r) => setTimeout(r, 25));
            return { ok: true, status: 201, json: async () => ({ ok: true, persisted: true, sessionStatus: 'ai_active' }) };
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              messages: [{ id: 'm1', seq: 1, senderKind: 'visitor', text: '你好', createdAt: new Date().toISOString() }]
            })
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            session: { sessionId: '33333333-3333-4333-8333-333333333333', status: 'ai_active' }
          })
        };
      }
    };
    sb.window = sb;
    vm.createContext(sb);
    vm.runInContext(mockSrc, sb);
    vm.runInContext(adapterSrc, sb);
    return sb;
  };

  // 1. Concurrent multi-clicks / double-submit during slow network produce ONLY 1 POST ?route=sessions
  let sb = createSandbox();
  let adapter = new sb.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'an-thai-th', defaultLang: 'zh' });
  await adapter.init();
  const concurrentResults = await Promise.all([
    adapter.sendMessage({ text: '你好' }),
    adapter.sendMessage({ text: '你好' }),
    adapter.sendMessage({ text: '你好' }),
    adapter.sendMessage({ text: '你好' }),
  ]);
  assert.strictEqual(createCalls, 1, 'Concurrent rapid sendMessage calls must issue at most 1 POST ?route=sessions');
  for (const r of concurrentResults) {
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.sessionId, '33333333-3333-4333-8333-333333333333');
  }
  assert.strictEqual(adapter.visitorToken, 'vtok_persistent_sf_999');

  // 2. Refresh after session created keeps visitorToken + sessionId and sends follow-up via POST ?route=messages (0 new sessions)
  sb = createSandbox();
  const reloadedAdapter = new sb.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'an-thai-th', defaultLang: 'zh' });
  await reloadedAdapter.init();
  assert.strictEqual(reloadedAdapter.session.sessionId, '33333333-3333-4333-8333-333333333333');
  assert.strictEqual(reloadedAdapter.visitorToken, 'vtok_persistent_sf_999');
  const followUp = await reloadedAdapter.sendMessage({ text: '补充需求：1200吨' });
  assert.strictEqual(followUp.ok, true);
  assert.strictEqual(createCalls, 1, 'Follow-up after refresh must reuse session and create 0 new sessions');
  assert.strictEqual(messageCalls, 1);

  // 3. Failure before session finishes + reload + retry reuses EXACT SAME clientRequestId
  store.clear();
  createCalls = 0;
  seenClientReqIds.length = 0;
  createMode = 'fail_once_then_ok';
  sb = createSandbox();
  const retryAdapter1 = new sb.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'retry-test', defaultLang: 'en' });
  await retryAdapter1.init();
  const failRes = await retryAdapter1.createSession({ message: 'Initial failed send' });
  assert.strictEqual(failRes.ok, false);
  // Simulate full browser reload before retrying
  sb = createSandbox();
  const retryAdapter2 = new sb.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'retry-test', defaultLang: 'en' });
  await retryAdapter2.init();
  const okRes = await retryAdapter2.createSession({ message: 'Initial failed send' });
  assert.strictEqual(okRes.ok, true);
  assert.strictEqual(createCalls, 2);
  assert.strictEqual(seenClientReqIds[0], seenClientReqIds[1], 'Retry after failure + reload must reuse exact same clientRequestId');

  // 4. Mock transport idempotency by clientRequestId + clientMsgId
  store.clear();
  sb = createSandbox();
  const mockA = new sb.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'mock-idemp', mockFallback: true });
  await mockA.init();
  const fixedReqId = '44444444-4444-4444-8444-444444444444';
  const m1 = await mockA.createSession({ clientRequestId: fixedReqId, message: 'Hello mock' });
  mockA.session = null; // simulate memory drop before write
  const m2 = await mockA.createSession({ clientRequestId: fixedReqId, message: 'Hello mock' });
  assert.strictEqual(m1.sessionId, m2.sessionId, 'Mock createSession must deduplicate identical clientRequestId');
  assert.strictEqual(m1.visitorToken, m2.visitorToken, 'Mock createSession must reuse persistent visitorToken');
}

async function testReviewRegressionCases() {
  const mockSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sr-bridge-mock.js'), 'utf8');
  const adapterSrc = fs.readFileSync(path.join(__dirname, '../assets/js/sourcerating-embed-adapter.js'), 'utf8');

  // Shared server ledger & storage across simulated tabs
  const storageMap = new Map();
  let denyStorage = false;
  let serverSessions = [];
  let serverMessages = [];
  let dropCreateResponseCount = 0;
  let createDelayMs = 40;
  let forceGetSession401ForToken = null;
  let lockChain = Promise.resolve();

  const makeTabSandbox = (listenersOut) => {
    const ls = {
      getItem: (k) => {
        if (denyStorage) throw new Error('SecurityError');
        return storageMap.has(k) ? storageMap.get(k) : null;
      },
      setItem: (k, v) => {
        if (denyStorage) throw new Error('SecurityError');
        storageMap.set(k, String(v));
      },
      removeItem: (k) => {
        if (denyStorage) throw new Error('SecurityError');
        storageMap.delete(k);
      }
    };
    const sb = {
      window: null,
      console,
      Date,
      Math,
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      JSON,
      crypto: require('node:crypto').webcrypto,
      localStorage: ls,
      navigator: {
        locks: {
          request: (_name, cb) => {
            const next = lockChain.then(() => cb(), () => cb());
            lockChain = next.then(() => {}, () => {});
            return next;
          }
        }
      },
      addEventListener: (ev, fn) => {
        if (listenersOut) listenersOut[ev] = fn;
      },
      location: { href: 'https://an-thai-preview.vercel.app/contact.html', protocol: 'https:' },
      fetch: async (url, init) => {
        if (url.includes('route=health')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, configured: true, online: true, organizationId: '00000000-0000-4000-8000-00000000a771', challengeToken: 'tok_r' })
          };
        }
        if (url.includes('route=sessions')) {
          const b = JSON.parse((init && init.body) || '{}');
          await new Promise((r) => setTimeout(r, createDelayMs));
          let existing = serverSessions.find((s) => s.clientRequestId === b.clientRequestId);
          if (!existing) {
            const idx = serverSessions.length + 1;
            const sid = '77777777-7777-4777-8777-' + String(idx).padStart(12, '0');
            existing = {
              sessionId: sid,
              visitorToken: 'vtok_' + idx,
              requestId: 'SR-R-' + idx,
              clientRequestId: b.clientRequestId,
              status: 'ai_active'
            };
            serverSessions.push(existing);
            serverMessages.push({ sessionId: sid, clientMsgId: 'init-' + b.clientRequestId, text: b.message });
          }
          if (dropCreateResponseCount > 0) {
            dropCreateResponseCount -= 1;
            throw new TypeError('lost response after server commit');
          }
          return { ok: true, status: 201, json: async () => Object.assign({ ok: true }, existing) };
        }
        if (url.includes('route=session') && !url.includes('route=sessions')) {
          const auth = (init && init.headers && init.headers.Authorization) || '';
          const tok = auth.replace(/^Bearer\s+/, '');
          if (forceGetSession401ForToken && tok === forceGetSession401ForToken) {
            await new Promise((r) => setTimeout(r, 90));
            return { ok: false, status: 401, json: async () => ({ ok: false, error: 'Unauthorized' }) };
          }
          return { ok: true, status: 200, json: async () => ({ ok: true, session: { sessionId: 'ok', status: 'ai_active' } }) };
        }
        if (url.includes('route=messages')) {
          const sp = new URL('http://localhost' + url).searchParams;
          const sid = sp.get('sessionId');
          if (init && init.method === 'POST') {
            const b = JSON.parse(init.body || '{}');
            if (!serverMessages.some((m) => m.sessionId === sid && m.clientMsgId === b.clientMsgId)) {
              serverMessages.push({ sessionId: sid, clientMsgId: b.clientMsgId, text: b.text });
            }
            return { ok: true, status: 201, json: async () => ({ ok: true, persisted: true, sessionStatus: 'ai_active' }) };
          }
          const msgs = serverMessages
            .filter((m) => m.sessionId === sid)
            .map((m, i) => ({ id: 'm-' + (i + 1), seq: i + 1, senderKind: 'visitor', text: m.text, createdAt: new Date().toISOString() }));
          return { ok: true, status: 200, json: async () => ({ ok: true, messages: msgs, hasMore: false }) };
        }
        return { ok: true, status: 200, json: async () => ({ ok: true, posts: [] }) };
      }
    };
    sb.window = sb;
    vm.createContext(sb);
    vm.runInContext(mockSrc, sb);
    vm.runInContext(adapterSrc, sb);
    return sb;
  };

  // Case A: Bidirectional Chat + Contact race delivers BOTH payloads into 1 session
  const sbA = makeTabSandbox();
  const a1 = new sbA.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'race-ab' });
  await a1.init();
  const [chatResA, contactResA] = await Promise.all([
    a1.sendMessage({ text: 'Chat text 1' }),
    a1.submitStructuredInquiry({ message: 'Contact brief 1', roomLabel: '01 Testing', channelSlug: 'contact-scope-form' })
  ]);
  assert.strictEqual(chatResA.ok, true);
  assert.strictEqual(contactResA.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'Chat + Contact race must create ONLY 1 session');
  assert.deepStrictEqual(serverMessages.map((m) => m.text).sort(), ['Chat text 1', 'Contact brief 1']);

  // Reverse direction: Contact starts create POST, Chat submits during flight
  storageMap.clear(); serverSessions = []; serverMessages = [];
  const sbB = makeTabSandbox();
  const a2 = new sbB.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'race-ba' });
  await a2.init();
  const [contactResB, chatResB] = await Promise.all([
    a2.submitStructuredInquiry({ message: 'Contact brief 2', roomLabel: '02 Steel', channelSlug: 'contact-scope-form' }),
    a2.sendMessage({ text: 'Chat text 2' })
  ]);
  assert.strictEqual(contactResB.ok, true);
  assert.strictEqual(chatResB.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'Contact + Chat race must create ONLY 1 session');
  assert.deepStrictEqual(serverMessages.map((m) => m.text).sort(), ['Chat text 2', 'Contact brief 2']);

  // Case B: Edited chat retry after lost response reconciles original create & sends edited draft separately + storage-denied memory retention
  storageMap.clear(); serverSessions = []; serverMessages = [];
  dropCreateResponseCount = 1;
  const sbC = makeTabSandbox();
  const aC = new sbC.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'edit-retry' });
  await aC.init();
  const lostOut = await aC.sendMessage({ text: 'Original draft before timeout' });
  assert.strictEqual(lostOut.ok, false);
  const editedOut = await aC.sendMessage({ text: 'Edited draft after timeout' });
  assert.strictEqual(editedOut.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'Edited retry after ambiguous create must reconcile to 1 session');
  assert.deepStrictEqual(serverMessages.map((m) => m.text), ['Original draft before timeout', 'Edited draft after timeout']);

  // Denied localStorage still retains pending ID & session in memory across retries
  denyStorage = true;
  serverSessions = []; serverMessages = [];
  dropCreateResponseCount = 1;
  const sbDenied = makeTabSandbox();
  const aDenied = new sbDenied.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'denied-ls' });
  await aDenied.init();
  const d1 = await aDenied.createSession({ message: 'Private mode brief' });
  assert.strictEqual(d1.ok, false);
  const d2 = await aDenied.createSession({ message: 'Private mode brief' });
  assert.strictEqual(d2.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'localStorage denied must retain clientRequestId in memory');
  denyStorage = false;

  // Case C: Two existing tabs create 1 session; stale 401 on old token does NOT wipe newer session
  storageMap.clear(); serverSessions = []; serverMessages = [];
  const tab1Listeners = {}; const tab2Listeners = {};
  const sbTab1 = makeTabSandbox(tab1Listeners);
  const sbTab2 = makeTabSandbox(tab2Listeners);
  const tab1 = new sbTab1.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'cross-tab' });
  const tab2 = new sbTab2.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'cross-tab' });
  await Promise.all([tab1.init(), tab2.init()]);
  const [t1Res, t2Res] = await Promise.all([
    tab1.sendMessage({ text: 'From tab 1' }),
    tab2.sendMessage({ text: 'From tab 2' })
  ]);
  assert.strictEqual(t1Res.ok, true);
  assert.strictEqual(t2Res.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'Two open tabs must create ONLY 1 session');
  assert.deepStrictEqual(serverMessages.map((m) => m.text).sort(), ['From tab 1', 'From tab 2']);

  // Stale 401 from vtok_1 after newer session (vtok_2) saved
  const oldGetSessionPromise = (async () => {
    forceGetSession401ForToken = 'vtok_1';
    return tab1.getSession();
  })();
  // Advance into New Session in tab2 cleanly while tab1 getSession 401 is still in flight
  await new Promise((r) => setTimeout(r, 10));
  tab2.clearSession();
  const newTab2Sess = await tab2.createSession({ message: 'Fresh tab 2 session' });
  assert.strictEqual(newTab2Sess.visitorToken, 'vtok_2');
  const stale401Res = await oldGetSessionPromise;
  assert.strictEqual(stale401Res.sessionReset, false);
  const storedAfter401 = JSON.parse(storageMap.get('sr_bridge_session_v1_cross-tab'));
  assert.strictEqual(storedAfter401.sessionId, newTab2Sess.sessionId, 'Stale 401 must NOT erase newer saved session');
  forceGetSession401ForToken = null;

  // Case D: New Session during slow create invalidates late response (no resurrection)
  storageMap.clear(); serverSessions = []; serverMessages = []; createDelayMs = 60;
  const sbD = makeTabSandbox();
  const aD = new sbD.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'reset-gen' });
  await aD.init();
  const slowCreateP = aD.sendMessage({ text: 'Aborted initial draft' });
  await new Promise((r) => setTimeout(r, 15));
  aD.clearSession();
  const lateRes = await slowCreateP;
  assert.strictEqual(lateRes.ok, false);
  assert.strictEqual(lateRes.obsolete, true);
  assert.strictEqual(aD.session, null);
  assert.strictEqual(storageMap.has('sr_bridge_session_v1_reset-gen'), false, 'Reset must prevent late create response from resurrecting session');

  // Case E: Distinct clientMsgId with identical text NOT coalesced
  storageMap.clear(); serverSessions = []; serverMessages = []; createDelayMs = 15;
  const sbE = makeTabSandbox();
  const aE = new sbE.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'distinct-cmsgid' });
  await aE.init();
  await aE.createSession({ message: 'Seed session' });
  const [e1, e2] = await Promise.all([
    aE.sendMessage({ text: 'Same text', clientMsgId: 'cmsgid-alpha' }),
    aE.sendMessage({ text: 'Same text', clientMsgId: 'cmsgid-beta' })
  ]);
  assert.strictEqual(e1.ok, true);
  assert.strictEqual(e2.ok, true);
  assert.ok(serverMessages.some((m) => m.clientMsgId === 'cmsgid-alpha'));
  assert.ok(serverMessages.some((m) => m.clientMsgId === 'cmsgid-beta'));

  // Case F: setItem throws while getItem still returns null -> retains pending create in memory
  let denySetOnly = false;
  const sbF = (() => {
    const ls = {
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => {
        if (denySetOnly) throw new Error('QuotaExceededError');
        storageMap.set(k, String(v));
      },
      removeItem: (k) => storageMap.delete(k)
    };
    const orig = makeTabSandbox();
    orig.localStorage = ls;
    return orig;
  })();
  storageMap.clear(); serverSessions = []; serverMessages = [];
  denySetOnly = true;
  dropCreateResponseCount = 1;
  const aF = new sbF.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'quota-fail' });
  await aF.init();
  const f1 = await aF.createSession({ message: 'Quota test brief' });
  assert.strictEqual(f1.ok, false);
  const f2 = await aF.createSession({ message: 'Quota test brief' });
  assert.strictEqual(f2.ok, true);
  assert.strictEqual(serverSessions.length, 1, 'setItem failure with working getItem must still retain pending clientRequestId');
  denySetOnly = false;

  // Case G: Queued Contact waiting behind Chat create while New Session runs -> returns obsolete after reset
  storageMap.clear(); serverSessions = []; serverMessages = []; createDelayMs = 45;
  const sbG = makeTabSandbox();
  const aG = new sbG.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'queued-reset' });
  await aG.init();
  const chatWaitP = aG.sendMessage({ text: 'First chat before reset' });
  const queuedContactP = aG.submitStructuredInquiry({ message: 'Queued contact before reset', channelSlug: 'contact-scope-form' });
  await new Promise((r) => setTimeout(r, 15));
  aG.clearSession();
  const [wRes, qRes] = await Promise.all([chatWaitP, queuedContactP]);
  assert.strictEqual(wRes.obsolete, true);
  assert.strictEqual(qRes.obsolete, true);
  assert.strictEqual(qRes.ok, false);
  assert.strictEqual(aG.session, null, 'Queued Contact must NOT create/save a session after New Session reset');

  // Case H: Stalled JSON body on POST ?route=messages aborts cleanly under requestTimeoutMs deadline
  storageMap.clear(); serverSessions = []; serverMessages = []; createDelayMs = 5;
  const sbH = makeTabSandbox();
  const origFetchH = sbH.fetch;
  sbH.fetch = async (url, init) => {
    if (url.includes('route=messages') && init && init.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: () => new Promise((_resolve, reject) => {
          if (init && init.signal) {
            if (init.signal.aborted) {
              const e = new Error('aborted');
              e.name = 'AbortError';
              reject(e);
              return;
            }
            init.signal.addEventListener('abort', () => {
              const e = new Error('aborted');
              e.name = 'AbortError';
              reject(e);
            }, { once: true });
          }
        })
      };
    }
    return origFetchH(url, init);
  };
  const aH = new sbH.SourceRatingEmbedAdapter({ bridgeEndpoint: '/api/sr-bridge', workspaceKey: 'stalled-body', requestTimeoutMs: 60 });
  await aH.init();
  await aH.createSession({ message: 'Init body test' });
  const tStart = Date.now();
  const stalledOut = await aH.sendMessage({ text: 'Stalled response body msg' });
  const elapsedMs = Date.now() - tStart;
  assert.strictEqual(stalledOut.ok, false);
  assert.strictEqual(stalledOut.error, 'BRIDGE_TIMEOUT');
  assert.ok(elapsedMs < 1000, 'Stalled JSON body must abort within deadline, got ' + elapsedMs + 'ms');
}

(async () => {
  await testProxyHandler();
  await testAdapterAndMock();
  await testEnquiryHandler();
  await testSingleFlightAndIdempotency();
  await testReviewRegressionCases();
  console.log('PASS: sr-bridge + /api/enquiry + adapter 409/401/offline/mock/501 + single-flight + all 8 Codex P1/P2 invariants');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

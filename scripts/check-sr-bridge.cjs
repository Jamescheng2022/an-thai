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

    // 4. Route & UUID & Size validation
    process.env.SR_BRIDGE_BASE_URL = 'https://sr-staging.example.vercel.app';
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

    // 7. Upstream JSON passes cleanly with headers preserved
    let capturedUrl = '';
    let capturedHeaders = null;
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
      headers: { 'x-turnstile-token': 'tok_123' },
      body: { workspaceKey: 'an-thai-th', message: 'hello' }
    }, res);
    assert.strictEqual(capturedUrl, 'https://sr-staging.example.vercel.app/api/bridge/v1/sessions');
    assert.strictEqual(capturedHeaders['x-turnstile-token'], 'tok_123');
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.requestId, 'SR-OK-1');
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

  const sandbox = {
    window: null,
    console,
    Date,
    Math,
    URLSearchParams,
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
        if (postSessionsCalls === 1) {
          return { ok: false, status: 409, json: async () => ({ ok: false, error: 'IDEMPOTENCY_TOKEN_UNRECOVERABLE' }) };
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({
            ok: true,
            sessionId: '22222222-2222-4222-8222-222222222222',
            visitorToken: 'vtok_live_123',
            requestId: 'SR-20261126-TEST'
          })
        };
      }
      if (url.includes('route=messages')) {
        if (fetchMode === '401') {
          return { ok: false, status: 401, json: async () => ({ ok: false, error: 'Unauthorized' }) };
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

  fetchMode = '401';
  const expiredRes = await liveAdapter.listMessages();
  assert.strictEqual(expiredRes.sessionReset, true);
  assert.strictEqual(liveAdapter.session, null);
}

(async () => {
  await testProxyHandler();
  await testAdapterAndMock();
  console.log('PASS: sr-bridge proxy fail-closed checks + adapter 409/401/offline/mock/PublicPost contract tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

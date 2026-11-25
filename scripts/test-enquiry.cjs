// Offline handler tests: never use the real network or owner credentials.
const assert = require('node:assert/strict');
const {Readable} = require('node:stream');
const handler = require('../api/enquiry.js');
const envKeys = ['RESEND_API_KEY', 'ENQUIRY_FROM_EMAIL', 'ENQUIRY_TO_EMAIL'];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const originalAllowedOrigins = process.env.ENQUIRY_ALLOWED_ORIGINS;
const originalFetch = global.fetch;
const originalNow = Date.now;
const valid = {name: 'Customer 中文', company: 'Example', email: 'customer@example.test',
  phone: '+66 123', requestType: 'Testing instruments', category: 'Load Cells',
  message: '<script>example</script> & details', page: '/zh/contact.html', lang: 'zh-CN', website: '',
  elapsedMs: 5000, enquiryId: '9a37dd02-fc84-4eb1-8590-9fded5af0301'};
let sends = [];
let ipCounter = 0;
function configure() {
  process.env.RESEND_API_KEY = 'test-key-not-real';
  process.env.ENQUIRY_FROM_EMAIL = 'AN-THAI <sender@example.test>';
  process.env.ENQUIRY_TO_EMAIL = 'one@example.test, two@example.test';
  delete process.env.ENQUIRY_ALLOWED_ORIGINS;
  sends = [];
  global.fetch = async (url, options) => {
    sends.push({url, options});
    return {ok: true, json: async () => ({id: 'mock-email-id'})};
  };
}
async function invoke(body = valid, method = 'POST', headers = {}) {
  const req = {method, body, headers: {'content-type': 'application/json', 'x-real-ip': `192.0.${Math.floor(++ipCounter / 256)}.${ipCounter % 256}`, ...headers}};
  const res = {headers: {}, setHeader(key, value) {this.headers[key] = value;},
    status(code) {this.code = code; return this;}, json(value) {this.body = value; return this;}};
  await handler(req, res);
  return res;
}
async function run() {
  configure();
  let res = await invoke();
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, {ok: true});
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].url, 'https://api.resend.com/emails');
  assert.equal(sends[0].options.headers['Idempotency-Key'], valid.enquiryId);
  const mail = JSON.parse(sends[0].options.body);
  assert.deepEqual(mail.to, ['one@example.test', 'two@example.test']);
  assert.equal(mail.reply_to, valid.email);
  assert.equal(mail.html, undefined);
  assert.ok(mail.text.includes(valid.message));
  console.log('PASS valid enquiry -> 200; plain text, recipients and reply_to verified');

  configure();
  for (const field of ['name', 'email', 'message']) {
    assert.equal((await invoke({...valid, [field]: ''})).code, 400);
  }
  assert.equal(sends.length, 0);
  console.log('PASS missing required fields -> 400; no send');

  configure();
  assert.equal((await invoke({website: 'bot'})).code, 200);
  assert.equal(sends.length, 0);
  console.log('PASS honeypot -> silent 200; no send');

  configure();
  for (const key of envKeys) {
    const value = process.env[key];
    delete process.env[key];
    res = await invoke();
    assert.equal(res.code, 503);
    assert.deepEqual(res.body, {ok: false, fallback: 'mailto'});
    process.env[key] = value;
  }
  assert.equal(sends.length, 0);
  console.log('PASS each missing env var -> 503 with mailto fallback');

  configure();
  res = await invoke(undefined, 'GET');
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'POST');
  assert.equal(sends.length, 0);
  console.log('PASS GET -> 405; Allow: POST');

  configure();
  for (const body of [null, [], '{bad json', {...valid, email: 'invalid'},
    {...valid, email: 'customer@example.test\r\nBcc: x@example.test'},
    {...valid, name: 123}, {...valid, message: 'x'.repeat(10001)},
    {...valid, enquiryId: ''}, {...valid, enquiryId: 'not-a-uuid'},
    {...valid, padding: 'x'.repeat(65536)}]) {
    assert.equal((await invoke(body)).code, 400);
  }
  assert.equal((await invoke(valid, 'POST', {'content-type': 'text/plain'})).code, 400);
  assert.equal((await invoke(valid, 'POST', {'content-length': '65536'})).code, 400);
  for (const [field, limit] of Object.entries({name: 200, company: 300, email: 254, phone: 100,
    requestType: 200, category: 300, message: 10000, page: 500, lang: 20, website: 200, enquiryId: 36})) {
    assert.equal((await invoke({...valid, [field]: 'x'.repeat(limit + 1)})).code, 400, field);
  }
  assert.equal(sends.length, 0);
  assert.equal((await invoke(JSON.stringify(valid))).code, 200);
  assert.equal((await invoke(Buffer.from(JSON.stringify(valid)))).code, 200);
  const req = Readable.from([JSON.stringify(valid)]);
  req.method = 'POST'; req.headers = {'content-type': 'application/json'};
  const streamed = {setHeader() {}, status(code) {this.code = code; return this;}, json() {return this;}};
  await handler(req, streamed);
  assert.equal(streamed.code, 200);
  console.log('PASS malformed/type/size/email validation; parsed, string, buffer and stream bodies');

  global.fetch = async () => ({ok: false});
  res = await invoke();
  assert.equal(res.code, 503);
  assert.deepEqual(res.body, {ok: false, fallback: 'mailto'});
  for (const fail of [async () => {throw new Error('private provider detail');},
    async () => ({ok: true, json: async () => ({})})]) {
    global.fetch = fail;
    res = await invoke();
    assert.equal(res.code, 502);
    assert.deepEqual(res.body, {ok: false, uncertain: true});
  }
  console.log('PASS definite provider rejection -> 503; transport/invalid acknowledgement -> uncertain 502');

  configure();
  for (const elapsedMs of [0, -1, 2499.99, undefined, null, '5000', 'invalid', NaN, Infinity]) {
    res = await invoke({...valid, elapsedMs});
    assert.equal(res.code, 400);
    assert.deepEqual(res.body, {ok: false, retry: true});
  }
  assert.equal(sends.length, 0);
  for (const elapsedMs of [2500, 2500.1, 86400001]) assert.equal((await invoke({...valid, elapsedMs})).code, 200);
  // Server wall-clock skew has no bearing on the client-measured duration.
  Date.now = () => originalNow() + 7 * 86400000;
  assert.equal((await invoke()).code, 200);
  Date.now = () => originalNow() - 7 * 86400000;
  assert.equal((await invoke()).code, 200);
  Date.now = originalNow;
  console.log('PASS invalid/under-2500ms elapsed -> retryable 400, no fetch; boundary, >24h and clock skew accepted');

  configure();
  for (const origin of ['https://evil.test','https://an-thai.com.evil.test','https://vercel.app.evil.test',
    'https://vercel.app','null','https://an-thai.com:444','https://an-thai.com/path',
    'https://evil-an-thai.vercel.app','https://an-thai.com.evil.com','https://preview.vercel.app',
    'http://an-thai.com','https://an-thai-abc-other-team.vercel.app',
    'https://an-thai-abc-jamescheng2022s-projects.vercel.app.evil.com']) {
    assert.equal((await invoke(valid, 'POST', {origin})).code, 403);
  }
  assert.equal(sends.length, 0);
  for (const origin of ['https://an-thai.com','https://www.an-thai.com','https://an-thai.vercel.app',
    'https://an-thai-abc123-jamescheng2022s-projects.vercel.app']) {
    assert.equal((await invoke(valid, 'POST', {origin})).code, 200);
  }
  configure();
  process.env.ENQUIRY_ALLOWED_ORIGINS = ' https://custom.example.test, https://second.example.test:8443 ';
  for (const origin of ['https://custom.example.test.evil.com','https://custom.example.test/path',
    'https://other.example.test','https://second.example.test']) {
    assert.equal((await invoke(valid, 'POST', {origin})).code, 403);
  }
  assert.equal(sends.length, 0);
  for (const origin of ['https://custom.example.test','https://second.example.test:8443']) {
    assert.equal((await invoke(valid, 'POST', {origin})).code, 200);
  }
  console.log('PASS exact production/project/team-preview and optional origins; unrelated origins reject without fetch');

  configure();
  let now = originalNow();
  Date.now = () => now;
  const headers = {'x-forwarded-for': '203.0.113.10, 203.0.113.99', 'x-real-ip': '203.0.113.20'};
  const send = () => invoke(valid, 'POST', headers);
  for (let i = 0; i < 3; i++) assert.equal((await send()).code, 200);
  assert.equal((await send()).code, 429);
  assert.equal(sends.length, 3);
  // Changing the second forwarded address or real IP cannot bypass the first IP limit.
  assert.equal((await invoke(valid, 'POST',
    {'x-forwarded-for': '203.0.113.10, 203.0.113.88'})).code, 429);
  assert.equal(sends.length, 3);
  for (let i = 3; i < 10; i++) {
    now += 600000;
    assert.equal((await send()).code, 200);
  }
  now += 600000;
  assert.equal((await send()).code, 429);
  assert.equal(sends.length, 10);
  now += 86400000;
  assert.equal((await send()).code, 200);
  assert.equal(sends.length, 11);
  const realHeaders = {'x-real-ip': '203.0.113.30'};
  for (let i = 0; i < 3; i++) assert.equal((await invoke(valid, 'POST', realHeaders)).code, 200);
  assert.equal((await invoke(valid, 'POST', realHeaders)).code, 429);
  assert.equal(sends.length, 14);
  Date.now = originalNow;
  console.log('PASS first forwarded IP and real-IP fallback: 3/10min, 10/day, expiry; rejected requests never fetch');

  configure();
  for (const character of ['中', 'ก']) {
    const body = {...valid, message: character.repeat(10000)};
    assert.equal((await invoke(body)).code, 200);
    assert.equal(JSON.parse(sends.at(-1).options.body).text.includes(body.message), true);
  }
  assert.equal(sends.length, 2);
  assert.equal((await invoke({...valid, padding: '中'.repeat(23000)})).code, 400);
  assert.equal(sends.length, 2);
  // Identical retries use exactly the same provider idempotency key and email payload.
  await invoke(valid); await invoke(valid);
  assert.equal(sends.at(-1).options.headers['Idempotency-Key'], sends.at(-2).options.headers['Idempotency-Key']);
  assert.equal(sends.at(-1).options.body, sends.at(-2).options.body);
  console.log('PASS 10,000-character Chinese and Thai messages; over-64KiB rejection; stable Resend retry key');
  console.log('All enquiry handler tests passed. No real email sent.');
}
run().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {
  global.fetch = originalFetch;
  Date.now = originalNow;
  if (originalAllowedOrigins === undefined) delete process.env.ENQUIRY_ALLOWED_ORIGINS;
  else process.env.ENQUIRY_ALLOWED_ORIGINS = originalAllowedOrigins;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

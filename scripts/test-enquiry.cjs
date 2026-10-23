// Offline handler tests: never use the real network or owner credentials.
const assert = require('node:assert/strict');
const {Readable} = require('node:stream');
const handler = require('../api/enquiry.js');
const envKeys = ['RESEND_API_KEY', 'ENQUIRY_FROM_EMAIL', 'ENQUIRY_TO_EMAIL'];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const originalFetch = global.fetch;
const valid = {name: 'Customer 中文', company: 'Example', email: 'customer@example.test',
  phone: '+66 123', requestType: 'Testing instruments', category: 'Load Cells',
  message: '<script>example</script> & details', page: '/zh/contact.html', lang: 'zh-CN', website: ''};
let sends = [];
function configure() {
  process.env.RESEND_API_KEY = 'test-key-not-real';
  process.env.ENQUIRY_FROM_EMAIL = 'AN-THAI <sender@example.test>';
  process.env.ENQUIRY_TO_EMAIL = 'one@example.test, two@example.test';
  sends = [];
  global.fetch = async (url, options) => {
    sends.push({url, options});
    return {ok: true, json: async () => ({id: 'mock-email-id'})};
  };
}
async function invoke(body = valid, method = 'POST', headers = {}) {
  const req = {method, body, headers: {'content-type': 'application/json', ...headers}};
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
    {...valid, padding: 'x'.repeat(21000)}]) {
    assert.equal((await invoke(body)).code, 400);
  }
  assert.equal((await invoke(valid, 'POST', {'content-type': 'text/plain'})).code, 400);
  assert.equal((await invoke(valid, 'POST', {'content-length': '20480'})).code, 400);
  for (const [field, limit] of Object.entries({name: 200, company: 300, email: 254, phone: 100,
    requestType: 200, category: 300, message: 10000, page: 500, lang: 20, website: 200})) {
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

  for (const fail of [async () => ({ok: false}), async () => {throw new Error('private provider detail');},
    async () => ({ok: true, json: async () => ({})})]) {
    global.fetch = fail;
    res = await invoke();
    assert.equal(res.code, 503);
    assert.deepEqual(res.body, {ok: false, fallback: 'mailto'});
  }
  console.log('PASS provider rejection/network/invalid acknowledgement -> generic 503');
  console.log('All enquiry handler tests passed. No real email sent.');
}
run().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {
  global.fetch = originalFetch;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

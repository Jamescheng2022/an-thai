// Dependency-free Vercel Node handler. Never log enquiry content or provider errors.
const {isIP} = require('node:net');
const MAX_BODY = 64 * 1024;
const LIMITS = {name: 200, company: 300, email: 254, phone: 100, requestType: 200,
  category: 300, message: 10000, page: 500, lang: 20, website: 200, enquiryId: 36};
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY = 24 * 60 * 60 * 1000;
// Per-instance, best-effort only: cold starts and other instances have separate limits.
const attempts = new Map();
function rateLimited(req, now) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const real = String(req.headers['x-real-ip'] || '').trim();
  const ip = isIP(forwarded) ? forwarded : isIP(real) ? real : 'unknown';
  for (const [address, times] of attempts) {
    const recent = times.filter(time => now - time < DAY);
    if (recent.length) attempts.set(address, recent);
    else attempts.delete(address);
  }
  const times = attempts.get(ip) || [];
  if (times.length >= 10 || times.filter(time => now - time < 10 * 60 * 1000).length >= 3 ||
    (!attempts.has(ip) && attempts.size >= 10000)) return true;
  times.push(now);
  attempts.set(ip, times);
  return false;
}
function allowedOrigin(origin) {
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === origin && !url.port &&
      (url.hostname === 'an-thai.com' || url.hostname === 'www.an-thai.com' || url.hostname.endsWith('.vercel.app'));
  } catch { return false; }
}

async function readBody(req) {
  if (Number(req.headers['content-length']) >= MAX_BODY) throw new Error('Invalid body');
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size >= MAX_BODY) throw new Error('Invalid body');
      chunks.push(bytes);
    }
    body = Buffer.concat(chunks);
  }
  const raw = Buffer.isBuffer(body) ? body.toString('utf8') :
    typeof body === 'string' ? body : JSON.stringify(body);
  if (!raw || Buffer.byteLength(raw, 'utf8') >= MAX_BODY) throw new Error('Invalid body');
  return JSON.parse(raw);
}

module.exports = async function enquiry(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ok: false});
  }
  if (req.headers.origin !== undefined && !allowedOrigin(req.headers.origin)) {
    return res.status(403).json({ok: false});
  }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
    return res.status(400).json({ok: false});
  }
  let data;
  try {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
    data = {};
    for (const [key, limit] of Object.entries(LIMITS)) {
      const value = body[key] === undefined ? '' : body[key];
      if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid field');
      data[key] = value.trim();
    }
    if (data.website) return res.status(200).json({ok: true});
    const age = Date.now() - body.renderedAt;
    if (!Number.isSafeInteger(body.renderedAt) || age < 3000 || age > DAY) {
      return res.status(200).json({ok: true});
    }
    if (!data.name || !data.message || !EMAIL.test(data.email) || !UUID.test(data.enquiryId)) throw new Error('Invalid field');
  } catch {
    return res.status(400).json({ok: false});
  }
  if (rateLimited(req, Date.now())) return res.status(429).json({ok: false});

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ENQUIRY_FROM_EMAIL?.trim();
  const to = (process.env.ENQUIRY_TO_EMAIL || '').split(',').map(value => value.trim()).filter(Boolean);
  const unavailable = () => res.status(503).json({ok: false, fallback: 'mailto'});
  if (!key || !from || !to.length || !to.every(value => EMAIL.test(value))) return unavailable();
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': data.enquiryId},
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from, to, reply_to: data.email, subject: 'AN-THAI website enquiry',
        // Plain text only: user input is never interpreted as HTML or email headers.
        text: ['name', 'company', 'email', 'phone', 'requestType', 'category', 'page', 'lang', 'message']
          .map(field => `${field}: ${data[field]}`).join('\n\n')
      })
    });
    if (!response.ok) return unavailable();
    const result = await response.json();
    if (!result?.id) return res.status(502).json({ok: false, uncertain: true});
    return res.status(200).json({ok: true});
  } catch {
    // A timeout/transport error may occur after Resend accepted the email.
    return res.status(502).json({ok: false, uncertain: true});
  }
};

// Dependency-free Vercel Node handler. Never log enquiry content or provider errors.
const MAX_BODY = 20 * 1024;
const LIMITS = {name: 200, company: 300, email: 254, phone: 100, requestType: 200,
  category: 300, message: 10000, page: 500, lang: 20, website: 200};
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

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
    if (!data.name || !data.message || !EMAIL.test(data.email)) throw new Error('Invalid field');
  } catch {
    return res.status(400).json({ok: false});
  }

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ENQUIRY_FROM_EMAIL?.trim();
  const to = (process.env.ENQUIRY_TO_EMAIL || '').split(',').map(value => value.trim()).filter(Boolean);
  const unavailable = () => res.status(503).json({ok: false, fallback: 'mailto'});
  if (!key || !from || !to.length || !to.every(value => EMAIL.test(value))) return unavailable();
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json'},
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
    if (!result?.id) return unavailable();
    return res.status(200).json({ok: true});
  } catch {
    return unavailable();
  }
};

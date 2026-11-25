/**
 * Vercel Serverless Function: GET/POST /api/inquiry (V1.0 Hardened)
 * - GET: returns non-secret readiness status so frontend honestly hides/downgrades
 *        server submission when RESEND_API_KEY / INQUIRY_WEBHOOK_URL are not configured.
 * - POST: safe JSON.parse, 16 KB cap, field length bounds, honeypot (`website_url`),
 *         503 when unconfigured, optional Resend/webhook forwarding.
 */
const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 5;
const ipHits = new Map();

function makeReceiptId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ANTHAI-RFQ-${d}-${rand}`;
}

export default async function handler(req, res) {
  const resendKey = process.env.RESEND_API_KEY || '';
  const webhookUrl = process.env.INQUIRY_WEBHOOK_URL || '';
  const storeWebhookUrl = process.env.INQUIRY_STORE_WEBHOOK_URL || '';
  const toEmail = process.env.INQUIRY_TO_EMAIL || 'info@an-thai.com';

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      configured: Boolean(resendKey || webhookUrl),
      backend: resendKey ? 'resend' : (webhookUrl ? 'webhook' : 'unconfigured'),
      recipient: toEmail
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
  }
  hits.push(now);
  ipHits.set(ip, hits);

  let body;
  try {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
      }
      body = JSON.parse(req.body || '{}');
    } else {
      body = req.body || {};
    }
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
  }

  // Unified honeypot check (matches frontend `website_url`)
  if (String(body.website_url || '').trim()) {
    return res.status(200).json({ ok: true, status: 'filtered', requestId: 'FILTERED' });
  }

  const contact = String(body.contact || '').trim();
  const notes = String(body.notes || '').trim();
  const route = String(body.route || 'General').trim();
  const location = String(body.location || '').trim();
  const scale = String(body.scale || '').trim();
  const sourceUrl = String(body.sourceUrl || '').trim();

  if (
    !contact || !notes ||
    contact.length > 200 || notes.length > 4000 ||
    route.length > 120 || location.length > 200 ||
    scale.length > 200 || sourceUrl.length > 500
  ) {
    return res.status(400).json({ ok: false, error: 'VALIDATION_FAILED' });
  }

  if (!resendKey && !webhookUrl) {
    return res.status(503).json({ ok: false, error: 'INQUIRY_BACKEND_UNCONFIGURED' });
  }

  const requestId = makeReceiptId();
  const receivedAt = new Date().toISOString();
  let providerMessageId = null;
  let persistedToStore = false;

  try {
    if (resendKey) {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.INQUIRY_FROM_EMAIL || 'AN-THAI Website <noreply@an-thai.com>',
          to: [toEmail],
          subject: `[${requestId}] ${route}`,
          text: `Reference: ${requestId}
Received: ${receivedAt}
Unit: ${route}
Location: ${location}
Scale: ${scale}
Contact: ${contact}
Source: ${sourceUrl}

Requirements:
${notes}`
        })
      });
      if (!mailRes.ok) throw new Error(`RESEND_HTTP_${mailRes.status}`);
      const mailJson = await mailRes.json().catch(() => ({}));
      providerMessageId = mailJson.id || null;
    } else if (webhookUrl) {
      const whRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, receivedAt, route, location, scale, contact, notes, sourceUrl })
      });
      if (!whRes.ok) throw new Error(`WEBHOOK_HTTP_${whRes.status}`);
    }

    if (storeWebhookUrl) {
      try {
        const stRes = await fetch(storeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, receivedAt, status: 'accepted_for_delivery', providerMessageId, route, location, scale, contact })
        });
        persistedToStore = stRes.ok;
      } catch (storeErr) {
        console.error('[AN-THAI /api/inquiry store error]', storeErr);
        persistedToStore = false;
      }
    }

    return res.status(200).json({
      ok: true,
      status: 'accepted_for_delivery',
      requestId,
      providerMessageId,
      persistedToStore
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'UPSTREAM_DELIVERY_FAILED', detail: err.message });
  }
}

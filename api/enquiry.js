/**
 * Vercel Serverless Function: GET/POST /api/enquiry (V1.1 Resend Backup & Notification Channel)
 * - Primary channel is SourceRating I-4 (/api/sr-bridge); /api/enquiry serves as:
 *   1) automatic backup delivery when SourceRating is unavailable (503/302/timeout/network error),
 *   2) optional non-blocking email notification when RESEND_API_KEY is configured.
 * - Fails closed (HTTP 503, delivered: false) when RESEND_API_KEY is missing; never claims fake delivery.
 * - Supports both PR #13 env names (ENQUIRY_FROM_EMAIL / ENQUIRY_TO_EMAIL) and V1.0 names (INQUIRY_*).
 */
const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 10;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const ipHits = new Map();

function makeReceiptId(prefix = 'ANTHAI-RESEND') {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${d}-${rand}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const webhookUrl = (process.env.INQUIRY_WEBHOOK_URL || '').trim();
  const fromEmail = (
    process.env.ENQUIRY_FROM_EMAIL ||
    process.env.INQUIRY_FROM_EMAIL ||
    'AN-THAI Website <enquiry@an-thai.com>'
  ).trim();
  const toRaw = (
    process.env.ENQUIRY_TO_EMAIL ||
    process.env.INQUIRY_TO_EMAIL ||
    'info@an-thai.com'
  ).trim();
  const toEmails = toRaw.split(',').map((s) => s.trim()).filter((s) => EMAIL_RE.test(s));

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: Boolean((resendKey && toEmails.length > 0) || webhookUrl),
      backend: resendKey ? 'resend' : (webhookUrl ? 'webhook' : 'unconfigured'),
      recipientCount: toEmails.length,
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, delivered: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, delivered: false, error: 'PAYLOAD_TOO_LARGE' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    return res.status(429).json({ ok: false, delivered: false, error: 'RATE_LIMITED' });
  }
  hits.push(now);
  ipHits.set(ip, hits);

  let body;
  try {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ ok: false, delivered: false, error: 'PAYLOAD_TOO_LARGE' });
      }
      body = JSON.parse(req.body || '{}');
    } else {
      body = req.body || {};
    }
  } catch {
    return res.status(400).json({ ok: false, delivered: false, error: 'INVALID_JSON' });
  }

  if (String(body.website_url || '').trim()) {
    return res.status(200).json({ ok: true, delivered: false, status: 'filtered', requestId: 'FILTERED' });
  }

  const contact = String(body.contact || '').trim();
  const notes = String(body.notes || '').trim();
  const route = String(body.route || 'General').trim();
  const location = String(body.location || '').trim();
  const scale = String(body.scale || '').trim();
  const sourceUrl = String(body.sourceUrl || '').trim();
  const lang = String(body.lang || '').trim().slice(0, 12);
  const mode = String(body.mode || 'backup').trim();
  const srRequestId = String(body.srRequestId || '').trim().slice(0, 64);

  if (
    !contact || !notes ||
    contact.length > 200 || notes.length > 4000 ||
    route.length > 120 || location.length > 200 ||
    scale.length > 200 || sourceUrl.length > 500
  ) {
    return res.status(400).json({ ok: false, delivered: false, error: 'VALIDATION_FAILED' });
  }

  if ((!resendKey || toEmails.length === 0) && !webhookUrl) {
    return res.status(503).json({
      ok: false,
      configured: false,
      delivered: false,
      fallback: 'direct_channels',
      error: 'RESEND_UNCONFIGURED',
    });
  }

  const requestId = makeReceiptId(mode === 'sr_notification' ? 'ANTHAI-NOTIFY' : 'ANTHAI-RESEND');
  const receivedAt = new Date().toISOString();
  const subjectPrefix = mode === 'sr_notification' && srRequestId
    ? `[SR Notification ${srRequestId}]`
    : `[Resend Backup ${requestId}]`;

  try {
    let providerMessageId = null;
    if (resendKey && toEmails.length > 0) {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          from: fromEmail,
          to: toEmails,
          subject: `${subjectPrefix} ${route}`,
          text: [
            `Reference: ${requestId}`,
            srRequestId ? `SourceRating Ref: ${srRequestId}` : '',
            `Channel Mode: ${mode}`,
            `Received: ${receivedAt}`,
            `Language: ${lang || 'unknown'}`,
            `Unit: ${route}`,
            `Location: ${location || 'Not specified'}`,
            `Scale: ${scale || 'Not specified'}`,
            `Contact: ${contact}`,
            `Source URL: ${sourceUrl || 'Not specified'}`,
            '',
            'Requirements:',
            notes,
          ].filter(Boolean).join('\n'),
        }),
      });
      if (!mailRes.ok) {
        return res.status(502).json({
          ok: false,
          delivered: false,
          fallback: 'direct_channels',
          error: `RESEND_HTTP_${mailRes.status}`,
        });
      }
      const mailJson = await mailRes.json().catch(() => ({}));
      if (!mailJson || !mailJson.id) {
        return res.status(502).json({
          ok: false,
          delivered: false,
          fallback: 'direct_channels',
          error: 'RESEND_UNCERTAIN_RESPONSE',
        });
      }
      providerMessageId = mailJson.id;
    } else if (webhookUrl) {
      const whRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ requestId, mode, srRequestId, receivedAt, route, location, scale, contact, notes, sourceUrl }),
      });
      if (!whRes.ok) {
        return res.status(502).json({
          ok: false,
          delivered: false,
          fallback: 'direct_channels',
          error: `WEBHOOK_HTTP_${whRes.status}`,
        });
      }
    }

    return res.status(200).json({
      ok: true,
      delivered: true,
      status: 'accepted_for_delivery',
      backend: resendKey ? 'resend' : 'webhook',
      requestId,
      providerMessageId,
    });
  } catch {
    return res.status(502).json({
      ok: false,
      delivered: false,
      fallback: 'direct_channels',
      error: 'RESEND_TRANSPORT_ERROR',
    });
  }
}

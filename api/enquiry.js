/**
 * Vercel Serverless Function: GET/POST /api/enquiry (V1.1 Resend Backup & Notification Channel)
 * - Primary channel is SourceRating I-4 (/api/sr-bridge); /api/enquiry serves as:
 *   1) automatic backup email acceptance via Resend when SourceRating is unavailable,
 *   2) optional non-blocking email notification when RESEND_API_KEY and explicit routing env vars are configured.
 * - Fails closed (HTTP 503, delivered: false) if RESEND_API_KEY, sender, or recipient env vars are missing;
 *   never falls back to hard-coded addresses or claims delivery without a verified Resend message id.
 */
const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 10;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const FROM_HEADER_RE = /^[^<>]*<\s*([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)\s*>$/;
const ipHits = new Map();

function makeReceiptId(prefix = 'ANTHAI-RESEND') {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${d}-${rand}`;
}

function isValidFromAddress(raw) {
  if (!raw || /[\r\n]/.test(raw)) return false;
  if (EMAIL_RE.test(raw)) return true;
  const m = raw.match(FROM_HEADER_RE);
  return Boolean(m && EMAIL_RE.test(m[1]));
}

function stripHeaderBreaks(val) {
  return String(val || '').replace(/[\r\n]+/g, ' ').trim();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.ENQUIRY_FROM_EMAIL || process.env.INQUIRY_FROM_EMAIL || '').trim();
  const toRaw = (process.env.ENQUIRY_TO_EMAIL || process.env.INQUIRY_TO_EMAIL || '').trim();
  const toEmails = toRaw.split(',').map((s) => s.trim()).filter((s) => EMAIL_RE.test(s));
  const isResendConfigured = Boolean(resendKey && isValidFromAddress(fromEmail) && toEmails.length > 0);

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: isResendConfigured,
      backend: isResendConfigured ? 'resend' : 'unconfigured',
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
    let rawForSize;
    if (typeof req.body === 'string') {
      rawForSize = req.body;
      if (Buffer.byteLength(rawForSize, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ ok: false, delivered: false, error: 'PAYLOAD_TOO_LARGE' });
      }
      body = JSON.parse(rawForSize || '{}');
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
      rawForSize = JSON.stringify(body);
      if (Buffer.byteLength(rawForSize, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ ok: false, delivered: false, error: 'PAYLOAD_TOO_LARGE' });
      }
    } else if (req.body === undefined) {
      body = {};
    } else {
      return res.status(400).json({ ok: false, delivered: false, error: 'INVALID_JSON_OBJECT' });
    }
  } catch {
    return res.status(400).json({ ok: false, delivered: false, error: 'INVALID_JSON' });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ ok: false, delivered: false, error: 'INVALID_JSON_OBJECT' });
  }

  if (String(body.website_url || '').trim()) {
    return res.status(200).json({ ok: true, delivered: false, status: 'filtered', requestId: 'FILTERED' });
  }

  const contact = stripHeaderBreaks(body.contact);
  const notes = String(body.notes || '').trim();
  const route = stripHeaderBreaks(body.route || 'General') || 'General';
  const location = stripHeaderBreaks(body.location);
  const scale = stripHeaderBreaks(body.scale);
  const sourceUrl = stripHeaderBreaks(body.sourceUrl);
  const lang = stripHeaderBreaks(body.lang).slice(0, 12);
  const mode = stripHeaderBreaks(body.mode || 'backup');
  const srRequestId = stripHeaderBreaks(body.srRequestId).slice(0, 64);

  if (
    !contact || !notes ||
    contact.length > 200 || notes.length > 4000 ||
    route.length > 120 || location.length > 200 ||
    scale.length > 200 || sourceUrl.length > 500
  ) {
    return res.status(400).json({ ok: false, delivered: false, error: 'VALIDATION_FAILED' });
  }

  if (!isResendConfigured) {
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
    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      redirect: 'manual',
      signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(8000)
        : undefined,
      body: JSON.stringify({
        from: fromEmail,
        to: toEmails,
        subject: `${subjectPrefix} ${route}`.slice(0, 200),
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
    const mailJson = await mailRes.json().catch(() => null);
    if (!mailJson || !mailJson.id) {
      return res.status(502).json({
        ok: false,
        delivered: false,
        fallback: 'direct_channels',
        error: 'RESEND_UNCERTAIN_RESPONSE',
      });
    }

    return res.status(200).json({
      ok: true,
      delivered: true,
      status: 'accepted_for_delivery',
      backend: 'resend',
      requestId,
      providerMessageId: mailJson.id,
    });
  } catch (err) {
    const isTimeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return res.status(isTimeout ? 504 : 502).json({
      ok: false,
      delivered: false,
      fallback: 'direct_channels',
      error: isTimeout ? 'RESEND_TIMEOUT' : 'RESEND_TRANSPORT_ERROR',
    });
  }
}

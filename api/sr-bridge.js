/**
 * Vercel Serverless Function: Same-origin SourceRating I-4 Bridge Gateway (V1.1 Staging)
 * - Strictly fails closed if SR_BRIDGE_BASE_URL points to production Supabase/unapproved targets
 *   or if Vercel Deployment Protection returns 301/302/307/308 or HTML SSO login walls.
 * - Never embeds deployment bypass secrets or auto-disables deployment protection.
 */
const MAX_BODY_BYTES = 16 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ROUTES = new Set(['health', 'sessions', 'session', 'messages', 'claim', 'claim_confirm', 'posts']);

function isRejectedBaseUrl(rawUrl) {
  if (!rawUrl) return true;
  if (/qnozpurjtgkmwtvsrjoi/i.test(rawUrl)) return true;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const rawBaseUrl = (process.env.SR_BRIDGE_BASE_URL || '').trim().replace(/\/$/, '');
  const isProdRuntime = process.env.VERCEL_ENV === 'production' && process.env.ALLOW_SR_BRIDGE_IN_PROD !== 'true';
  if (isProdRuntime || !rawBaseUrl || isRejectedBaseUrl(rawBaseUrl)) {
    return res.status(503).json({
      ok: false,
      configured: false,
      bridgeMode: 'unconfigured',
      upstreamProtected: Boolean(rawBaseUrl),
      error: isProdRuntime ? 'BRIDGE_DISABLED_IN_V1_PROD' : 'SR_BRIDGE_BASE_URL_UNCONFIGURED',
    });
  }

  const reqUrl = new URL(req.url || '/', 'http://localhost');
  const route = (reqUrl.searchParams.get('route') || '').trim();
  if (!ALLOWED_ROUTES.has(route)) {
    return res.status(400).json({ ok: false, error: 'INVALID_BRIDGE_ROUTE' });
  }

  let targetPath = '';
  const sessionId = (reqUrl.searchParams.get('sessionId') || '').trim();
  const orgId = (reqUrl.searchParams.get('organizationId') || '').trim();
  const workspaceKey = (reqUrl.searchParams.get('workspaceKey') || '').trim();
  const afterSeq = Math.max(0, Number.parseInt(reqUrl.searchParams.get('afterSeq') || '0', 10) || 0);
  const limit = Math.min(50, Math.max(1, Number.parseInt(reqUrl.searchParams.get('limit') || '50', 10) || 50));

  if (route === 'health') {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    const qs = new URLSearchParams();
    if (workspaceKey) qs.set('workspaceKey', workspaceKey);
    targetPath = `/api/bridge/v1/health${qs.toString() ? `?${qs.toString()}` : ''}`;
  } else if (route === 'sessions') {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    targetPath = '/api/bridge/v1/sessions';
  } else if (route === 'session') {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    if (!UUID_RE.test(sessionId)) return res.status(400).json({ ok: false, error: 'INVALID_SESSION_ID' });
    targetPath = `/api/bridge/v1/sessions/${encodeURIComponent(sessionId)}`;
  } else if (route === 'messages') {
    if (!UUID_RE.test(sessionId)) return res.status(400).json({ ok: false, error: 'INVALID_SESSION_ID' });
    if (req.method === 'GET') {
      targetPath = `/api/bridge/v1/sessions/${encodeURIComponent(sessionId)}/messages?afterSeq=${afterSeq}&limit=${limit}`;
    } else if (req.method === 'POST') {
      targetPath = `/api/bridge/v1/sessions/${encodeURIComponent(sessionId)}/messages`;
    } else {
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    }
  } else if (route === 'claim' || route === 'claim_confirm') {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    if (!UUID_RE.test(sessionId)) return res.status(400).json({ ok: false, error: 'INVALID_SESSION_ID' });
    targetPath = `/api/bridge/v1/sessions/${encodeURIComponent(sessionId)}/${route === 'claim' ? 'claim' : 'claim/confirm'}`;
  } else if (route === 'posts') {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    if (orgId && !UUID_RE.test(orgId)) return res.status(400).json({ ok: false, error: 'INVALID_ORG_ID' });
    const qs = new URLSearchParams();
    if (orgId) qs.set('organizationId', orgId);
    targetPath = `/api/bridge/v1/posts${qs.toString() ? `?${qs.toString()}` : ''}`;
  }

  let bodyStr;
  if (req.method === 'POST') {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return res.status(413).json({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
    }
    bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (Buffer.byteLength(bodyStr, 'utf8') > MAX_BODY_BYTES) {
      return res.status(413).json({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
    }
  }

  const fwdHeaders = { Accept: 'application/json' };
  const bypassSecret = (process.env.SR_VERCEL_PROTECTION_BYPASS || '').trim();
  if (!isProdRuntime && bypassSecret) {
    fwdHeaders['x-vercel-protection-bypass'] = bypassSecret;
    fwdHeaders['x-vercel-set-bypass-cookie'] = 'false';
  }
  const reqOrigin = req.headers.origin
    || (req.headers.host ? `https://${String(req.headers.host).replace(/^https?:\/\//i, '')}` : '')
    || (process.env.VERCEL_URL ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//i, '')}` : '');
  if (reqOrigin) fwdHeaders.Origin = String(reqOrigin);
  if (req.headers.referer) fwdHeaders.Referer = String(req.headers.referer);
  if (req.headers.authorization) fwdHeaders.Authorization = String(req.headers.authorization);
  if (req.headers['x-bridge-challenge']) fwdHeaders['x-bridge-challenge'] = String(req.headers['x-bridge-challenge']);
  if (req.headers['x-turnstile-token']) fwdHeaders['x-turnstile-token'] = String(req.headers['x-turnstile-token']);
  if (req.method === 'POST') fwdHeaders['Content-Type'] = 'application/json';

  try {
    const upstreamRes = await fetch(rawBaseUrl + targetPath, {
      method: req.method,
      headers: fwdHeaders,
      body: bodyStr,
      redirect: 'manual',
    });

    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      return res.status(503).json({
        ok: false,
        configured: false,
        bridgeMode: 'unconfigured',
        upstreamProtected: true,
        error: 'SR_STAGING_DEPLOYMENT_PROTECTED_302',
      });
    }

    const ct = (upstreamRes.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      return res.status(503).json({
        ok: false,
        configured: false,
        bridgeMode: 'unconfigured',
        upstreamProtected: true,
        error: 'SR_STAGING_NON_JSON_RESPONSE',
      });
    }

    const data = await upstreamRes.json().catch(() => null);
    if (!data) {
      return res.status(502).json({ ok: false, error: 'UPSTREAM_INVALID_JSON' });
    }
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(503).json({
      ok: false,
      configured: false,
      bridgeMode: 'unconfigured',
      error: 'SR_STAGING_UNREACHABLE',
    });
  }
}

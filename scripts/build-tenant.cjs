#!/usr/bin/env node
'use strict';

/**
 * Multi-tenant static replica builder using the An-Thai V1.1 website template.
 * Generates a strictly isolated, noindex, non-production tenant site solely from JSON config.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cfgIdx = args.indexOf('--config');
const outIdx = args.indexOf('--out');
const root = path.resolve(__dirname, '..');
const cfgPath = path.resolve(root, cfgIdx >= 0 ? args[cfgIdx + 1] : 'config/tenants/test-demo.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const workspaceKey = (cfg.sourceRating && cfg.sourceRating.workspaceKey) || cfg.workspaceKey || cfg.tenantSlug;
const rawOutArg = outIdx >= 0 ? args[outIdx + 1] : `dist-${cfg.tenantSlug}`;
const outDir = path.resolve(root, rawOutArg);

const relOut = path.relative(root, outDir);
if (
  !relOut ||
  relOut.startsWith('..') ||
  path.isAbsolute(relOut) ||
  path.dirname(outDir) !== root ||
  !/^dist-[a-z0-9][a-z0-9-]*$/i.test(path.basename(outDir))
) {
  throw new Error(`Refusing unsafe --out path (must be a dist-<slug> child of workspace): ${outDir}`);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeJsonForScript(val) {
  return JSON.stringify(val)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function sanitizeTenantAssetContent(content) {
  const safeHost = `${cfg.tenantSlug}.invalid`;
  const replacements = [
    [/https?:\/\/(?:www\.)?an-thai\.com/gi, `https://${safeHost}`],
    [/info@an-thai\.com/gi, cfg.directEmail],
    [/an-thai\.com/gi, safeHost],
    [/\+?66\s*90\s*292\s*1749/g, cfg.directPhone],
    [/66902921749/g, cfg.directPhone.replace(/[^\d]/g, '') || '0000000000'],
    [/https?:\/\/line\.me\/ti\/p\/p0_XsfILmH/gi, '#test-line-disabled'],
    [/p0_XsfILmH/g, 'TEST-LINE-DISABLED'],
    [/James2021/g, 'TEST-WECHAT-DISABLED'],
    [/1339 Arwan Building[^"'\n]*/g, cfg.officeAddress],
    [/Arwan Building/g, cfg.officeAddress],
    [/AN-THAI Engineering Company Limited/gi, cfg.legalName],
    [/AN-THAI Engineering Co\.,?\s*Ltd\.?/gi, cfg.legalName],
    [/AN-THAI Engineering/gi, cfg.legalName],
    [/AN-THAI/gi, cfg.brandShort],
    [/บริษัท\s*อัน-ไทย\s*เอ็นจิเนียริ่ง\s*จำกัด/g, cfg.legalName],
    [/บริษัท\s*อัน-ไทย\s*เอ็นจิเนียริ่ง/g, cfg.legalName],
    [/อัน-ไทย/g, cfg.brandShort],
    [/安泰工程有限公司/g, cfg.legalName],
    [/安泰工程/g, cfg.brandShort],
    [/安泰/g, cfg.brandShort],
    [/an-thai-th/g, workspaceKey],
    [/\bPACO\b/g, 'TEST-REF-A'],
    [/\bROGE\b/g, 'TEST-REF-B'],
  ];
  let out = content;
  for (const [re, sub] of replacements) {
    out = out.replace(re, sub);
  }
  return out;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'assets/css'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets/js'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets/images'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets/themes'), { recursive: true });

const themeManifest = JSON.parse(fs.readFileSync(path.join(root, 'themes/manifest.json'), 'utf8'));
const validThemeIds = new Set(themeManifest.presets.map((p) => p.id));
const activeTheme = cfg.theme && validThemeIds.has(cfg.theme) ? cfg.theme : 'default';

if (fs.existsSync(path.join(root, 'assets/themes'))) {
  fs.cpSync(path.join(root, 'assets/themes'), path.join(outDir, 'assets/themes'), { recursive: true });
}

for (const f of ['assets/css/styles.css']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    let cssText = sanitizeTenantAssetContent(fs.readFileSync(src, 'utf8'));
    cssText += `\n/* anthai-themes-bundled:v${themeManifest.version} */\n:root{--thb:1;}\n`;
    for (const p of themeManifest.presets) {
      cssText += `\n/* preset:${p.id} */\n` + sanitizeTenantAssetContent(fs.readFileSync(path.join(root, p.css), 'utf8')) + '\n';
    }
    fs.writeFileSync(path.join(outDir, f), cssText);
  }
}
for (const f of ['assets/js/i18n-data.js', 'assets/js/sourcerating-embed-adapter.js', 'assets/js/site.js']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.writeFileSync(path.join(outDir, f), sanitizeTenantAssetContent(fs.readFileSync(src, 'utf8')));
  }
}

// Tenant-isolated mock fixture (only active when explicit ?sr_mode=mock is passed): zero An-Thai posts/data
fs.writeFileSync(
  path.join(outDir, 'assets/js/sr-bridge-mock.js'),
  `(function (global) {
  'use strict';
  var STORAGE_PREFIX = 'sr_tenant_mock_state_v1_';
  function load(ws) {
    try { var raw = global.localStorage && global.localStorage.getItem(STORAGE_PREFIX + ws); if (raw) return JSON.parse(raw); } catch (e) {}
    return { organizationId: '11111111-1111-4111-8111-111111111001', workspaceKey: ws, sessions: {}, posts: [] };
  }
  function save(ws, st) { try { if (global.localStorage) global.localStorage.setItem(STORAGE_PREFIX + ws, JSON.stringify(st)); } catch (e) {} }
  global.ANTHAI_SR_MOCK = {
    createTransport: function (workspaceKey) {
      var ws = workspaceKey || ${safeJsonForScript(workspaceKey)};
      return {
        health: async function () { var s = load(ws); return { ok: true, configured: true, online: true, organizationId: s.organizationId, workspaceKey: ws, workspaceName: ${safeJsonForScript(cfg.legalName)}, challengeToken: 'bchk_mock_' + ws, isMock: true }; },
        createSession: async function (p) { var s = load(ws); var id = '22222222-2222-4222-8222-' + Date.now().toString(16).padStart(12, '0').slice(-12); var tok = 'tok_' + Date.now(); var req = 'SR-MOCK-' + id.slice(0, 8).toUpperCase(); s.sessions[id] = { sessionId: id, visitorToken: tok, requestId: req, status: 'ai_active', messages: [{ id: 'm1', seq: 1, senderKind: 'visitor', senderLabel: 'Visitor', text: String((p && p.message) || 'Inquiry'), createdAt: new Date().toISOString() }] }; save(ws, s); return { ok: true, sessionId: id, visitorToken: tok, requestId: req, status: 'ai_active', isMock: true, persistedToSr: false }; },
        getSession: async function (id) { var s = load(ws); var x = s.sessions[id]; return x ? { ok: true, session: x, isMock: true } : { ok: false, statusCode: 401, error: 'Unauthorized' }; },
        listMessages: async function (id) { var s = load(ws); var x = s.sessions[id]; return x ? { ok: true, messages: x.messages || [], isMock: true } : { ok: false, statusCode: 401, messages: [] }; },
        sendMessage: async function (id, tok, b) { var s = load(ws); var x = s.sessions[id]; if (!x) return { ok: false, statusCode: 401 }; if (b && b.requestHandoff) x.status = 'waiting_human'; x.messages.push({ id: 'm' + (x.messages.length + 1), seq: x.messages.length + 1, senderKind: 'visitor', senderLabel: 'Visitor', text: String((b && b.text) || ''), createdAt: new Date().toISOString() }); save(ws, s); return { ok: true, sessionStatus: x.status, isMock: true, persisted: false }; },
        listPublicPosts: async function () { var s = load(ws); return { ok: true, posts: s.posts || [], isMock: true }; }
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
`
);

fs.writeFileSync(
  path.join(outDir, 'assets/images/tenant-logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(cfg.brandShort)}"><rect width="64" height="64" rx="12" fill="#0f172a"/><text x="32" y="38" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="#f59e0b">TEST</text></svg>\n`
);

const runtimeConfig = {
  inquiryEndpoint: '',
  brandLabel: cfg.legalName,
  directEmail: cfg.directEmail,
  directPhone: cfg.directPhone,
  hideDirectMessengers: Boolean(cfg.hideDirectMessengers),
  theme: activeTheme,
  sourceRating: cfg.sourceRating,
};

const locales = [
  { key: 'EN', prefix: '', htmlLang: 'en', navHome: 'Home', navContact: 'Inquiry & Contact', updatesTitle: 'Authorized TEST Updates', submitBtn: 'Submit TEST Inquiry', contactHeading: 'TEST Tenant Inquiry Desk', offlineTitle: 'Isolated Tenant Sandbox Brief' },
  { key: 'ZH', prefix: 'zh', htmlLang: 'zh-CN', navHome: '首页', navContact: '测试询盘', updatesTitle: 'TEST 授权动态区', submitBtn: '提交 TEST 测试询盘', contactHeading: 'TEST 隔离租户询盘台', offlineTitle: '隔离租户结构化简报' },
  { key: 'TH', prefix: 'th', htmlLang: 'th', navHome: 'หน้าแรก', navContact: 'ติดต่อทดสอบ', updatesTitle: 'อัปเดต TEST ที่ได้รับอนุญาต', submitBtn: 'ส่งคำสอบถามทดสอบ TEST', contactHeading: 'ศูนย์ทดสอบคำสอบถาม TEST', offlineTitle: 'แบบฟอร์มทดสอบแยกองค์กร' },
];

function renderPage(loc, pageName) {
  const basePath = loc.prefix ? `/${loc.prefix}` : '';
  const optionsHtml = cfg.serviceLines.map((s) => `<option value="${escapeHtml(s.value)}">${escapeHtml(s['title' + loc.key] || s.titleEN)}</option>`).join('');
  const cardsHtml = cfg.serviceLines.map((s) => `
    <article class="card" style="padding:18px;">
      <div class="mono" style="font-size:11px;color:var(--accent);font-weight:700;">${escapeHtml(s.code)}</div>
      <h2 class="h3" style="margin-top:6px;">${escapeHtml(s['title' + loc.key] || s.titleEN)}</h2>
      <p class="muted" style="margin-top:6px;font-size:13px;">${escapeHtml(s['desc' + loc.key] || s.descEN)}</p>
    </article>`).join('');

  const mainHtml = pageName === 'contact.html' ? `
    <main id="main-content" class="section">
      <div class="container">
        <div class="eyebrow">${escapeHtml(cfg.brandShort)} · workspaceKey: ${escapeHtml(workspaceKey)}</div>
        <h1 class="h1" style="margin-top:8px;">${escapeHtml(loc.contactHeading)}</h1>
        <p class="muted" style="margin-top:8px;">${escapeHtml(cfg.legalName)} · ${escapeHtml(cfg.officeAddress)} · ${escapeHtml(cfg.directEmail)}</p>
        <form id="contactScopeForm" class="card" style="margin-top:18px;padding:20px;max-width:640px;">
          <input type="text" id="cWebsiteHp" name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;" aria-hidden="true" />
          <div class="field"><label for="cRoute">TEST Line</label><select id="cRoute">${optionsHtml}</select></div>
          <div class="field"><label for="cLoc">Location</label><input id="cLoc" type="text" placeholder="TEST Region A" /></div>
          <div class="field"><label for="cScale">Scale</label><input id="cScale" type="text" placeholder="TEST Batch 01" /></div>
          <div class="field"><label for="cContact">Contact *</label><input id="cContact" type="text" placeholder="${escapeHtml(cfg.directEmail)}" /></div>
          <div class="field"><label for="cNotes">Notes *</label><textarea id="cNotes" rows="3" placeholder="TEST verification inquiry notes..."></textarea></div>
          <div id="contactFeedback" class="notice-box" hidden role="status" aria-live="polite"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <button id="contactSubmitBtn" type="submit" class="btn btn-accent">${escapeHtml(loc.submitBtn)}</button>
            <button id="contactCopyBtn" type="button" class="btn btn-outline">Copy Brief</button>
          </div>
        </form>
      </div>
    </main>` : `
    <main id="main-content">
      <section class="section">
        <div class="container">
          <div class="eyebrow">${escapeHtml(cfg.legalName)} · NOINDEX · workspaceKey=${escapeHtml(workspaceKey)}</div>
          <h1 class="h1" style="margin-top:8px;">${escapeHtml(cfg.heroHeadline[loc.key] || cfg.heroHeadline.EN)}</h1>
          <p class="muted" style="margin-top:10px;max-width:64ch;">${escapeHtml(cfg.heroLead[loc.key] || cfg.heroLead.EN)}</p>
          <div class="grid-2" style="margin-top:20px;">${cardsHtml}</div>
          <div style="margin-top:18px;display:flex;gap:10px;">
            <a href="${basePath}/contact.html" class="btn btn-accent">${escapeHtml(loc.navContact)}</a>
            <button id="bottomBarDeskBtn" type="button" class="btn btn-outline" data-open-desk="">Desk Drawer</button>
          </div>
        </div>
      </section>
      <section id="fieldUpdatesSection" class="section" hidden>
        <div class="container">
          <h2 class="h2">${escapeHtml(loc.updatesTitle)}</h2>
          <div id="fieldUpdatesMount" class="grid-3"></div>
        </div>
      </section>
    </main>`;

  const themeAttr = activeTheme !== 'default' ? ` data-theme="${escapeHtml(activeTheme)}"` : '';
  const themeCssLinks = activeTheme !== 'default'
    ? `\n  <link id="anthaiThemeTokensCss" rel="stylesheet" href="/assets/themes/tokens.css" />\n  <link id="anthaiThemePresetCss" rel="stylesheet" href="/assets/themes/presets/${escapeHtml(activeTheme)}/theme.css" />`
    : '';

  return `<!DOCTYPE html>
<html lang="${loc.htmlLang}"${themeAttr}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(cfg.legalName)} (${escapeHtml(loc.key)})</title>
  <link rel="icon" href="/assets/images/tenant-logo.svg" type="image/svg+xml" />
  <script>(function(){try{var h=location.hostname.toLowerCase().replace(/\\.+$/,''),p=h==='localhost'||h==='127.0.0.1'||h==='[::1]'||/\\.vercel\\.app$/.test(h),t=p&&new URLSearchParams(location.search).get('theme');if(t==='default')document.documentElement.removeAttribute('data-theme');else if(t==='cinematic'||t==='blueprint'||t==='storytelling')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <link rel="stylesheet" href="/assets/css/styles.css" />${themeCssLinks}
</head>
<body>
  <header class="site-header">
    <div class="container header-inner" style="flex-wrap:wrap;gap:8px 14px;height:auto;min-height:68px;padding:10px 0;">
      <a href="${basePath}/index.html" class="brand" style="min-width:0;max-width:100%;"><img src="/assets/images/tenant-logo.svg" alt="${escapeHtml(cfg.brandShort)}" width="28" height="28" /><span style="min-width:0;"><span class="brand-name">${escapeHtml(cfg.brandShort)}</span><small class="brand-sub" style="overflow-wrap:anywhere;">${escapeHtml(cfg.brandTagline[loc.key] || cfg.brandTagline.EN)}</small></span></a>
      <nav aria-label="Primary" style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;max-width:100%;">
        <a href="${basePath}/index.html">${escapeHtml(loc.navHome)}</a>
        <a href="${basePath}/contact.html">${escapeHtml(loc.navContact)}</a>
        <a href="/index.html" class="lang-btn" data-lang="EN">EN</a>
        <a href="/zh/index.html" class="lang-btn" data-lang="ZH">中文</a>
        <a href="/th/index.html" class="lang-btn" data-lang="TH">ไทย</a>
      </nav>
    </div>
  </header>
  ${mainHtml}
  <div id="deskDrawer" class="drawer-backdrop" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="drawer-panel">
      <div class="drawer-header">
        <div><div id="drawerHeading" style="font-weight:800;font-size:14px;">${escapeHtml(cfg.brandShort)} · Desk</div><div id="drawerStatusText" class="mono" style="font-size:10px;color:#fcd34d;"></div></div>
        <button id="drawerCloseBtn" type="button" class="drawer-close" aria-label="Close drawer">×</button>
      </div>
      <div class="drawer-body">
        <div id="drawerOfflineView" class="drawer-stack">
          <div class="notice-box is-neutral"><strong>${escapeHtml(loc.offlineTitle)}</strong> (${escapeHtml(cfg.directEmail)})</div>
          <div class="field"><label for="drawerRoute">Route</label><select id="drawerRoute">${optionsHtml}</select></div>
          <div class="field"><label for="drawerLoc">Location</label><input id="drawerLoc" type="text" /></div>
          <div class="field"><label for="drawerContact">Contact</label><input id="drawerContact" type="text" /></div>
          <div class="field"><label for="drawerNotes">Notes</label><textarea id="drawerNotes" rows="3"></textarea></div>
          <div id="drawerFeedback" class="notice-box" hidden></div>
          <button id="drawerEmailBtn" type="button" class="btn btn-accent btn-full">${escapeHtml(cfg.directEmail)}</button>
          <button id="drawerCopyBtn" type="button" class="btn btn-outline btn-full">Copy Brief</button>
        </div>
        <div id="drawerLiveView" class="drawer-stack" hidden>
          <div id="liveMessagesMount" class="live-messages"></div>
          <div id="liveFeedback" class="notice-box" hidden role="status" aria-live="polite"></div>
          <div class="live-toolbar">
            <button id="liveHandoffBtn" type="button" class="btn btn-dark" data-i18n="liveHandoffBtn">Request Human</button>
            <button id="liveRefreshBtn" type="button" class="btn btn-outline" data-i18n="liveRefreshBtn">Refresh</button>
            <button id="liveClearBtn" type="button" class="btn btn-outline" data-i18n="liveClearBtn">New Session</button>
          </div>
        </div>
      </div>
      <div id="drawerLiveFooter" class="drawer-footer" hidden>
        <form id="liveMessageForm" style="display:flex;gap:8px;"><input id="liveMsgInput" type="text" style="flex:1;" /><button type="submit" class="btn btn-dark">Send</button></form>
      </div>
    </div>
  </div>
  <footer class="site-footer"><div class="container"><small>${escapeHtml(cfg.legalName)} · ${escapeHtml(cfg.cityRegion)} · NOINDEX</small></div></footer>
  <script>window.ANTHAI_CONFIG = ${safeJsonForScript(runtimeConfig)};</script>
  <script src="/assets/js/i18n-data.js"></script>
  <script>
    (function () {
      var d = window.ANTHAI_I18N;
      if (!d) return;
      var email = ${safeJsonForScript(cfg.directEmail)};
      var legal = ${safeJsonForScript(cfg.legalName)};
      ['EN', 'ZH', 'TH'].forEach(function (k) {
        if (!d[k]) return;
        d[k].fSubmitEmail = 'TEST Email (' + email + ')';
        d[k].fSubmitApi = 'Submit TEST Inquiry (' + email + ')';
        d[k].drawerStatusOffline = legal + ' · Sandbox';
        d[k].mailtoOpenedMsg = 'Prepared sandbox brief for ' + email;
        d[k].mailtoFallbackHelp = 'Sandbox mode — no external delivery for ' + legal;
        d[k].bottomBarOffline = legal + ' · Sandbox Desk';
        d[k].bottomBarBtnOffline = 'TEST Desk';
        d[k].footerAdapterOffline = legal + ' · Offline Sandbox';
        d[k].contactApiReadyNotice = legal + ' Sandbox Form';
        d[k].fServerOk = 'TEST Sandbox Ref: ';
      });
    })();
  </script>
  <script src="/assets/js/sr-bridge-mock.js"></script>
  <script src="/assets/js/sourcerating-embed-adapter.js"></script>
  <script defer src="/assets/themes/motion-core.js"></script>
  <script src="/assets/js/site.js"></script>
</body>
</html>\n`;
}

const forbiddenLeakTerms = [
  'an-thai.com', 'info@an-thai.com', 'an-thai-th', '66902921749', '90 292 1749',
  'James2021', 'p0_XsfILmH', 'Arwan', 'PACO', 'ROGE', 'TEST-ANTHAI-UPD', '安泰', 'อัน-ไทย'
];
let generatedCount = 0;

for (const loc of locales) {
  const dir = loc.prefix ? path.join(outDir, loc.prefix) : outDir;
  fs.mkdirSync(dir, { recursive: true });
  for (const page of ['index.html', 'contact.html']) {
    fs.writeFileSync(path.join(dir, page), renderPage(loc, page));
    generatedCount += 1;
  }
}
fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

(function verifyAllGeneratedFilesClean(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) verifyAllGeneratedFilesClean(full);
    else if (entry.isFile()) {
      const content = fs.readFileSync(full, 'utf8');
      for (const term of forbiddenLeakTerms) {
        assert(!content.toLowerCase().includes(term.toLowerCase()), `Forbidden An-Thai data leaked into ${path.relative(outDir, full)}: ${term}`);
      }
    }
  }
})(outDir);

console.log(`PASS: generated ${generatedCount} isolated noindex pages for "${cfg.legalName}" (workspaceKey=${workspaceKey}) in ${path.relative(root, outDir)}`);

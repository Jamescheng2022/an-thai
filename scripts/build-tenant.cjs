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
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : `dist-${cfg.tenantSlug}`);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'assets/css'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets/js'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets/images'), { recursive: true });

for (const f of ['assets/css/styles.css', 'assets/css/portfolio-v1.css', 'assets/js/i18n-data.js', 'assets/js/sr-bridge-mock.js', 'assets/js/sourcerating-embed-adapter.js', 'assets/js/site.js']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, f));
}

fs.writeFileSync(
  path.join(outDir, 'assets/images/tenant-logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${cfg.brandShort}"><rect width="64" height="64" rx="12" fill="#0f172a"/><text x="32" y="38" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="#f59e0b">TEST</text></svg>\n`
);

const runtimeConfig = {
  inquiryEndpoint: '',
  brandLabel: cfg.legalName,
  directEmail: cfg.directEmail,
  directPhone: cfg.directPhone,
  hideDirectMessengers: Boolean(cfg.hideDirectMessengers),
  sourceRating: cfg.sourceRating,
};

const locales = [
  { key: 'EN', prefix: '', htmlLang: 'en', navHome: 'Home', navContact: 'Inquiry & Contact', updatesTitle: 'Authorized TEST Updates', submitBtn: 'Submit TEST Inquiry', contactHeading: 'TEST Tenant Inquiry Desk', offlineTitle: 'Isolated Tenant Sandbox Brief' },
  { key: 'ZH', prefix: 'zh', htmlLang: 'zh-CN', navHome: '首页', navContact: '测试询盘', updatesTitle: 'TEST 授权动态区', submitBtn: '提交 TEST 测试询盘', contactHeading: 'TEST 隔离租户询盘台', offlineTitle: '隔离租户结构化简报' },
  { key: 'TH', prefix: 'th', htmlLang: 'th', navHome: 'หน้าแรก', navContact: 'ติดต่อทดสอบ', updatesTitle: 'อัปเดต TEST ที่ได้รับอนุญาต', submitBtn: 'ส่งคำสอบถามทดสอบ TEST', contactHeading: 'ศูนย์ทดสอบคำสอบถาม TEST', offlineTitle: 'แบบฟอร์มทดสอบแยกองค์กร' },
];

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
        <div class="eyebrow">${escapeHtml(cfg.brandShort)} · workspaceKey: ${escapeHtml(cfg.workspaceKey)}</div>
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
          <div class="eyebrow">${escapeHtml(cfg.legalName)} · NOINDEX · workspaceKey=${escapeHtml(cfg.workspaceKey)}</div>
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

  return `<!DOCTYPE html>
<html lang="${loc.htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(cfg.legalName)} (${escapeHtml(loc.key)})</title>
  <link rel="icon" href="/assets/images/tenant-logo.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/css/styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="${basePath}/index.html" class="brand"><img src="/assets/images/tenant-logo.svg" alt="${escapeHtml(cfg.brandShort)}" width="28" height="28" /><span><strong>${escapeHtml(cfg.brandShort)}</strong><small>${escapeHtml(cfg.brandTagline[loc.key] || cfg.brandTagline.EN)}</small></span></a>
      <nav aria-label="Primary" style="display:flex;gap:14px;align-items:center;">
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
  <script>window.ANTHAI_CONFIG = ${JSON.stringify(runtimeConfig)};</script>
  <script src="/assets/js/i18n-data.js"></script>
  <script src="/assets/js/sr-bridge-mock.js"></script>
  <script src="/assets/js/sourcerating-embed-adapter.js"></script>
  <script src="/assets/js/site.js"></script>
</body>
</html>\n`;
}

const forbiddenLeakTerms = ['an-thai.com', 'info@an-thai.com', '66902921749', 'James2021', 'p0_XsfILmH', 'Arwan Building', 'PACO', 'ROGE'];
let generatedCount = 0;

for (const loc of locales) {
  const dir = loc.prefix ? path.join(outDir, loc.prefix) : outDir;
  fs.mkdirSync(dir, { recursive: true });
  for (const page of ['index.html', 'contact.html']) {
    const html = renderPage(loc, page);
    for (const term of forbiddenLeakTerms) {
      assert(!html.includes(term), `Forbidden An-Thai data leaked into ${cfg.tenantSlug}/${loc.key}/${page}: ${term}`);
    }
    fs.writeFileSync(path.join(dir, page), html);
    generatedCount += 1;
  }
}
fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`PASS: generated ${generatedCount} isolated noindex pages for "${cfg.legalName}" (workspaceKey=${cfg.workspaceKey}) in ${path.relative(root, outDir)}`);

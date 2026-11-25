/**
 * AN-THAI Engineering V1.0 — Production Site Controller
 * Fixes & enhancements:
 * - Preserves nested routes (/cases/*, /insights/*) during language switching (Codex P2 #2)
 * - Maps ?type=...&category=...&route=... query params onto BOTH #contactScopeForm and #deskDrawer (Codex P2 #1)
 * - Checks GET /api/inquiry readiness before rendering "Submit Inquiry"; keeps honest Email/WhatsApp/Copy Brief active when unconfigured
 * - Never fabricates email delivery or live AI chat availability
 */
(function () {
  'use strict';

  window.ANTHAI_CONFIG = window.ANTHAI_CONFIG || {
    inquiryEndpoint: '/api/inquiry',
    directEmail: 'info@an-thai.com',
    directPhone: '+66 90 292 1749',
    sourceRating: {
      apiBaseUrl: '',
      workspaceKey: 'an-thai-th'
    }
  };

  window.ANTHAI_TRACK = function (eventName, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
      else if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    } catch (e) {}
  };

  var I18N = window.ANTHAI_I18N || { EN: {} };
  var state = { lang: 'EN', adapterMode: 'unconfigured', inquiryApiConfigured: false, sessionId: '', lastFocused: null, pollTimer: null };

  function detectInitialLang() {
    var p = window.location.pathname || '';
    if (p.indexOf('/zh/') !== -1 || p === '/zh') return 'ZH';
    if (p.indexOf('/th/') !== -1 || p === '/th') return 'TH';
    var docLang = (document.documentElement && document.documentElement.lang ? document.documentElement.lang : '').toLowerCase();
    if (docLang.indexOf('zh') !== -1) return 'ZH';
    if (docLang.indexOf('th') !== -1) return 'TH';
    return 'EN';
  }

  function t(key) {
    var d = I18N[state.lang] || I18N.EN || {};
    return d[key] !== undefined ? d[key] : ((I18N.EN && I18N.EN[key]) || key);
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function syncStatusUI() {
    var isLive = state.adapterMode === 'live';
    document.querySelectorAll('.sr-status-dot').forEach(function (dot) { dot.classList.toggle('is-live', isLive); });
    document.querySelectorAll('.sr-hero-badge').forEach(function (el) {
      el.classList.toggle('is-live', isLive);
      var lbl = el.querySelector('.sr-badge-text');
      if (lbl) lbl.textContent = isLive ? t('statusBadgeLive') : t('statusBadgePending');
    });
    var headerDeskLabel = document.getElementById('headerDeskLabel');
    if (headerDeskLabel) headerDeskLabel.textContent = isLive ? t('deskBtnLive') : t('deskBtnOffline');
    var bottomText = document.getElementById('bottomBarStatusText');
    if (bottomText) bottomText.textContent = isLive ? t('bottomBarLive') : t('bottomBarOffline');
    var bottomBtn = document.getElementById('bottomBarDeskBtn');
    if (bottomBtn) bottomBtn.textContent = isLive ? t('bottomBarBtnLive') : t('bottomBarBtnOffline');
    var footerAdapter = document.getElementById('footerAdapterStatus');
    if (footerAdapter) footerAdapter.textContent = isLive ? t('footerAdapterLive') : t('footerAdapterOffline');
    var drawerStatus = document.getElementById('drawerStatusText');
    if (drawerStatus) {
      drawerStatus.textContent = isLive
        ? (t('drawerStatusLive') + (state.sessionId || 'active'))
        : t('drawerStatusOffline');
    }
    var offlineView = document.getElementById('drawerOfflineView');
    var liveView = document.getElementById('drawerLiveView');
    var liveFooter = document.getElementById('drawerLiveFooter');
    if (offlineView) offlineView.hidden = isLive;
    if (liveView) liveView.hidden = !isLive;
    if (liveFooter) liveFooter.hidden = !isLive;
  }

  function syncContactSubmitMode() {
    var submitBtn = document.getElementById('contactSubmitBtn');
    if (submitBtn) {
      submitBtn.textContent = state.inquiryApiConfigured ? t('fSubmitApi') : t('fSubmitEmail');
    }
    var statusEl = document.getElementById('contactApiStatus');
    if (statusEl) {
      if (state.inquiryApiConfigured) {
        statusEl.textContent = t('contactApiReadyNotice');
        statusEl.hidden = false;
      } else {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }
    }
  }

  async function probeInquiryBackend() {
    if (!window.ANTHAI_CONFIG.inquiryEndpoint || window.location.protocol === 'file:') return;
    if (!document.getElementById('contactScopeForm')) return;
    try {
      var res = await fetch(window.ANTHAI_CONFIG.inquiryEndpoint, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      var payload = await res.json().catch(function () { return {}; });
      state.inquiryApiConfigured = Boolean(payload && payload.configured === true);
      syncContactSubmitMode();
    } catch (e) {
      state.inquiryApiConfigured = false;
      syncContactSubmitMode();
    }
  }

  // Insights category filter (multi-tag via data-article-units / data-article-unit)
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var unit = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('[data-article-units], [data-article-unit]').forEach(function (card) {
        var tags = (card.getAttribute('data-article-units') || card.getAttribute('data-article-unit') || '').split(/\s+/).filter(Boolean);
        card.hidden = !(unit === 'all' || tags.indexOf(unit) !== -1);
      });
    });
  });

  // GA4 link hooks
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () { window.ANTHAI_TRACK('email_click', { href: a.href }); });
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () { window.ANTHAI_TRACK('phone_click', { href: a.href }); });
  });

  // SourceRating Live Adapter & i18n UI
  var adapter = null;
  var liveMount = document.getElementById('liveMessagesMount');
  var liveFeedback = document.getElementById('liveFeedback');

  function showLiveFeedback(msg, kind) {
    if (!liveFeedback) return;
    liveFeedback.className = 'notice-box ' + (kind === 'ok' ? 'is-ok' : (kind === 'err' ? 'is-err' : 'is-neutral'));
    liveFeedback.textContent = msg;
    liveFeedback.hidden = !msg;
  }

  function renderLiveMessages(messages) {
    if (!liveMount) return;
    if (!Array.isArray(messages) || messages.length === 0) {
      liveMount.innerHTML = '<div class="notice-box is-neutral">' + esc(t('liveWelcomeEmpty')) + '</div>';
      return;
    }
    liveMount.innerHTML = messages.map(function (m) {
      var role = (m.sender || m.role || 'ai').toLowerCase();
      var cls = role === 'guest' || role === 'user' ? 'is-guest'
        : (role === 'human' || role === 'staff' ? 'is-human'
        : (role === 'system' ? 'is-system' : ''));
      var roleLabel = role === 'guest' || role === 'user' ? t('liveRoleGuest')
        : (role === 'human' || role === 'staff' ? (m.orgVerified ? t('liveRoleHumanVerified') : t('liveRoleHuman'))
        : (role === 'system' ? t('liveRoleSystem') : t('liveRoleAi')));
      var meta = roleLabel + (m.id ? ' · #' + esc(m.id) : '') + (m.createdAt ? ' · ' + esc(m.createdAt) : '');
      return '<div class="msg-bubble ' + cls + '"><div class="msg-meta">' + meta + '</div><div>' + esc(m.text || m.content || '') + '</div></div>';
    }).join('');
    var body = document.querySelector('.drawer-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  async function initAdapter() {
    if (typeof window.SourceRatingEmbedAdapter !== 'function') return;
    adapter = new window.SourceRatingEmbedAdapter({
      apiBaseUrl: window.ANTHAI_CONFIG.sourceRating.apiBaseUrl,
      workspaceKey: window.ANTHAI_CONFIG.sourceRating.workspaceKey,
      defaultLang: detectInitialLang().toLowerCase(),
      onStatusChange: function (info) {
        state.adapterMode = info.mode || 'unconfigured';
        state.sessionId = info.sessionId || '';
        syncStatusUI();
        if (state.adapterMode === 'live') window.ANTHAI_TRACK('chat_session_started', { sessionId: state.sessionId });
      }
    });
    var res = await adapter.init();
    if (res && res.ok && res.mode === 'live') renderLiveMessages(res.messages || []);
  }

  var liveForm = document.getElementById('liveMessageForm');
  var liveInput = document.getElementById('liveMsgInput');
  if (liveForm && liveInput) {
    liveForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var text = liveInput.value.trim();
      if (!text || !adapter || state.adapterMode !== 'live') return;
      showLiveFeedback('', '');
      var res = await adapter.sendMessage({ text: text, context: { page: window.location.pathname, lang: state.lang } });
      if (!res.ok) {
        showLiveFeedback(t('liveErrSend') + (res.error ? ' (' + res.error + ')' : ''), 'err');
        return;
      }
      liveInput.value = '';
      if (res.sessionId) { state.sessionId = res.sessionId; syncStatusUI(); }
      if (res.sessionReset) showLiveFeedback(t('liveSessionReset'), 'neutral');
      var listRes = await adapter.listMessages();
      if (listRes.ok) renderLiveMessages(listRes.messages);
    });
  }

  var liveHandoffBtn = document.getElementById('liveHandoffBtn');
  if (liveHandoffBtn) {
    liveHandoffBtn.addEventListener('click', async function () {
      if (!adapter || state.adapterMode !== 'live') return;
      var res = await adapter.requestHumanHandoff({ reason: 'visitor_requested', page: window.location.pathname });
      if (!res.ok) {
        showLiveFeedback(t('liveErrHandoff') + (res.error ? ' (' + res.error + ')' : ''), 'err');
        return;
      }
      if (res.sessionId) { state.sessionId = res.sessionId; syncStatusUI(); }
      window.ANTHAI_TRACK('human_handoff_requested', { sessionId: state.sessionId });
      var ref = (res.data && (res.data.handoffId || res.data.id)) ? ' #' + (res.data.handoffId || res.data.id) : '';
      showLiveFeedback(t('liveOkHandoff') + ref + (res.sessionReset ? ' ' + t('liveSessionReset') : ''), 'ok');
      var listRes = await adapter.listMessages();
      if (listRes.ok) renderLiveMessages(listRes.messages);
    });
  }

  var liveRefreshBtn = document.getElementById('liveRefreshBtn');
  if (liveRefreshBtn) {
    liveRefreshBtn.addEventListener('click', async function () {
      if (!adapter || state.adapterMode !== 'live') return;
      var listRes = await adapter.listMessages();
      if (listRes.ok) {
        if (listRes.sessionId) { state.sessionId = listRes.sessionId; syncStatusUI(); }
        renderLiveMessages(listRes.messages);
        showLiveFeedback(listRes.sessionReset ? t('liveSessionReset') : '', 'neutral');
      } else {
        showLiveFeedback(t('liveErrRefresh') + (listRes.error ? ' (' + listRes.error + ')' : ''), 'err');
      }
    });
  }

  var liveClearBtn = document.getElementById('liveClearBtn');
  if (liveClearBtn) {
    liveClearBtn.addEventListener('click', async function () {
      if (!adapter) return;
      adapter.clearSession();
      await initAdapter();
    });
  }

  var liveClaimForm = document.getElementById('liveClaimForm');
  if (liveClaimForm) {
    liveClaimForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('liveClaimEmail');
      var email = emailEl ? emailEl.value.trim() : '';
      if (!email || !adapter || state.adapterMode !== 'live') return;
      var res = await adapter.claimAccount(email);
      if (res.ok) {
        showLiveFeedback(t('liveOkClaim') + email, 'ok');
        if (emailEl) emailEl.value = '';
      } else {
        showLiveFeedback(t('liveErrClaim') + (res.error ? ' (' + res.error + ')' : ''), 'err');
      }
    });
  }

  // Drawer Accessibility + Focus Trap
  var drawer = document.getElementById('deskDrawer');
  var drawerClose = document.getElementById('drawerCloseBtn');
  var mainEl = document.getElementById('main-content');

  function getFocusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function startPolling() {
    stopPolling();
    if (state.adapterMode !== 'live') return;
    state.pollTimer = window.setInterval(async function () {
      if (!adapter || state.adapterMode !== 'live' || !drawer || !drawer.classList.contains('is-open')) return;
      var r = await adapter.listMessages();
      if (r.ok) renderLiveMessages(r.messages);
    }, 5000);
  }
  function stopPolling() {
    if (state.pollTimer) { window.clearInterval(state.pollTimer); state.pollTimer = null; }
  }

  function normalizeRoute(val) {
    if (!val) return '';
    var s = String(val).toLowerCase();
    // Match explicit unit codes first so keywords like "Equipment" in "03 Powder-Process Equipment"
    // or "Testing" in "04 Field Testing Instruments" never cross-route.
    if (/\b01\b/.test(s)) return '01 Foundation Testing & Geotech';
    if (/\b02\b/.test(s)) return '02 Buyer-Side Steel Procurement Agency';
    if (/\b03\b/.test(s)) return '03 Powder-Process Equipment';
    if (/\b04\b/.test(s)) return '04 Field Testing Instruments';
    if (s.indexOf('powder') !== -1 || s.indexOf('grind') !== -1 || s.indexOf('mill') !== -1) {
      return '03 Powder-Process Equipment';
    }
    if (s.indexOf('instr') !== -1 || s.indexOf('equip') !== -1 || s.indexOf('sensor') !== -1) {
      return '04 Field Testing Instruments';
    }
    if (s.indexOf('steel') !== -1 || s.indexOf('procurement') !== -1) {
      return '02 Buyer-Side Steel Procurement Agency';
    }
    if (s.indexOf('testing') !== -1 || s.indexOf('geotech') !== -1 || s.indexOf('pile') !== -1 || s.indexOf('engineering') !== -1 || s.indexOf('consult') !== -1 || s.indexOf('precast') !== -1) {
      return '01 Foundation Testing & Geotech';
    }
    return '';
  }

  var CATEGORY_MAP = {
    pile: 'Pile Integrity Testing Instruments',
    dynamic: 'High-Strain / Dynamic Pile Testing Systems',
    ultrasonic: 'CSL / Ultrasonic Testing Systems',
    static: 'Static Load Test Instrumentation',
    field: 'Geotechnical & Field Testing Equipment',
    lab: 'Material / Laboratory Testing Equipment',
    measurement: 'Load Cells / Sensors / DAQ',
    support: 'Setup / Training / Technical Support'
  };

  function applyQueryContextPrefill(targetRoute, categoryParam, refParam) {
    var matched = normalizeRoute(targetRoute);
    if (matched) {
      var dSel = document.getElementById ? document.getElementById('drawerRoute') : null;
      if (dSel) dSel.value = matched;
      var cSel = document.getElementById ? document.getElementById('cRoute') : null;
      if (cSel) cSel.value = matched;
    }
    var notesLines = [];
    var catKey = categoryParam ? String(categoryParam).toLowerCase() : '';
    if (catKey && Object.prototype.hasOwnProperty.call(CATEGORY_MAP, catKey)) {
      notesLines.push('Equipment Category: ' + CATEGORY_MAP[catKey]);
    } else if (categoryParam) {
      notesLines.push('Category: ' + String(categoryParam));
    }
    if (refParam) {
      notesLines.push('Reference ID: ' + String(refParam));
    }
    if (notesLines.length) {
      var prefillText = notesLines.join('\n') + '\nRequirements: ';
      var cNotes = document.getElementById ? document.getElementById('cNotes') : null;
      if (cNotes && !cNotes.value.trim()) cNotes.value = prefillText;
      var dNotes = document.getElementById ? document.getElementById('drawerNotes') : null;
      if (dNotes && !dNotes.value.trim()) dNotes.value = prefillText;
    }
  }

  function openDrawer(prefillRoute) {
    if (!drawer) return;
    state.lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (mainEl) mainEl.setAttribute('aria-hidden', 'true');
    if (prefillRoute) {
      var matched = normalizeRoute(prefillRoute);
      var sel = document.getElementById ? document.getElementById('drawerRoute') : null;
      if (sel) {
        if (matched) sel.value = matched;
        else if (sel.options) {
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === prefillRoute) {
              sel.value = prefillRoute;
              break;
            }
          }
        }
      }
    }
    syncStatusUI();
    startPolling();
    if (drawerClose) drawerClose.focus();
  }

  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    stopPolling();
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (mainEl) mainEl.removeAttribute('aria-hidden');
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') state.lastFocused.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      var mNav = document.getElementById('mobileNav');
      var mBtn = document.getElementById('mobileMenuBtn');
      if (mNav && mNav.classList.contains('is-open')) {
        mNav.classList.remove('is-open');
        if (mBtn) mBtn.setAttribute('aria-expanded', 'false');
      }
      return;
    }
    if (e.key === 'Tab' && drawer && drawer.classList.contains('is-open')) {
      var f = getFocusable(drawer);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  document.querySelectorAll('[data-open-desk]').forEach(function (btn) {
    btn.addEventListener('click', function () { openDrawer(btn.getAttribute('data-open-desk') || ''); });
  });
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawer) drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });

  var menuBtn = document.querySelector ? (document.querySelector('.menu-btn') || document.querySelector('.menu-toggle') || document.querySelector('#mobileMenuBtn')) : null;
  var navLinks = document.querySelector ? (document.querySelector('.nav-links') || document.querySelector('.nav-menu') || document.querySelector('#mobileNav')) : null;
  function setMenu(open) {
    if (navLinks && navLinks.classList) {
      if (navLinks.classList.toggle) {
        navLinks.classList.toggle('open', open);
        navLinks.classList.toggle('is-open', open);
      }
    }
    if (menuBtn && menuBtn.setAttribute) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? (menuBtn.getAttribute('data-close-label') || 'Close menu') : (menuBtn.getAttribute('data-open-label') || 'Open menu'));
    }
    if (open && navLinks && navLinks.querySelector) {
      var firstA = navLinks.querySelector('a');
      if (firstA && firstA.focus) firstA.focus();
    }
  }
  if (menuBtn && menuBtn.addEventListener) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (navLinks && navLinks.querySelectorAll) {
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menuBtn && menuBtn.getAttribute && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      if (menuBtn.focus) menuBtn.focus();
    }
  });
  document.addEventListener('click', function (event) {
    if (event.target && event.target.closest && !event.target.closest('.site-header')) setMenu(false);
  });
  if (window.matchMedia) {
    var mql = window.matchMedia('(min-width: 1121px)');
    if (mql && mql.addEventListener) mql.addEventListener('change', function () { setMenu(false); });
  }

  // Codex P2 #2 Fix: Preserve nested routes (/cases/, /cases/<slug>.html, /insights/, etc.) across EN/ZH/TH
  function resolveLocalizedPath(pathname, targetLang) {
    var p = pathname || '/';
    var clean = p.replace(/^\/(zh|th)(?=\/|$)/, '') || '/';
    if (clean === '/') clean = '/index.html';
    else if (clean.endsWith('/')) clean = clean + 'index.html';

    // Individual English technical articles stay at /insights/<slug>.html (canonical EN)
    if (clean.indexOf('/insights/') === 0 && clean !== '/insights/index.html') {
      if (targetLang === 'ZH') return '/zh/insights/index.html';
      if (targetLang === 'TH') return '/th/insights/index.html';
      return clean;
    }

    if (targetLang === 'ZH') return '/zh' + (clean.charAt(0) === '/' ? clean : '/' + clean);
    if (targetLang === 'TH') return '/th' + (clean.charAt(0) === '/' ? clean : '/' + clean);
    return clean;
  }

  if (document.querySelectorAll) {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var targetLang = (btn.getAttribute('data-lang') || btn.getAttribute('data-language') || '').toUpperCase();
        if (!targetLang) return;
        try { window.sessionStorage.setItem('anthai_lang', targetLang); } catch (err) {}

        var href = btn.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          var targetUrl = new URL(href, window.location.origin);
          targetUrl.search = window.location.search;
          targetUrl.hash = window.location.hash;
          window.location.href = targetUrl.href;
          e.preventDefault();
          return;
        }

        var newPath = resolveLocalizedPath(window.location.pathname, targetLang);
        window.location.href = newPath + window.location.search + window.location.hash;
        e.preventDefault();
      });
    });
  }

  // Brief & Contact Form (Unified website_url honeypot)
  function buildBrief(f) {
    return [
      'AN-THAI Engineering — Technical Inquiry',
      'Unit: ' + (f.route || 'Not specified'),
      'Location: ' + (f.location || 'Not specified'),
      'Scale: ' + (f.scale || 'Not specified'),
      'Contact: ' + (f.contact || 'Not specified'),
      'Requirements: ' + (f.notes || 'Not specified'),
      'URL: ' + window.location.href
    ].join('\n');
  }
  function openMailto(route, brief) {
    window.ANTHAI_TRACK('email_click', { source: 'structured_brief', route: route });
    window.location.href = 'mailto:' + encodeURIComponent(window.ANTHAI_CONFIG.directEmail)
      + '?subject=' + encodeURIComponent('[AN-THAI] ' + (route || 'Technical Inquiry'))
      + '&body=' + encodeURIComponent(brief);
  }
  function showInquiryFeedback(el, route, brief) {
    if (!el) return;
    openMailto(route, brief);
    el.className = 'notice-box is-neutral';
    var waUrl = 'https://wa.me/66902921749?text=' + encodeURIComponent(brief);
    el.innerHTML = [
      '<div style="font-weight:700;margin-bottom:6px;">' + esc(t('mailtoOpenedMsg')) + '</div>',
      '<div style="font-size:12px;margin-bottom:8px;line-height:1.4;">' + esc(t('mailtoFallbackHelp')) + '</div>',
      '<div class="contact-channels-row">',
        '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="padding:6px 12px;font-size:11px;">WhatsApp +66 90 292 1749</a>',
        '<button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:11px;" data-inquiry-copy="">' + esc(t('copyBriefBtn')) + '</button>',
        '<a href="mailto:info@an-thai.com" class="btn btn-outline" style="padding:6px 12px;font-size:11px;">info@an-thai.com</a>',
      '</div>'
    ].join('');
    el.hidden = false;
    var cpBtn = el.querySelector('[data-inquiry-copy]');
    if (cpBtn) {
      cpBtn.addEventListener('click', function () { copyBrief(brief, el); });
    }
  }
  async function copyBrief(text, el) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else {
        var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      window.ANTHAI_TRACK('brief_copied', {});
      if (el) { el.className = 'notice-box is-ok'; el.textContent = t('copiedMsg'); el.hidden = false; }
    } catch (e) {
      if (el) { el.className = 'notice-box'; el.textContent = window.ANTHAI_CONFIG.directEmail; el.hidden = false; }
    }
  }

  var dEmailBtn = document.getElementById('drawerEmailBtn');
  var dCopyBtn = document.getElementById('drawerCopyBtn');
  var dFeedback = document.getElementById('drawerFeedback');
  function readDrawer() {
    return {
      route: (document.getElementById('drawerRoute') || {}).value || '',
      location: ((document.getElementById('drawerLoc') || {}).value || '').trim(),
      contact: ((document.getElementById('drawerContact') || {}).value || '').trim(),
      notes: ((document.getElementById('drawerNotes') || {}).value || '').trim()
    };
  }
  if (dEmailBtn) {
    dEmailBtn.addEventListener('click', function () {
      var f = readDrawer();
      if (!f.contact || !f.notes) {
        if (dFeedback) { dFeedback.className = 'notice-box is-err'; dFeedback.textContent = t('validationMsg'); dFeedback.hidden = false; }
        return;
      }
      showInquiryFeedback(dFeedback, f.route, buildBrief(f));
    });
  }
  if (dCopyBtn) dCopyBtn.addEventListener('click', function () { copyBrief(buildBrief(readDrawer()), dFeedback); });

  var contactForm = document.getElementById('contactScopeForm');
  var contactFeedback = document.getElementById('contactFeedback');
  var contactCopyBtn = document.getElementById('contactCopyBtn');
  function readContact() {
    return {
      route: (document.getElementById('cRoute') || {}).value || '',
      location: ((document.getElementById('cLoc') || {}).value || '').trim(),
      scale: ((document.getElementById('cScale') || {}).value || '').trim(),
      contact: ((document.getElementById('cContact') || {}).value || '').trim(),
      notes: ((document.getElementById('cNotes') || {}).value || '').trim(),
      website_url: ((document.getElementById('cWebsiteHp') || {}).value || '').trim()
    };
  }
  if (contactCopyBtn) contactCopyBtn.addEventListener('click', function () { copyBrief(buildBrief(readContact()), contactFeedback); });
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = readContact();
      if (!f.contact || !f.notes) {
        if (contactFeedback) { contactFeedback.className = 'notice-box is-err'; contactFeedback.textContent = t('validationMsg'); contactFeedback.hidden = false; }
        return;
      }
      if (state.inquiryApiConfigured && window.ANTHAI_CONFIG.inquiryEndpoint) {
        try {
          var res = await fetch(window.ANTHAI_CONFIG.inquiryEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              route: f.route, location: f.location, scale: f.scale,
              contact: f.contact, notes: f.notes, website_url: f.website_url,
              lang: state.lang, sourceUrl: window.location.href
            })
          });
          if (res.ok) {
            var payload = await res.json().catch(function () { return {}; });
            if (payload && payload.ok === true && payload.status === 'accepted_for_delivery' && payload.requestId) {
              var receiptId = String(payload.requestId);
              window.ANTHAI_TRACK('rfq_submit_success', { route: f.route, receiptId: receiptId });
              if (contactFeedback) { contactFeedback.className = 'notice-box is-ok'; contactFeedback.textContent = t('fServerOk') + receiptId; contactFeedback.hidden = false; }
              contactForm.reset();
              return;
            }
          }
        } catch (err) {
          // Honest fallback below
        }
      }
      if (f.website_url) return;
      showInquiryFeedback(contactFeedback, f.route, buildBrief(f));
    });
  }

  var initialLang = detectInitialLang();
  state.lang = initialLang;
  if (document.querySelectorAll) {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var bLang = (btn.getAttribute('data-lang') || btn.getAttribute('data-language') || '').toUpperCase();
      var isCur = (bLang === initialLang);
      btn.setAttribute('aria-pressed', isCur ? 'true' : 'false');
      if (isCur) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }
  syncStatusUI();
  syncContactSubmitMode();
  probeInquiryBackend();

  try {
    var globalUrlParams = new URLSearchParams(window.location.search);
    var targetRouteParam = globalUrlParams.get('route') || globalUrlParams.get('unit') || globalUrlParams.get('type') || globalUrlParams.get('service');
    var targetCatParam = globalUrlParams.get('category');
    var targetRefParam = globalUrlParams.get('ref');
    if (targetRouteParam || targetCatParam || targetRefParam) {
      applyQueryContextPrefill(targetRouteParam, targetCatParam, targetRefParam);
    }
  } catch (e) {}

  // Baseline data-quote-form compatibility handler (unified destination info@an-thai.com)
  var quoteForm = document.querySelector ? document.querySelector('[data-quote-form]') : null;
  if (quoteForm) {
    var qLang = (document.documentElement && document.documentElement.lang) || 'en';
    var qCopy = qLang.startsWith('zh') ? {
      category:'设备类别', requirements:'需求', enquiry:'安泰询价', labels:['姓名','公司','邮箱','联系方式','需求类型'],
      status:'询盘内容已准备好，请在邮件应用中发送至 info@an-thai.com。如未打开邮件应用，请联系 info@an-thai.com 或通过 LINE ID: rachada2018 联系。本网站不会提交表单，也不会创建客户记录。',
      categories:['桩身完整性检测仪器','高应变／动力桩基检测系统','声波透射／超声检测系统','静载试验测量仪器','岩土与现场检测设备','材料／实验室检测设备','荷载传感器／传感器／数据采集系统','安装／培训／技术支持']
    } : qLang === 'th' ? {
      category:'หมวดหมู่เครื่องมือ', requirements:'ข้อกำหนด', enquiry:'สอบถาม AN-THAI', labels:['ชื่อ','บริษัท','อีเมล','ช่องทางติดต่อ','ประเภทคำสอบถาม'],
      status:'เตรียมคำสอบถามแล้ว โปรดส่งจากแอปอีเมลไปยัง info@an-thai.com หากแอปไม่เปิด ให้ติดต่อ info@an-thai.com หรือ LINE ID: rachada2018 เว็บไซต์นี้ไม่ส่งแบบฟอร์มหรือสร้างข้อมูลลูกค้า',
      categories:['เครื่องมือทดสอบความสมบูรณ์ของเสาเข็ม','ระบบทดสอบเสาเข็มแบบพลศาสตร์ความเครียดสูง','ระบบทดสอบคลื่นเสียงผ่านท่อ / อัลตราโซนิก','เครื่องมือวัดสำหรับการทดสอบรับน้ำหนักแบบสถิต','เครื่องมือทดสอบปฐพีและภาคสนาม','เครื่องมือทดสอบวัสดุ / ห้องปฏิบัติการ','โหลดเซลล์ / เซนเซอร์ / ระบบเก็บข้อมูล','การติดตั้ง / ฝึกอบรม / สนับสนุนทางเทคนิค']
    } : {category:'Equipment category',requirements:'Requirements',enquiry:'AN-THAI enquiry',labels:['Name','Company','Email','Phone','Request'],status:'Your enquiry is prepared for info@an-thai.com. Send it from your email app, or contact info@an-thai.com / LINE ID: rachada2018. This website does not transmit the form or create a customer record.'};
    var qParams = new URLSearchParams(window.location.search);
    var qTypes = {testing:'Engineering services',engineering:'Engineering services',equipment:'Testing instruments',instruments:'Testing instruments',steel:'Steel / space-structure cooperation',powder:'CNBM powder-equipment cooperation'};
    if (quoteForm.elements && quoteForm.elements.requestType && Object.prototype.hasOwnProperty.call(qTypes, qParams.get('type'))) {
      quoteForm.elements.requestType.value = qTypes[qParams.get('type')];
    }
    var qCatIndex = Object.keys(CATEGORY_MAP).indexOf(qParams.get('category'));
    var qCat = qCatIndex >= 0 ? (qCopy.categories && qCopy.categories[qCatIndex] ? qCopy.categories[qCatIndex] : CATEGORY_MAP[qParams.get('category')]) : null;
    if (['equipment','instruments'].indexOf(qParams.get('type')) !== -1 && qCat && quoteForm.elements && quoteForm.elements.message) {
      quoteForm.elements.message.value = qCopy.category + ': ' + qCat + '\n\n' + qCopy.requirements + ': ';
    }
    quoteForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(quoteForm);
      var type = (quoteForm.elements && quoteForm.elements.requestType && quoteForm.elements.requestType.selectedOptions && quoteForm.elements.requestType.selectedOptions[0] && quoteForm.elements.requestType.selectedOptions[0].textContent) || data.get('requestType') || qCopy.enquiry;
      var body = ['name','company','email','phone'].map(function (key, i) { return qCopy.labels[i] + ': ' + (data.get(key) || ''); }).join('\n') + '\n' + qCopy.labels[4] + ': ' + type + '\n\n' + (data.get('message') || '');
      var mailto = 'mailto:info@an-thai.com?subject=' + encodeURIComponent(qCopy.enquiry + ': ' + type) + '&body=' + encodeURIComponent(body);
      var noteEl = document.getElementById('enquiry-note');
      if (noteEl) noteEl.textContent = qCopy.status;
      window.location.href = mailto;
    });
    var qSubmit = quoteForm.querySelector ? quoteForm.querySelector('button[type="submit"]') : null;
    if (qSubmit) qSubmit.disabled = false;
  }
  initAdapter();

  // Services Dropdown + Mobile Accordion + Conditional Updates
  (function () {
    var dBtn = document.getElementById('desktopServicesBtn');
    var dMenu = document.getElementById('desktopServicesMenu');
    function closeDesktopServices() {
      if (dBtn && dMenu) { dBtn.setAttribute('aria-expanded', 'false'); dMenu.hidden = true; }
    }
    if (dBtn && dMenu) {
      dBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = dBtn.getAttribute('aria-expanded') === 'true';
        dBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
        dMenu.hidden = open;
      });
      document.addEventListener('click', function (e) {
        if (!dMenu.hidden && !e.target.closest('[data-services-dropdown]')) closeDesktopServices();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !dMenu.hidden) { closeDesktopServices(); dBtn.focus(); }
      });
    }

    var mSvcBtn = document.getElementById('mobileServicesBtn');
    var mSvcPanel = document.getElementById('mobileServicesPanel');
    if (mSvcBtn && mSvcPanel) {
      mSvcBtn.addEventListener('click', function () {
        var open = mSvcBtn.getAttribute('aria-expanded') === 'true';
        mSvcBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
        mSvcPanel.hidden = open;
      });
    }

    var updatesSec = document.getElementById('fieldUpdatesSection');
    var updatesMount = document.getElementById('fieldUpdatesMount');
    if (updatesSec && updatesMount && Array.isArray(window.ANTHAI_PUBLISHED_UPDATES) && window.ANTHAI_PUBLISHED_UPDATES.length > 0) {
      var pub = window.ANTHAI_PUBLISHED_UPDATES.filter(function (x) { return x && x.status === 'published'; });
      if (pub.length > 0) {
        updatesMount.innerHTML = pub.slice(0, 3).map(function (item) {
          return '<article class="insight-card"><div><div class="insight-meta"><span>' + esc(item.location || '') + '</span><span>' + esc(item.date || '') + '</span></div><h3 class="h3" style="margin-top:6px;">' + esc(item.title || '') + '</h3><p class="muted" style="margin-top:6px;font-size:12px;">' + esc(item.summary || '') + '</p></div></article>';
        }).join('');
        updatesSec.hidden = false;
      }
    }
  })();

})();

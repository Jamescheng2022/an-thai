/**
 * AN-THAI Engineering v5.2 — Audited Site Controller
 * Fixes:
 * - Preserves liveInput text if adapter.sendMessage fails (never loses user input)
 * - Shows localized session-reset notice when 401 recreated a new anonymous session
 * - 100% i18n for all live errors, statuses, and role labels (no hardcoded English)
 * - Sends unified `website_url` honeypot to /api/inquiry
 * - Supports Insights category filter tabs & 5s live polling while drawer is open
 */
(function () {
  'use strict';

  window.ANTHAI_CONFIG = window.ANTHAI_CONFIG || {
    inquiryEndpoint: '', // Configure '/api/inquiry' once RESEND_API_KEY / INQUIRY_WEBHOOK_URL is set in staging
    directEmail: 'info@an-thai.com',
    directPhone: '+66 90 292 1749',
    sourceRating: {
      apiBaseUrl: '', // Configure verified SourceRating staging origin
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
  var state = { lang: 'EN', adapterMode: 'unconfigured', sessionId: '', lastFocused: null, pollTimer: null };

  function detectInitialLang() {
    try {
      var q = (new URLSearchParams(window.location.search).get('lang') || '').toUpperCase();
      if (I18N[q]) return q;
      var saved = (window.sessionStorage.getItem('anthai_lang') || '').toUpperCase();
      if (I18N[saved]) return saved;
    } catch (e) {}
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

  function applyLang(lang) {
    if (!I18N[lang]) lang = 'EN';
    state.lang = lang;
    document.documentElement.lang = lang === 'ZH' ? 'zh-CN' : (lang === 'TH' ? 'th' : 'en');
    try { window.sessionStorage.setItem('anthai_lang', lang); } catch (e) {}

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k) el.textContent = t(k);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (k) el.setAttribute('placeholder', t(k));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    var submitBtn = document.getElementById('contactSubmitBtn');
    if (submitBtn) submitBtn.textContent = window.ANTHAI_CONFIG.inquiryEndpoint ? t('fSubmitApi') : t('fSubmitEmail');
    syncStatusUI();
    if (adapter && state.adapterMode === 'live') renderLiveMessages(adapter.messages || []);
  }

  // Insights category filter
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var unit = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('[data-article-unit]').forEach(function (card) {
        card.hidden = !(unit === 'all' || card.getAttribute('data-article-unit') === unit);
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

  // SourceRating Live Adapter & 100% i18n UI
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
        // P0-1 Fix: Preserve unsent text in input box on failure!
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

  // Drawer Accessibility + Focus Trap + 5s Live Polling
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

  function openDrawer(prefillRoute) {
    if (!drawer) return;
    state.lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (mainEl) mainEl.setAttribute('aria-hidden', 'true');
    if (prefillRoute) { var sel = document.getElementById('drawerRoute'); if (sel) sel.value = prefillRoute; }
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

  var mobileBtn = document.getElementById('mobileMenuBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      mobileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
  });

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
      openMailto(f.route, buildBrief(f));
      if (dFeedback) { dFeedback.className = 'notice-box is-neutral'; dFeedback.textContent = t('mailtoOpenedMsg'); dFeedback.hidden = false; }
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
      if (window.ANTHAI_CONFIG.inquiryEndpoint) {
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
          if (!res.ok) throw new Error('HTTP_' + res.status);
          var payload = await res.json().catch(function () { return {}; });
          var receiptId = payload.requestId || payload.id || ('HTTP-' + res.status);
          window.ANTHAI_TRACK('rfq_submit_success', { route: f.route, receiptId: receiptId });
          if (contactFeedback) { contactFeedback.className = 'notice-box is-ok'; contactFeedback.textContent = t('fServerOk') + receiptId; contactFeedback.hidden = false; }
          contactForm.reset();
        } catch (err) {
          if (contactFeedback) { contactFeedback.className = 'notice-box is-err'; contactFeedback.textContent = t('fServerErr') + ' (' + err.message + ')'; contactFeedback.hidden = false; }
        }
        return;
      }
      if (f.website_url) return;
      openMailto(f.route, buildBrief(f));
      if (contactFeedback) { contactFeedback.className = 'notice-box is-neutral'; contactFeedback.textContent = t('mailtoOpenedMsg'); contactFeedback.hidden = false; }
    });
  }

  applyLang(detectInitialLang());
  initAdapter();

  // === V5.3 Additions: Services Dropdown + Mobile Accordion + Multi-Tag Insights Filter + Conditional Updates ===
  (function () {
    // Desktop Services Dropdown (click, Enter/Space, Esc, outside-click)
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

    // Mobile Services Accordion (only 6 top-level rows visible initially)
    var mSvcBtn = document.getElementById('mobileServicesBtn');
    var mSvcPanel = document.getElementById('mobileServicesPanel');
    if (mSvcBtn && mSvcPanel) {
      mSvcBtn.addEventListener('click', function () {
        var open = mSvcBtn.getAttribute('aria-expanded') === 'true';
        mSvcBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
        mSvcPanel.hidden = open;
      });
    }

    // Multi-tag Insights filter (space-separated tokens in data-article-units)
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var unit = btn.getAttribute('data-filter');
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        document.querySelectorAll('[data-article-units]').forEach(function (card) {
          var tags = (card.getAttribute('data-article-units') || '').split(/\s+/).filter(Boolean);
          card.hidden = !(unit === 'all' || tags.indexOf(unit) !== -1);
        });
      });
    });

    // Conditional Home "From the Field" renderer (never displays empty box or fake items)
    var updatesSec = document.getElementById('fieldUpdatesSection');
    var updatesMount = document.getElementById('fieldUpdatesMount');
    if (updatesSec && updatesMount && Array.isArray(window.ANTHAI_PUBLISHED_UPDATES) && window.ANTHAI_PUBLISHED_UPDATES.length > 0) {
      var pub = window.ANTHAI_PUBLISHED_UPDATES.filter(function (x) { return x && x.status === 'published'; });
      if (pub.length > 0) {
        updatesMount.innerHTML = pub.slice(0, 3).map(function (item) {
          return '<article class="insight-card"><div><div class="insight-meta"><span>' + String(item.location || '') + '</span><span>' + String(item.date || '') + '</span></div><h3 class="h3" style="margin-top:6px;">' + String(item.title || '') + '</h3><p class="muted" style="margin-top:6px;font-size:12px;">' + String(item.summary || '') + '</p></div></article>';
        }).join('');
        updatesSec.hidden = false;
      }
    }
  })();

})();

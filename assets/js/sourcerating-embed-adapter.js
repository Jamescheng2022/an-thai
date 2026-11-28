/**
 * SourceRating Bridge Adapter v2.3 (Aligned with SR PR #9 / PR #10 I-4 Contract)
 * - Talks to same-origin /api/sr-bridge proxy (preferred) or direct apiBaseUrl /api/bridge/v1/*
 * - Sends x-turnstile-token, UUID clientRequestId / clientMsgId, strict sourceMetadata
 * - Handles 409 IDEMPOTENCY_TOKEN_UNRECOVERABLE & 401 sessionReset cleanly
 * - Falls back ONLY to explicitly labeled V1.1 Contract Mock (isMock: true) when configured
 *   and SR Staging Preview is 302-protected / offline; never claims real delivery in mock mode.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY_PREFIX = 'sr_bridge_session_v1_';
  var VISITOR_KEY_PREFIX = 'sr_bridge_visitor_v1_';
  var PENDING_REQ_PREFIX = 'sr_bridge_pending_req_v1_';

  function makeUuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
  }

  function computePayloadFingerprint(input) {
    input = input || {};
    return [
      String(input.channelSlug || 'web-inquiry'),
      String(input.roomLabel || ''),
      String(input.message || '').trim(),
    ].join('\n');
  }

  function cloneJson(obj) {
    return obj ? JSON.parse(JSON.stringify(obj)) : obj;
  }

  function SourceRatingEmbedAdapter(config) {
    config = config || {};
    this.bridgeEndpoint = (config.bridgeEndpoint || '/api/sr-bridge').replace(/\/$/, '');
    this.apiBaseUrl = (config.apiBaseUrl || '').replace(/\/$/, '');
    this.workspaceKey = config.workspaceKey || 'an-thai-th';
    this.callerKind = config.callerKind || 'an_thai_v1_1';
    this.defaultLang = config.defaultLang || 'en';
    this.mockFallback = Boolean(config.mockFallback);
    this.forceOffline = Boolean(config.forceOffline);
    this.requestTimeoutMs = Number(config.requestTimeoutMs || 10000);
    this.onStatusChange = typeof config.onStatusChange === 'function' ? config.onStatusChange : function () {};

    this.mode = 'initializing'; // 'live' | 'mock' | 'unconfigured' | 'offline'
    this.isMock = false;
    this.organizationId = null;
    this.challengeToken = null;
    this.session = null;
    this.messages = [];
    this.posts = [];
    this.mockTransport = null;
    this.storageKey = STORAGE_KEY_PREFIX + this.workspaceKey;
    this.visitorStorageKey = VISITOR_KEY_PREFIX + this.workspaceKey;
    this.pendingReqStorageKey = PENDING_REQ_PREFIX + this.workspaceKey;
    this._memStorage = Object.create(null);
    this._memOnlyKeys = Object.create(null);
    this._conversationGen = 0;
    this._activeCreateCtrl = null;
    this._createSessionInFlight = null;
    this._createSessionInFlightSignature = '';
    this._createLockTail = Promise.resolve();
    this._sendLockTail = Promise.resolve();
    this._sendMessageInFlight = null;
    this._sendMessageInFlightSignature = '';
    this._pendingClientMsg = null;
    this.visitorToken = this._loadOrCreateVisitorToken();

    var self = this;
    if (typeof global.addEventListener === 'function') {
      this._onStorageEvent = function (ev) {
        if (!ev) return;
        if (ev.key === self.storageKey || ev.key === self.visitorStorageKey) {
          delete self._memOnlyKeys[ev.key];
          self._syncFromStorage();
        }
      };
      global.addEventListener('storage', this._onStorageEvent);
    }
  }

  SourceRatingEmbedAdapter.prototype._storageGet = function (key) {
    if (this._memOnlyKeys[key]) {
      return Object.prototype.hasOwnProperty.call(this._memStorage, key) ? this._memStorage[key] : null;
    }
    try {
      if (global.localStorage) {
        var val = global.localStorage.getItem(key);
        if (val === null || val === undefined) {
          delete this._memStorage[key];
          return null;
        }
        this._memStorage[key] = val;
        return val;
      }
    } catch (e) {}
    return Object.prototype.hasOwnProperty.call(this._memStorage, key) ? this._memStorage[key] : null;
  };

  SourceRatingEmbedAdapter.prototype._storageSet = function (key, val) {
    var strVal = String(val);
    this._memStorage[key] = strVal;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, strVal);
        delete this._memOnlyKeys[key];
      } else {
        this._memOnlyKeys[key] = true;
      }
    } catch (e) {
      this._memOnlyKeys[key] = true;
    }
  };

  SourceRatingEmbedAdapter.prototype._storageRemove = function (key) {
    delete this._memStorage[key];
    delete this._memOnlyKeys[key];
    try {
      if (global.localStorage) global.localStorage.removeItem(key);
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype._loadOrCreateVisitorToken = function () {
    try {
      var raw = this._storageGet(this.visitorStorageKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.visitorToken === 'string' && parsed.visitorToken) {
          return parsed.visitorToken;
        }
      }
      var seed = { visitorId: makeUuid(), visitorToken: '' };
      this._storageSet(this.visitorStorageKey, JSON.stringify(seed));
      return null;
    } catch (e) {
      return null;
    }
  };

  SourceRatingEmbedAdapter.prototype._saveVisitorToken = function (token) {
    if (!token || typeof token !== 'string') return;
    this.visitorToken = token;
    try {
      var cur = {};
      var raw = this._storageGet(this.visitorStorageKey);
      if (raw) cur = JSON.parse(raw) || {};
      cur.visitorId = cur.visitorId || makeUuid();
      cur.visitorToken = token;
      cur.updatedAt = new Date().toISOString();
      this._storageSet(this.visitorStorageKey, JSON.stringify(cur));
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype._readPendingCreateRecord = function () {
    try {
      var raw = this._storageGet(this.pendingReqStorageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.clientRequestId === 'string' && parsed.clientRequestId.length >= 8) {
        return parsed;
      }
    } catch (e) {}
    return null;
  };

  SourceRatingEmbedAdapter.prototype._writePendingCreateRecord = function (rec) {
    if (!rec || !rec.clientRequestId) return;
    try {
      this._storageSet(this.pendingReqStorageKey, JSON.stringify(rec));
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype._clearPendingCreateIfMatches = function (expectedReqId) {
    if (!expectedReqId) return;
    var cur = this._readPendingCreateRecord();
    if (cur && cur.clientRequestId === expectedReqId) {
      this._storageRemove(this.pendingReqStorageKey);
    }
  };

  SourceRatingEmbedAdapter.prototype._loadSession = function () {
    try {
      var raw = this._storageGet(this.storageKey);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && (parsed.visitorToken || parsed.guestToken)) {
        this._saveVisitorToken(parsed.visitorToken || parsed.guestToken);
      }
      return parsed;
    } catch (e) {
      return null;
    }
  };

  SourceRatingEmbedAdapter.prototype._syncFromStorage = function () {
    var stored = this._loadSession();
    var modeMatches = !stored || (this.mode === 'mock' ? Boolean(stored.isMock) : !stored.isMock);
    if (stored && stored.sessionId && (stored.visitorToken || stored.guestToken) && modeMatches) {
      this.session = stored;
    } else if (!stored) {
      this.session = null;
    }
    this._loadOrCreateVisitorToken();
    return this.session;
  };

  SourceRatingEmbedAdapter.prototype._saveSession = function (sess) {
    this.session = sess;
    if (sess && (sess.visitorToken || sess.guestToken)) {
      this._saveVisitorToken(sess.visitorToken || sess.guestToken);
    }
    if (sess) this._storageSet(this.storageKey, JSON.stringify(sess));
    else this._storageRemove(this.storageKey);
  };

  SourceRatingEmbedAdapter.prototype._clearSessionIfMatches = function (expectedSessionId, expectedToken, expectedGen) {
    this._syncFromStorage();
    var stored = this._loadSession();
    var storedTok = stored ? (stored.visitorToken || stored.guestToken || '') : '';
    var storageMatches = Boolean(stored && stored.sessionId === expectedSessionId && storedTok === expectedToken);
    if (storageMatches) {
      this._storageRemove(this.storageKey);
    }
    var curTok = this.session ? (this.session.visitorToken || this.session.guestToken || '') : '';
    var memMatches = Boolean(this.session && this.session.sessionId === expectedSessionId && curTok === expectedToken);
    if (memMatches && (expectedGen === undefined || this._conversationGen === expectedGen)) {
      this.session = null;
      this.messages = [];
      return true;
    }
    return false;
  };

  SourceRatingEmbedAdapter.prototype.clearSession = function () {
    this._conversationGen += 1;
    if (this._activeCreateCtrl && typeof this._activeCreateCtrl.abort === 'function') {
      try { this._activeCreateCtrl.abort(); } catch (e) {}
      this._activeCreateCtrl = null;
    }
    this._createSessionInFlight = null;
    this._createSessionInFlightSignature = '';
    this._sendMessageInFlight = null;
    this._sendMessageInFlightSignature = '';
    this._pendingClientMsg = null;
    this._saveSession(null);
    this._storageRemove(this.pendingReqStorageKey);
    this.messages = [];
  };

  SourceRatingEmbedAdapter.prototype._withCreateLock = async function (fn) {
    var self = this;
    var runLocked = async function () {
      if (global.navigator && global.navigator.locks && typeof global.navigator.locks.request === 'function') {
        return global.navigator.locks.request('sr_bridge_create_' + self.workspaceKey, fn);
      }
      return fn();
    };
    var prev = this._createLockTail;
    var next = prev.then(runLocked, runLocked);
    this._createLockTail = next.then(function () {}, function () {});
    return next;
  };

  SourceRatingEmbedAdapter.prototype._fetchJsonWithDeadline = async function (targetUrl, initObj, timeoutMs, externalSignal) {
    var ms = timeoutMs || this.requestTimeoutMs || 10000;
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var onExternalAbort = null;
    if (ctrl && externalSignal) {
      if (externalSignal.aborted) {
        ctrl.abort();
      } else if (typeof externalSignal.addEventListener === 'function') {
        onExternalAbort = function () { ctrl.abort(); };
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    try {
      var r = await fetch(targetUrl, ctrl ? Object.assign({}, initObj || {}, { signal: ctrl.signal }) : (initObj || {}));
      var d = null;
      try {
        d = await r.json();
      } catch (jsonErr) {
        if (jsonErr && (jsonErr.name === 'AbortError' || jsonErr.name === 'TimeoutError')) throw jsonErr;
        if (ctrl && ctrl.signal && ctrl.signal.aborted) {
          var abortErr = new Error('BRIDGE_TIMEOUT');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        d = {};
      }
      if (ctrl && ctrl.signal && ctrl.signal.aborted) {
        var postAbortErr = new Error('BRIDGE_TIMEOUT');
        postAbortErr.name = 'AbortError';
        throw postAbortErr;
      }
      return { res: r, data: d || {} };
    } finally {
      if (timer) clearTimeout(timer);
      if (externalSignal && onExternalAbort && typeof externalSignal.removeEventListener === 'function') {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  };

  SourceRatingEmbedAdapter.prototype._buildUrl = function (routeName, params) {
    params = params || {};
    if (this.apiBaseUrl) {
      if (routeName === 'health') return this.apiBaseUrl + '/api/bridge/v1/health?workspaceKey=' + encodeURIComponent(this.workspaceKey);
      if (routeName === 'sessions') return this.apiBaseUrl + '/api/bridge/v1/sessions';
      if (routeName === 'session') return this.apiBaseUrl + '/api/bridge/v1/sessions/' + encodeURIComponent(params.sessionId);
      if (routeName === 'messages') {
        var qs = params.afterSeq !== undefined ? ('?afterSeq=' + encodeURIComponent(params.afterSeq) + '&limit=50') : '';
        return this.apiBaseUrl + '/api/bridge/v1/sessions/' + encodeURIComponent(params.sessionId) + '/messages' + qs;
      }
      if (routeName === 'posts') {
        return this.apiBaseUrl + '/api/bridge/v1/posts' + (params.organizationId ? ('?organizationId=' + encodeURIComponent(params.organizationId)) : '');
      }
    }
    var sp = new URLSearchParams();
    sp.set('route', routeName);
    if (routeName === 'health') sp.set('workspaceKey', this.workspaceKey);
    if (params.sessionId) sp.set('sessionId', params.sessionId);
    if (params.organizationId) sp.set('organizationId', params.organizationId);
    if (params.afterSeq !== undefined) sp.set('afterSeq', String(params.afterSeq));
    return this.bridgeEndpoint + '?' + sp.toString();
  };

  SourceRatingEmbedAdapter.prototype._authedFetch = async function (routeName, paramsBuilder, options, retryOn401) {
    this._syncFromStorage();
    if (!this.session || !this.session.sessionId || !(this.session.visitorToken || this.session.guestToken)) {
      throw new Error('NO_ACTIVE_SESSION');
    }
    var myGen = this._conversationGen;
    var reqSessionId = this.session.sessionId;
    var reqToken = this.session.visitorToken || this.session.guestToken;
    var p = typeof paramsBuilder === 'function' ? paramsBuilder(reqSessionId) : (paramsBuilder || {});
    p.sessionId = reqSessionId;
    var url = this._buildUrl(routeName, p);
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {}, {
      Authorization: 'Bearer ' + reqToken,
    });
    var callOut = await this._fetchJsonWithDeadline(url, Object.assign({}, options, { headers: headers }), this.requestTimeoutMs);
    var res = callOut.res;
    if (res.status === 401 && retryOn401 !== false) {
      var clearedCur = this._clearSessionIfMatches(reqSessionId, reqToken, myGen);
      if (!clearedCur && this._conversationGen !== myGen) {
        return { res: res, data: callOut.data, sessionReset: false, obsolete: true };
      }
      if (!clearedCur) {
        // Stale 401 from an older session; newer session in storage stays untouched
        return { res: res, data: callOut.data, sessionReset: false, staleSessionIgnored: true };
      }
      return { res: res, data: callOut.data, sessionReset: true };
    }
    return { res: res, data: callOut.data, sessionReset: false, obsolete: this._conversationGen !== myGen };
  };

  SourceRatingEmbedAdapter.prototype.init = async function () {
    if (this.forceOffline) {
      this.mode = 'offline';
      this.isMock = false;
      this.onStatusChange({ mode: 'offline', online: false, isMock: false });
      return { ok: false, mode: 'offline', isMock: false };
    }

    var myGen = this._conversationGen;
    var liveHealth = null;
    try {
      if (typeof fetch === 'function') {
        var hOut = await this._fetchJsonWithDeadline(this._buildUrl('health'), { method: 'GET', headers: { Accept: 'application/json' } }, this.requestTimeoutMs);
        if (hOut.res.ok && hOut.data && hOut.data.ok && hOut.data.configured) {
          liveHealth = hOut.data;
        }
      }
    } catch (e) {
      liveHealth = null;
    }

    if (liveHealth) {
      this.mode = 'live';
      this.isMock = false;
      this.organizationId = liveHealth.organizationId || null;
      this.challengeToken = liveHealth.challengeToken || null;
      this._syncFromStorage();
      if (this.session && this.session.isMock) {
        this._saveSession(null);
      }
      if (this.session && this.session.sessionId) {
        var listRes = await this.listMessages();
        if (this._conversationGen !== myGen) {
          return { ok: false, obsolete: true, mode: 'live', isMock: false };
        }
        if (!listRes.ok && listRes.sessionReset) {
          this.messages = [];
        }
      }
      this.onStatusChange({
        mode: 'live',
        online: !!liveHealth.online,
        isMock: false,
        workspaceName: liveHealth.workspaceName || '',
        sessionId: this.session ? this.session.sessionId : '',
      });
      return {
        ok: true,
        mode: 'live',
        isMock: false,
        session: this.session,
        messages: this.messages,
      };
    }

    if (this.mockFallback && global.ANTHAI_SR_MOCK && typeof global.ANTHAI_SR_MOCK.createTransport === 'function') {
      this.mockTransport = global.ANTHAI_SR_MOCK.createTransport(this.workspaceKey);
      var mHealth = await this.mockTransport.health();
      this.mode = 'mock';
      this.isMock = true;
      this.organizationId = mHealth.organizationId || null;
      this.challengeToken = mHealth.challengeToken || null;
      this._syncFromStorage();
      if (this.session && !this.session.isMock) {
        this._saveSession(null);
      }
      if (this.session && this.session.sessionId) {
        var mList = await this.listMessages();
        if (this._conversationGen !== myGen) {
          return { ok: false, obsolete: true, mode: 'mock', isMock: true };
        }
        if (!mList.ok && mList.sessionReset) {
          this.messages = [];
        }
      }
      this.onStatusChange({
        mode: 'mock',
        online: true,
        isMock: true,
        mockReason: mHealth.mockReason || 'staging_protected_302',
        workspaceName: mHealth.workspaceName || '',
        sessionId: this.session ? this.session.sessionId : '',
      });
      return {
        ok: true,
        mode: 'mock',
        isMock: true,
        session: this.session,
        messages: this.messages,
      };
    }

    this.mode = 'unconfigured';
    this.isMock = false;
    this.onStatusChange({ mode: 'unconfigured', online: false, isMock: false });
    return { ok: false, mode: 'unconfigured', isMock: false };
  };

  SourceRatingEmbedAdapter.prototype._dispatchCreateSession = async function (reqInput, myGen) {
    var self = this;
    var pageUrl = (global.location && global.location.href) ? global.location.href : 'https://an-thai.com/';
    if (global.location && global.location.protocol === 'file:') pageUrl = 'http://127.0.0.1/';

    var fingerprint = computePayloadFingerprint(reqInput);
    var rec = {
      clientRequestId: reqInput.clientRequestId,
      fingerprint: fingerprint,
      message: String(reqInput.message || '').trim(),
      roomLabel: reqInput.roomLabel ? String(reqInput.roomLabel).slice(0, 120) : undefined,
      channelSlug: reqInput.channelSlug || 'web-inquiry',
      website_url: reqInput.website_url || '',
      ambiguous: true,
    };
    this._writePendingCreateRecord(rec);

    var payload = {
      workspaceKey: this.workspaceKey,
      callerKind: this.callerKind,
      clientRequestId: rec.clientRequestId,
      message: rec.message,
      roomLabel: rec.roomLabel,
      website_url: rec.website_url,
      sourceMetadata: {
        pageUrl: pageUrl.slice(0, 500),
        locale: (this.defaultLang === 'zh' || this.defaultLang === 'th') ? this.defaultLang : 'en',
        channelSlug: rec.channelSlug,
      },
    };

    if (this.mode === 'mock' && this.mockTransport) {
      var mockRes = await this.mockTransport.createSession(payload);
      if (this._conversationGen !== myGen) {
        return { ok: false, obsolete: true, error: 'SESSION_SUPERSEDED', isMock: true, persistedToSr: false };
      }
      if (mockRes.ok && mockRes.sessionId) {
        var mSess = {
          sessionId: mockRes.sessionId,
          visitorToken: mockRes.visitorToken,
          guestToken: mockRes.visitorToken,
          requestId: mockRes.requestId,
          expiresAt: mockRes.expiresAt,
          status: mockRes.status,
          isMock: true,
        };
        this._saveSession(mSess);
        this._clearPendingCreateIfMatches(payload.clientRequestId);
        this.onStatusChange({ mode: 'mock', online: true, isMock: true, sessionId: mSess.sessionId });
        return Object.assign({ ok: true, isMock: true, persistedToSr: false, createdByThisCall: true }, mSess);
      }
      rec.ambiguous = false;
      this._writePendingCreateRecord(rec);
      return mockRes;
    }

    if (this.mode !== 'live') {
      this._clearPendingCreateIfMatches(payload.clientRequestId);
      return { ok: false, error: 'BRIDGE_NOT_LIVE', persistedToSr: false, isMock: false };
    }

    var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (this.challengeToken) {
      headers['x-bridge-challenge'] = this.challengeToken;
      headers['x-turnstile-token'] = this.challengeToken;
    }

    var createCtrl = typeof AbortController === 'function' ? new AbortController() : null;
    this._activeCreateCtrl = createCtrl;
    var fetchJsonWithDeadline = function (targetUrl, initObj) {
      return self._fetchJsonWithDeadline(targetUrl, initObj, Math.min(9000, self.requestTimeoutMs || 9000), createCtrl ? createCtrl.signal : null);
    };

    var callOut;
    try {
      callOut = await fetchJsonWithDeadline(this._buildUrl('sessions'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
      if (callOut.res.status === 409 && this._conversationGen === myGen) {
        if (!callOut.data || !callOut.data.error || callOut.data.error === 'IDEMPOTENCY_TOKEN_UNRECOVERABLE') {
          var prevReqId = payload.clientRequestId;
          payload.clientRequestId = makeUuid();
          rec.clientRequestId = payload.clientRequestId;
          this._clearPendingCreateIfMatches(prevReqId);
          this._writePendingCreateRecord(rec);
        }
        callOut = await fetchJsonWithDeadline(this._buildUrl('sessions'), {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      if (this._conversationGen !== myGen) {
        return { ok: false, obsolete: true, error: 'SESSION_SUPERSEDED', persistedToSr: false, isMock: false };
      }
      var errName = e && e.name ? e.name : '';
      return { ok: false, ambiguous: true, error: (errName === 'AbortError' || errName === 'TimeoutError') ? 'BRIDGE_TIMEOUT' : ((e && e.message) ? e.message : 'NETWORK_ERROR'), persistedToSr: false, isMock: false };
    } finally {
      if (this._activeCreateCtrl === createCtrl) this._activeCreateCtrl = null;
    }

    if (this._conversationGen !== myGen) {
      return { ok: false, obsolete: true, error: 'SESSION_SUPERSEDED', persistedToSr: false, isMock: false };
    }

    var res = callOut.res;
    var data = callOut.data;
    if (!res.ok || !data.ok) {
      // 502/504 may still be ambiguous upstream; clear ambiguous only on definitive client/service rejections
      if (res.status !== 502 && res.status !== 504) {
        rec.ambiguous = false;
        this._writePendingCreateRecord(rec);
      }
      return { ok: false, error: data.error || ('HTTP_' + res.status), statusCode: res.status, persistedToSr: false, isMock: false };
    }

    if (data.status === 'filtered') {
      this._clearPendingCreateIfMatches(payload.clientRequestId);
      return data;
    }
    var tok = data.visitorToken || data.guestToken || this.visitorToken;
    if (!data.sessionId || !tok) {
      return { ok: false, error: 'INVALID_SESSION_RESPONSE', persistedToSr: false, isMock: false };
    }
    var sess = {
      sessionId: data.sessionId,
      visitorToken: tok,
      guestToken: tok,
      requestId: data.requestId,
      expiresAt: data.expiresAt,
      status: data.status || 'ai_active',
      isMock: false,
    };
    // Save validated session BEFORE clearing its matching pending create record
    this._saveSession(sess);
    this._clearPendingCreateIfMatches(payload.clientRequestId);
    this.onStatusChange({ mode: 'live', online: true, isMock: false, sessionId: sess.sessionId });
    return Object.assign({ ok: true, persistedToSr: true, isMock: false, createdByThisCall: true }, sess);
  };

  SourceRatingEmbedAdapter.prototype.createSession = async function (input) {
    input = input || {};
    var self = this;
    var myGen = this._conversationGen;
    var opSig = computePayloadFingerprint(input);
    while (this._createSessionInFlight) {
      if (this._createSessionInFlightSignature === opSig && !input.forceNew) {
        return this._createSessionInFlight;
      }
      try { await this._createSessionInFlight; } catch (e) {}
      if (this._conversationGen !== myGen) {
        return { ok: false, sessionReset: false, obsolete: true, error: 'SESSION_SUPERSEDED', persistedToSr: false, isMock: Boolean(this.isMock) };
      }
    }
    if (this._conversationGen !== myGen) {
      return { ok: false, sessionReset: false, obsolete: true, error: 'SESSION_SUPERSEDED', persistedToSr: false, isMock: Boolean(this.isMock) };
    }

    var promise = this._withCreateLock(async function () {
      if (self._conversationGen !== myGen) {
        return { ok: false, sessionReset: false, obsolete: true, error: 'SESSION_SUPERSEDED', persistedToSr: false, isMock: Boolean(self.isMock) };
      }
      self._syncFromStorage();
      if (!input.forceNew && self.session && self.session.sessionId && (self.session.visitorToken || self.session.guestToken)) {
        return Object.assign({
          ok: true,
          isMock: Boolean(self.session.isMock),
          persistedToSr: !self.session.isMock,
          reusedExistingSession: true,
          createdByThisCall: false,
        }, self.session);
      }

      var pending = self._readPendingCreateRecord();
      if (!input.forceNew && pending) {
        if (pending.fingerprint === opSig) {
          var retryRes = await self._dispatchCreateSession({
            clientRequestId: input.clientRequestId || pending.clientRequestId,
            message: input.message,
            roomLabel: input.roomLabel,
            channelSlug: input.channelSlug,
            website_url: input.website_url,
          }, myGen);
          return retryRes;
        }
        if (pending.ambiguous) {
          // Reconcile the earlier ambiguous create with its OWN bound payload before delivering different text
          var recOut = await self._dispatchCreateSession(pending, myGen);
          if (!recOut || !recOut.ok || !recOut.sessionId) {
            return recOut || { ok: false, error: 'PENDING_CREATE_RECONCILE_FAILED', persistedToSr: false, isMock: Boolean(self.isMock) };
          }
          return Object.assign({}, recOut, {
            reusedExistingSession: true,
            createdByThisCall: false,
            reconciledDifferentPayload: true,
          });
        }
        self._storageRemove(self.pendingReqStorageKey);
      }

      return self._dispatchCreateSession({
        clientRequestId: input.clientRequestId || makeUuid(),
        message: input.message,
        roomLabel: input.roomLabel,
        channelSlug: input.channelSlug,
        website_url: input.website_url,
      }, myGen);
    });

    this._createSessionInFlight = promise;
    this._createSessionInFlightSignature = opSig;
    try {
      return await promise;
    } finally {
      if (this._createSessionInFlight === promise) {
        this._createSessionInFlight = null;
        this._createSessionInFlightSignature = '';
      }
    }
  };

  SourceRatingEmbedAdapter.prototype.getSession = async function () {
    this._syncFromStorage();
    if (!this.session || !this.session.sessionId) return { ok: false, error: 'NO_ACTIVE_SESSION' };
    var myGen = this._conversationGen;
    var reqSid = this.session.sessionId;
    var reqTok = this.session.visitorToken || this.session.guestToken;
    if (this.mode === 'mock' && this.mockTransport) {
      var mOut = await this.mockTransport.getSession(reqSid, reqTok);
      if (this._conversationGen !== myGen) return { ok: false, obsolete: true, error: 'SESSION_SUPERSEDED', isMock: true };
      if (!mOut.ok && mOut.statusCode === 401) {
        var cleared = this._clearSessionIfMatches(reqSid, reqTok, myGen);
        return { ok: false, sessionReset: cleared, staleSessionIgnored: !cleared, error: 'Unauthorized', isMock: true };
      }
      return mOut;
    }
    if (this.mode !== 'live') return { ok: false, error: 'BRIDGE_NOT_LIVE' };
    try {
      var out = await this._authedFetch('session', null, { method: 'GET' });
      if (out.obsolete || this._conversationGen !== myGen) return { ok: false, sessionReset: false, obsolete: true, error: 'SESSION_SUPERSEDED' };
      if (out.staleSessionIgnored) return { ok: false, sessionReset: false, staleSessionIgnored: true, error: 'STALE_SESSION' };
      if (out.sessionReset) return { ok: false, sessionReset: true, error: 'Unauthorized' };
      var data = out.data || {};
      if (!out.res.ok) return { ok: false, error: data.error || ('HTTP_' + out.res.status) };
      return data;
    } catch (e) {
      var errN = e && e.name ? e.name : '';
      return { ok: false, error: (errN === 'AbortError' || errN === 'TimeoutError') ? 'BRIDGE_TIMEOUT' : ((e && e.message) ? e.message : 'NETWORK_ERROR') };
    }
  };

  SourceRatingEmbedAdapter.prototype.listMessages = async function (afterSeq) {
    this._syncFromStorage();
    if (!this.session || !this.session.sessionId) return { ok: false, messages: [], error: 'NO_ACTIVE_SESSION' };
    var myGen = this._conversationGen;
    var reqSid = this.session.sessionId;
    var reqTok = this.session.visitorToken || this.session.guestToken;
    if (this.mode === 'mock' && this.mockTransport) {
      var mList = await this.mockTransport.listMessages(reqSid, reqTok, afterSeq || 0);
      if (this._conversationGen !== myGen) return { ok: false, sessionReset: false, messages: [], obsolete: true, error: 'SESSION_SUPERSEDED', isMock: true };
      if (!mList.ok && mList.statusCode === 401) {
        var clearedM = this._clearSessionIfMatches(reqSid, reqTok, myGen);
        return { ok: false, messages: [], sessionReset: clearedM, staleSessionIgnored: !clearedM, error: 'Unauthorized', isMock: true };
      }
      if (this.session && this.session.sessionId === reqSid) {
        this.messages = Array.isArray(mList.messages) ? mList.messages : [];
      }
      return mList;
    }
    if (this.mode !== 'live') return { ok: false, messages: [], error: 'BRIDGE_NOT_LIVE' };
    try {
      var cursor = afterSeq || 0;
      var combined = [];
      var seenKeys = Object.create(null);
      var lastData = {};
      for (var page = 0; page < 200; page++) {
        if (this._conversationGen !== myGen) return { ok: false, sessionReset: false, messages: [], obsolete: true, error: 'SESSION_SUPERSEDED' };
        var pageCursor = cursor;
        var out = await this._authedFetch('messages', function () { return { afterSeq: pageCursor }; }, { method: 'GET' });
        if (out.obsolete || this._conversationGen !== myGen) return { ok: false, sessionReset: false, messages: [], obsolete: true, error: 'SESSION_SUPERSEDED' };
        if (out.staleSessionIgnored) return { ok: false, sessionReset: false, messages: this.messages || [], staleSessionIgnored: true, error: 'STALE_SESSION' };
        if (out.sessionReset) return { ok: false, messages: [], sessionReset: true, error: 'Unauthorized' };
        var data = out.data || {};
        if (!out.res.ok) return { ok: false, messages: [], error: data.error || ('HTTP_' + out.res.status) };
        lastData = data;
        var batch = Array.isArray(data.messages) ? data.messages : [];
        for (var i = 0; i < batch.length; i++) {
          var item = batch[i];
          var msgKey = item && (item.id || (typeof item.seq !== 'undefined' ? 'seq:' + item.seq : ''));
          if (msgKey) {
            if (seenKeys[msgKey]) continue;
            seenKeys[msgKey] = true;
          }
          combined.push(item);
        }
        var nextCur = (typeof data.nextAfterSeq === 'number') ? data.nextAfterSeq : null;
        if (!batch.length || nextCur === null || nextCur <= pageCursor || (!data.hasMore && batch.length < 50)) break;
        cursor = nextCur;
      }
      if (this._conversationGen !== myGen) return { ok: false, sessionReset: false, messages: [], obsolete: true, error: 'SESSION_SUPERSEDED' };
      this.messages = combined;
      return Object.assign({ ok: true, isMock: false }, lastData, { messages: combined });
    } catch (e) {
      var errN = e && e.name ? e.name : '';
      return { ok: false, messages: this.messages || [], error: (errN === 'AbortError' || errN === 'TimeoutError') ? 'BRIDGE_TIMEOUT' : ((e && e.message) ? e.message : 'NETWORK_ERROR') };
    }
  };

  SourceRatingEmbedAdapter.prototype.sendMessage = async function (payload) {
    payload = payload || {};
    if (this.mode !== 'live' && this.mode !== 'mock') {
      return { ok: false, persisted: false, error: 'BRIDGE_NOT_CONNECTED' };
    }

    var rawInputText = String(payload.text || '').trim();
    var sendSig = [
      rawInputText,
      payload.requestHandoff ? '1' : '0',
      String(payload.takeoverReason || ''),
      payload.clientMsgId ? String(payload.clientMsgId) : '',
    ].join('|');
    if (this._sendMessageInFlight && payload._dedupeConcurrent !== false && this._sendMessageInFlightSignature === sendSig) {
      return this._sendMessageInFlight;
    }

    var self = this;
    var myGen = this._conversationGen;
    var runPromise = (async function () {
      if (self._conversationGen !== myGen) {
        return { ok: false, obsolete: true, persisted: false, error: 'SESSION_SUPERSEDED' };
      }
      self._syncFromStorage();
      var createdThisCall = false;
      if (!self.session || !self.session.sessionId) {
        var initialText = payload.requestHandoff && !payload.hasExplicitText
          ? 'Technical inquiry opened from inquiry desk.'
          : payload.text;
        var created = await self.createSession({
          clientRequestId: payload.clientRequestId,
          message: initialText,
          roomLabel: payload.roomLabel,
          channelSlug: payload.requestHandoff ? 'handoff-request' : (payload.channelSlug || 'web-chat'),
        });
        if (self._conversationGen !== myGen || (created && created.obsolete)) {
          return { ok: false, obsolete: true, persisted: false, error: 'SESSION_SUPERSEDED' };
        }
        if (!created || !created.ok || !created.sessionId) {
          return created || { ok: false, persisted: false, error: 'CREATE_SESSION_FAILED' };
        }
        // Only return early if THIS createSession call actually sent payload's own initialText (and no handoff update is needed).
        // If another tab, Contact form, or ambiguous reconcile created/reused the session with a DIFFERENT payload, fall through and POST this message!
        if (created.createdByThisCall && !created.reconciledDifferentPayload && !payload.requestHandoff) {
          return created;
        }
        createdThisCall = Boolean(created.createdByThisCall && !created.reconciledDifferentPayload);
      }

      var msgText = (createdThisCall && payload.requestHandoff && payload.hasExplicitText)
        ? 'Visitor requested engineering team handover.'
        : rawInputText;

      var clientMsgId = payload.clientMsgId;
      if (!clientMsgId) {
        if (self._pendingClientMsg && self._pendingClientMsg.text === msgText) {
          clientMsgId = self._pendingClientMsg.id;
        } else {
          clientMsgId = makeUuid();
          self._pendingClientMsg = { text: msgText, id: clientMsgId };
        }
      }

      var reqSid = self.session.sessionId;
      var reqTok = self.session.visitorToken || self.session.guestToken;
      var body = {
        clientMsgId: clientMsgId,
        text: msgText,
        ...(payload.requestHandoff ? { requestHandoff: true } : {}),
        ...(payload.takeoverReason ? { takeoverReason: String(payload.takeoverReason).slice(0, 500) } : {}),
      };

      if (self.mode === 'mock' && self.mockTransport) {
        var mRes = await self.mockTransport.sendMessage(reqSid, reqTok, body);
        if (self._conversationGen !== myGen) return { ok: false, obsolete: true, persisted: false, error: 'SESSION_SUPERSEDED', isMock: true };
        if (!mRes.ok && mRes.statusCode === 401) {
          var clearedM = self._clearSessionIfMatches(reqSid, reqTok, myGen);
          return { ok: false, sessionReset: clearedM, staleSessionIgnored: !clearedM, persisted: false, error: 'Unauthorized', isMock: true };
        }
        if (mRes.ok) self._pendingClientMsg = null;
        if (mRes.ok && mRes.sessionStatus && self.session && self.session.sessionId === reqSid) {
          self._saveSession(Object.assign({}, self.session, { status: mRes.sessionStatus }));
        }
        return mRes;
      }

      var out;
      try {
        out = await self._authedFetch('messages', null, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (e) {
        if (self._conversationGen !== myGen) return { ok: false, obsolete: true, persisted: false, error: 'SESSION_SUPERSEDED', isMock: false };
        var errN = e && e.name ? e.name : '';
        return { ok: false, persisted: false, error: (errN === 'AbortError' || errN === 'TimeoutError') ? 'BRIDGE_TIMEOUT' : ((e && e.message) ? e.message : 'NETWORK_ERROR'), isMock: false };
      }
      if (out.obsolete || self._conversationGen !== myGen) {
        return { ok: false, sessionReset: false, obsolete: true, persisted: false, error: 'SESSION_SUPERSEDED', isMock: false };
      }
      if (out.staleSessionIgnored) {
        return { ok: false, sessionReset: false, staleSessionIgnored: true, persisted: false, error: 'STALE_SESSION', isMock: false };
      }
      if (out.sessionReset) {
        return { ok: false, sessionReset: true, persisted: false, error: 'Unauthorized', isMock: false };
      }
      var data = out.data || {};
      if (!out.res.ok) {
        return { ok: false, persisted: false, error: data.error || ('HTTP_' + out.res.status), isMock: false };
      }
      self._pendingClientMsg = null;
      var nextStatus = data.sessionStatus || (payload.requestHandoff ? 'waiting_human' : undefined) || (self.session && self.session.status) || undefined;
      if (nextStatus && self.session && self.session.sessionId === reqSid) {
        self._saveSession(Object.assign({}, self.session, { status: nextStatus }));
      }
      return Object.assign({
        ok: true,
        persisted: true,
        isMock: false,
        sessionStatus: nextStatus,
        sessionId: reqSid,
      }, data);
    });

    var prev = this._sendLockTail;
    var chained = prev.then(runPromise, runPromise);
    this._sendLockTail = chained.then(function () {}, function () {});
    this._sendMessageInFlight = chained;
    this._sendMessageInFlightSignature = sendSig;
    try {
      return await chained;
    } finally {
      if (this._sendMessageInFlight === chained) {
        this._sendMessageInFlight = null;
        this._sendMessageInFlightSignature = '';
      }
    }
  };

  SourceRatingEmbedAdapter.prototype.submitStructuredInquiry = async function (input) {
    input = input || {};
    if (this.mode !== 'live' && this.mode !== 'mock') {
      return { ok: false, persistedToSr: false, isMock: false, error: 'BRIDGE_NOT_CONNECTED' };
    }
    var brief = String(input.message || '').trim();
    if (!brief) return { ok: false, error: 'EMPTY_INQUIRY' };
    var myGen = this._conversationGen;

    var res = await this.createSession({
      clientRequestId: input.clientRequestId,
      message: brief,
      roomLabel: input.roomLabel,
      website_url: input.website_url,
      channelSlug: input.channelSlug || 'contact-scope-form',
    });
    if (this._conversationGen !== myGen || (res && res.obsolete)) {
      return { ok: false, obsolete: true, error: 'SESSION_SUPERSEDED', isMock: Boolean(this.isMock), persistedToSr: false };
    }
    if (res && res.status === 'filtered') return res;
    if (!res || !res.ok || !res.sessionId) {
      return res || { ok: false, error: 'CREATE_SESSION_FAILED', isMock: Boolean(this.isMock), persistedToSr: false };
    }
    // If another operation/tab already created the session, deliver the structured brief separately
    if (!res.createdByThisCall) {
      var msgRes = await this.sendMessage({
        text: brief,
        clientMsgId: input.clientMsgId,
        channelSlug: input.channelSlug || 'contact-scope-form',
        roomLabel: input.roomLabel,
      });
      if (!msgRes || !msgRes.ok) {
        return Object.assign({}, msgRes || { ok: false, error: 'BRIEF_MESSAGE_FAILED' }, {
          persistedToSr: false,
          isMock: Boolean(this.isMock),
        });
      }
      var curSess = this.session || res;
      return Object.assign({}, curSess, msgRes, {
        ok: true,
        sessionId: curSess.sessionId || res.sessionId,
        requestId: curSess.requestId || res.requestId,
        persistedToSr: !this.isMock,
        isMock: Boolean(this.isMock),
      });
    }
    return res;
  };

  SourceRatingEmbedAdapter.prototype.requestHumanHandoff = async function (payload) {
    payload = payload || {};
    return this.sendMessage({
      text: payload.text || 'Visitor requested engineering team handover.',
      hasExplicitText: Boolean(payload.text),
      requestHandoff: true,
      takeoverReason: payload.reason || 'visitor_requested',
    });
  };

  SourceRatingEmbedAdapter.prototype.listPublicPosts = async function () {
    if (this.forceOffline) return { ok: false, posts: [], isMock: false };
    if (this.mode === 'mock' && this.mockTransport) {
      var mPosts = await this.mockTransport.listPublicPosts();
      this.posts = Array.isArray(mPosts.posts) ? mPosts.posts : [];
      return mPosts;
    }
    if (this.mode !== 'live') return { ok: false, posts: [], isMock: false };
    try {
      var pOut = await this._fetchJsonWithDeadline(this._buildUrl('posts', { organizationId: this.organizationId }), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }, this.requestTimeoutMs);
      if (!pOut.res.ok) return { ok: false, posts: [], error: 'HTTP_' + pOut.res.status, isMock: false };
      var data = pOut.data || {};
      var list = Array.isArray(data.posts) ? data.posts : [];
      this.posts = list.filter(function (p) {
        return p && p.visibility === 'public' && (p.publish_status === 'published' || p.publish_status === 'corrected');
      });
      return { ok: true, posts: this.posts, isMock: false };
    } catch (e) {
      return { ok: false, posts: [], error: e.message, isMock: false };
    }
  };

  global.SourceRatingEmbedAdapter = SourceRatingEmbedAdapter;
})(window);

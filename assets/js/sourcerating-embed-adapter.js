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

  function SourceRatingEmbedAdapter(config) {
    config = config || {};
    this.bridgeEndpoint = (config.bridgeEndpoint || '/api/sr-bridge').replace(/\/$/, '');
    this.apiBaseUrl = (config.apiBaseUrl || '').replace(/\/$/, '');
    this.workspaceKey = config.workspaceKey || 'an-thai-th';
    this.callerKind = config.callerKind || 'an_thai_v1_1';
    this.defaultLang = config.defaultLang || 'en';
    this.mockFallback = Boolean(config.mockFallback);
    this.forceOffline = Boolean(config.forceOffline);
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
    this._createSessionInFlight = null;
    this._sendMessageInFlight = null;
    this._sendMessageInFlightText = '';
    this._pendingClientMsg = null;
    this.visitorToken = this._loadOrCreateVisitorToken();
  }

  SourceRatingEmbedAdapter.prototype._loadOrCreateVisitorToken = function () {
    try {
      if (!global.localStorage) return null;
      var raw = global.localStorage.getItem(this.visitorStorageKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.visitorToken === 'string' && parsed.visitorToken) {
          return parsed.visitorToken;
        }
      }
      var seed = { visitorId: makeUuid(), visitorToken: '' };
      global.localStorage.setItem(this.visitorStorageKey, JSON.stringify(seed));
      return null;
    } catch (e) {
      return null;
    }
  };

  SourceRatingEmbedAdapter.prototype._saveVisitorToken = function (token) {
    if (!token || typeof token !== 'string') return;
    this.visitorToken = token;
    try {
      if (!global.localStorage) return;
      var cur = {};
      var raw = global.localStorage.getItem(this.visitorStorageKey);
      if (raw) cur = JSON.parse(raw) || {};
      cur.visitorId = cur.visitorId || makeUuid();
      cur.visitorToken = token;
      cur.updatedAt = new Date().toISOString();
      global.localStorage.setItem(this.visitorStorageKey, JSON.stringify(cur));
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype._getOrCreatePendingClientRequestId = function (explicitId) {
    if (explicitId && typeof explicitId === 'string') {
      try {
        if (global.localStorage) global.localStorage.setItem(this.pendingReqStorageKey, explicitId);
      } catch (e) {}
      return explicitId;
    }
    try {
      if (global.localStorage) {
        var existing = global.localStorage.getItem(this.pendingReqStorageKey);
        if (existing && typeof existing === 'string' && existing.length >= 8) return existing;
      }
    } catch (e) {}
    var created = makeUuid();
    try {
      if (global.localStorage) global.localStorage.setItem(this.pendingReqStorageKey, created);
    } catch (e) {}
    return created;
  };

  SourceRatingEmbedAdapter.prototype._rotatePendingClientRequestId = function () {
    var nextId = makeUuid();
    try {
      if (global.localStorage) global.localStorage.setItem(this.pendingReqStorageKey, nextId);
    } catch (e) {}
    return nextId;
  };

  SourceRatingEmbedAdapter.prototype._clearPendingClientRequestId = function () {
    try {
      if (global.localStorage) global.localStorage.removeItem(this.pendingReqStorageKey);
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype._loadSession = function () {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(this.storageKey) : null;
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && (parsed.visitorToken || parsed.guestToken)) {
        this._saveVisitorToken(parsed.visitorToken || parsed.guestToken);
      }
      return parsed;
    } catch (e) {
      return null;
    }
  };

  SourceRatingEmbedAdapter.prototype._saveSession = function (sess) {
    this.session = sess;
    if (sess && (sess.visitorToken || sess.guestToken)) {
      this._saveVisitorToken(sess.visitorToken || sess.guestToken);
    }
    try {
      if (!global.localStorage) return;
      if (sess) global.localStorage.setItem(this.storageKey, JSON.stringify(sess));
      else global.localStorage.removeItem(this.storageKey);
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype.clearSession = function () {
    this._saveSession(null);
    this._clearPendingClientRequestId();
    this._pendingClientMsg = null;
    this.messages = [];
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
    if (!this.session || !this.session.sessionId || !(this.session.visitorToken || this.session.guestToken)) {
      throw new Error('NO_ACTIVE_SESSION');
    }
    var token = this.session.visitorToken || this.session.guestToken;
    var p = typeof paramsBuilder === 'function' ? paramsBuilder(this.session.sessionId) : (paramsBuilder || {});
    p.sessionId = this.session.sessionId;
    var url = this._buildUrl(routeName, p);
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {}, {
      Authorization: 'Bearer ' + token,
    });
    var res = await fetch(url, Object.assign({}, options, { headers: headers }));
    if (res.status === 401 && retryOn401 !== false) {
      this._saveSession(null);
      return { res: res, sessionReset: true };
    }
    return { res: res, sessionReset: false };
  };

  SourceRatingEmbedAdapter.prototype.init = async function () {
    if (this.forceOffline) {
      this.mode = 'offline';
      this.isMock = false;
      this.onStatusChange({ mode: 'offline', online: false, isMock: false });
      return { ok: false, mode: 'offline', isMock: false };
    }

    var liveHealth = null;
    try {
      if (typeof fetch === 'function') {
        var hRes = await fetch(this._buildUrl('health'), { method: 'GET', headers: { Accept: 'application/json' } });
        if (hRes.ok) {
          var parsed = await hRes.json().catch(function () { return null; });
          if (parsed && parsed.ok && parsed.configured) liveHealth = parsed;
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
      this.session = this._loadSession();
      if (this.session && this.session.isMock) {
        this._saveSession(null);
      }
      if (this.session && this.session.sessionId) {
        var listRes = await this.listMessages();
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
      this.session = this._loadSession();
      if (this.session && !this.session.isMock) {
        this._saveSession(null);
      }
      if (this.session && this.session.sessionId) {
        var mList = await this.listMessages();
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

  SourceRatingEmbedAdapter.prototype.createSession = async function (input) {
    input = input || {};
    if (this._createSessionInFlight) {
      return this._createSessionInFlight;
    }
    if (!input.forceNew && this.session && this.session.sessionId && (this.session.visitorToken || this.session.guestToken)) {
      return Object.assign({
        ok: true,
        isMock: Boolean(this.session.isMock),
        persistedToSr: !this.session.isMock,
        reusedExistingSession: true,
      }, this.session);
    }

    var self = this;
    var promise = (async function () {
      var pageUrl = (global.location && global.location.href) ? global.location.href : 'https://an-thai.com/';
      if (global.location && global.location.protocol === 'file:') pageUrl = 'http://127.0.0.1/';
      var reqId = self._getOrCreatePendingClientRequestId(input.clientRequestId);
      var payload = {
        workspaceKey: self.workspaceKey,
        callerKind: self.callerKind,
        clientRequestId: reqId,
        message: String(input.message || '').trim(),
        roomLabel: input.roomLabel ? String(input.roomLabel).slice(0, 120) : undefined,
        website_url: input.website_url || '',
        sourceMetadata: {
          pageUrl: pageUrl.slice(0, 500),
          locale: (self.defaultLang === 'zh' || self.defaultLang === 'th') ? self.defaultLang : 'en',
          channelSlug: input.channelSlug || 'web-inquiry',
        },
      };

      if (self.mode === 'mock' && self.mockTransport) {
        var mockRes = await self.mockTransport.createSession(payload);
        if (mockRes.ok && mockRes.sessionId) {
          self._clearPendingClientRequestId();
          var mSess = {
            sessionId: mockRes.sessionId,
            visitorToken: mockRes.visitorToken,
            guestToken: mockRes.visitorToken,
            requestId: mockRes.requestId,
            expiresAt: mockRes.expiresAt,
            status: mockRes.status,
            isMock: true,
          };
          self._saveSession(mSess);
          self.onStatusChange({ mode: 'mock', online: true, isMock: true, sessionId: mSess.sessionId });
          return Object.assign({ ok: true, isMock: true, persistedToSr: false }, mSess);
        }
        return mockRes;
      }

      if (self.mode !== 'live') {
        return { ok: false, error: 'BRIDGE_NOT_LIVE', persistedToSr: false, isMock: false };
      }

      var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (self.challengeToken) {
        headers['x-bridge-challenge'] = self.challengeToken;
        headers['x-turnstile-token'] = self.challengeToken;
      }
      var fetchJsonWithDeadline = async function (targetUrl, initObj) {
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
        try {
          var r = await fetch(targetUrl, ctrl ? Object.assign({}, initObj, { signal: ctrl.signal }) : initObj);
          var d = null;
          try {
            d = await r.json();
          } catch (jsonErr) {
            if (jsonErr && (jsonErr.name === 'AbortError' || jsonErr.name === 'TimeoutError')) throw jsonErr;
            d = {};
          }
          return { res: r, data: d || {} };
        } finally {
          if (timer) clearTimeout(timer);
        }
      };
      var callOut;
      try {
        callOut = await fetchJsonWithDeadline(self._buildUrl('sessions'), {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        });
        if (callOut.res.status === 409) {
          // Contract 6.1: recover ONLY from unrecoverable 409; keep same clientRequestId otherwise
          if (!callOut.data || !callOut.data.error || callOut.data.error === 'IDEMPOTENCY_TOKEN_UNRECOVERABLE') {
            payload.clientRequestId = self._rotatePendingClientRequestId();
          }
          callOut = await fetchJsonWithDeadline(self._buildUrl('sessions'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
          });
        }
      } catch (e) {
        var errName = e && e.name ? e.name : '';
        return { ok: false, error: (errName === 'AbortError' || errName === 'TimeoutError') ? 'BRIDGE_TIMEOUT' : ((e && e.message) ? e.message : 'NETWORK_ERROR'), persistedToSr: false, isMock: false };
      }
      var res = callOut.res;
      var data = callOut.data;
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || ('HTTP_' + res.status), statusCode: res.status, persistedToSr: false, isMock: false };
      }
      self._clearPendingClientRequestId();
      if (data.status === 'filtered') return data;
      var tok = data.visitorToken || data.guestToken || self.visitorToken;
      var sess = {
        sessionId: data.sessionId,
        visitorToken: tok,
        guestToken: tok,
        requestId: data.requestId,
        expiresAt: data.expiresAt,
        status: data.status || 'ai_active',
        isMock: false,
      };
      self._saveSession(sess);
      self.onStatusChange({ mode: 'live', online: true, isMock: false, sessionId: sess.sessionId });
      return Object.assign({ ok: true, persistedToSr: true, isMock: false }, sess);
    })();

    this._createSessionInFlight = promise;
    try {
      return await promise;
    } finally {
      if (this._createSessionInFlight === promise) {
        this._createSessionInFlight = null;
      }
    }
  };

  SourceRatingEmbedAdapter.prototype.getSession = async function () {
    if (!this.session || !this.session.sessionId) return { ok: false, error: 'NO_ACTIVE_SESSION' };
    if (this.mode === 'mock' && this.mockTransport) {
      var mOut = await this.mockTransport.getSession(this.session.sessionId, this.session.visitorToken);
      if (!mOut.ok && mOut.statusCode === 401) {
        this._saveSession(null);
        return { ok: false, sessionReset: true, error: 'Unauthorized', isMock: true };
      }
      return mOut;
    }
    if (this.mode !== 'live') return { ok: false, error: 'BRIDGE_NOT_LIVE' };
    try {
      var out = await this._authedFetch('session', null, { method: 'GET' });
      if (out.sessionReset) return { ok: false, sessionReset: true, error: 'Unauthorized' };
      var data = await out.res.json().catch(function () { return {}; });
      if (!out.res.ok) return { ok: false, error: data.error || ('HTTP_' + out.res.status) };
      return data;
    } catch (e) {
      return { ok: false, error: (e && e.message) ? e.message : 'NETWORK_ERROR' };
    }
  };

  SourceRatingEmbedAdapter.prototype.listMessages = async function (afterSeq) {
    if (!this.session || !this.session.sessionId) return { ok: false, messages: [], error: 'NO_ACTIVE_SESSION' };
    if (this.mode === 'mock' && this.mockTransport) {
      var mList = await this.mockTransport.listMessages(this.session.sessionId, this.session.visitorToken, afterSeq || 0);
      if (!mList.ok && mList.statusCode === 401) {
        this._saveSession(null);
        return { ok: false, messages: [], sessionReset: true, error: 'Unauthorized', isMock: true };
      }
      this.messages = Array.isArray(mList.messages) ? mList.messages : [];
      return mList;
    }
    if (this.mode !== 'live') return { ok: false, messages: [], error: 'BRIDGE_NOT_LIVE' };
    try {
      var cursor = afterSeq || 0;
      var combined = [];
      var seenKeys = Object.create(null);
      var lastData = {};
      for (var page = 0; page < 200; page++) {
        var pageCursor = cursor;
        var out = await this._authedFetch('messages', function () { return { afterSeq: pageCursor }; }, { method: 'GET' });
        if (out.sessionReset) return { ok: false, messages: [], sessionReset: true, error: 'Unauthorized' };
        var data = await out.res.json().catch(function () { return {}; });
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
      this.messages = combined;
      return Object.assign({ ok: true, isMock: false }, lastData, { messages: combined });
    } catch (e) {
      return { ok: false, messages: this.messages || [], error: (e && e.message) ? e.message : 'NETWORK_ERROR' };
    }
  };

  SourceRatingEmbedAdapter.prototype.sendMessage = async function (payload) {
    payload = payload || {};
    if (this.mode !== 'live' && this.mode !== 'mock') {
      return { ok: false, persisted: false, error: 'BRIDGE_NOT_CONNECTED' };
    }

    var rawInputText = String(payload.text || '').trim();
    if (this._sendMessageInFlight) {
      if (payload._dedupeConcurrent !== false && this._sendMessageInFlightText === rawInputText) {
        return this._sendMessageInFlight;
      }
      await this._sendMessageInFlight;
    }

    var self = this;
    var runPromise = (async function () {
      var createdThisCall = false;
      if (!self.session || !self.session.sessionId) {
        var initialText = payload.requestHandoff && !payload.hasExplicitText
          ? 'Technical inquiry opened from inquiry desk.'
          : payload.text;
        var created = await self.createSession({
          clientRequestId: payload.clientRequestId,
          message: initialText,
          channelSlug: payload.requestHandoff ? 'handoff-request' : 'web-chat',
        });
        if (!created || !created.ok || !created.sessionId || !payload.requestHandoff) {
          return created;
        }
        createdThisCall = true;
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

      var body = {
        clientMsgId: clientMsgId,
        text: msgText,
        ...(payload.requestHandoff ? { requestHandoff: true } : {}),
        ...(payload.takeoverReason ? { takeoverReason: String(payload.takeoverReason).slice(0, 500) } : {}),
      };

      if (self.mode === 'mock' && self.mockTransport) {
        var mRes = await self.mockTransport.sendMessage(self.session.sessionId, self.session.visitorToken, body);
        if (!mRes.ok && mRes.statusCode === 401) {
          self._saveSession(null);
          return { ok: false, sessionReset: true, persisted: false, error: 'Unauthorized', isMock: true };
        }
        if (mRes.ok) self._pendingClientMsg = null;
        if (mRes.ok && mRes.sessionStatus && self.session) {
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
        return { ok: false, persisted: false, error: (e && e.message) ? e.message : 'NETWORK_ERROR', isMock: false };
      }
      if (out.sessionReset) {
        return { ok: false, sessionReset: true, persisted: false, error: 'Unauthorized', isMock: false };
      }
      var data = await out.res.json().catch(function () { return {}; });
      if (!out.res.ok) {
        return { ok: false, persisted: false, error: data.error || ('HTTP_' + out.res.status), isMock: false };
      }
      self._pendingClientMsg = null;
      var nextStatus = data.sessionStatus || (payload.requestHandoff ? 'waiting_human' : undefined) || (self.session && self.session.status) || undefined;
      if (nextStatus && self.session) {
        self._saveSession(Object.assign({}, self.session, { status: nextStatus }));
      }
      return Object.assign({
        ok: true,
        persisted: true,
        isMock: false,
        sessionStatus: nextStatus,
      }, data);
    })();

    this._sendMessageInFlight = runPromise;
    this._sendMessageInFlightText = rawInputText;
    try {
      return await runPromise;
    } finally {
      if (this._sendMessageInFlight === runPromise) {
        this._sendMessageInFlight = null;
        this._sendMessageInFlightText = '';
      }
    }
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
      var res = await fetch(this._buildUrl('posts', { organizationId: this.organizationId }), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return { ok: false, posts: [], error: 'HTTP_' + res.status, isMock: false };
      var data = await res.json().catch(function () { return {}; });
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

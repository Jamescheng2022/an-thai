/**
 * SourceRating Embed Adapter v2.2 (V5.2 P0-1 Audit Fix)
 * - Fixes 401 session recovery bug: _authedFetch accepts a pathBuilder(sessionId)
 *   function so after 401 -> createSession(), the retry ALWAYS uses the NEW
 *   sessionId paired with the NEW guestToken (never mixing old sessionId + new token).
 * - Flags `sessionReset: true` whenever an anonymous session was recreated so the
 *   UI honestly informs the visitor that prior unlinked history is not attached.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY_PREFIX = 'sr_embed_session_v2_';

  function SourceRatingEmbedAdapter(config) {
    config = config || {};
    this.apiBaseUrl = (config.apiBaseUrl || '').replace(/\/$/, '');
    this.workspaceKey = config.workspaceKey || 'an-thai-th';
    this.defaultLang = config.defaultLang || 'en';
    this.onStatusChange = typeof config.onStatusChange === 'function' ? config.onStatusChange : function () {};
    this.mode = 'initializing'; // 'live' | 'unconfigured' | 'offline'
    this.session = null;
    this.messages = [];
    this.storageKey = STORAGE_KEY_PREFIX + this.workspaceKey;
  }

  SourceRatingEmbedAdapter.prototype._loadSession = function () {
    try {
      var raw = global.localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  SourceRatingEmbedAdapter.prototype._saveSession = function (sess) {
    this.session = sess;
    try {
      if (sess) global.localStorage.setItem(this.storageKey, JSON.stringify(sess));
      else global.localStorage.removeItem(this.storageKey);
    } catch (e) {}
  };

  SourceRatingEmbedAdapter.prototype.clearSession = function () {
    this._saveSession(null);
    this.messages = [];
  };

  /**
   * P0-1 Fix: pathBuilder is a function (sessionId) => path string.
   * On HTTP 401, creates a new session and rebuilds the path with the NEW sessionId.
   */
  SourceRatingEmbedAdapter.prototype._authedFetch = async function (pathBuilder, options, retryOn401) {
    if (!this.session || !this.session.sessionId || !this.session.guestToken) {
      throw new Error('NO_ACTIVE_SESSION');
    }
    var path = typeof pathBuilder === 'function' ? pathBuilder(this.session.sessionId) : pathBuilder;
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {}, {
      Authorization: 'Bearer ' + this.session.guestToken
    });
    var res = await fetch(this.apiBaseUrl + path, Object.assign({}, options, { headers: headers }));
    if (res.status === 401 && retryOn401 !== false) {
      this._saveSession(null);
      await this.createSession();
      var retryResult = await this._authedFetch(pathBuilder, options, false);
      retryResult.sessionReset = true;
      return retryResult;
    }
    return { res: res, sessionReset: false };
  };

  SourceRatingEmbedAdapter.prototype.init = async function () {
    if (!this.apiBaseUrl) {
      this.mode = 'unconfigured';
      this.onStatusChange({ mode: 'unconfigured', online: false });
      return { ok: false, mode: 'unconfigured' };
    }

    try {
      var hRes = await fetch(
        this.apiBaseUrl + '/api/embed/health?workspaceKey=' + encodeURIComponent(this.workspaceKey),
        { method: 'GET', headers: { Accept: 'application/json' } }
      );
      if (!hRes.ok) throw new Error('HEALTH_HTTP_' + hRes.status);
      var health = await hRes.json();
      if (!health || !health.ok) throw new Error('WORKSPACE_INACTIVE');

      this.session = this._loadSession();
      if (!this.session || !this.session.sessionId || !this.session.guestToken) {
        await this.createSession();
      }

      var listResult = await this.listMessages();
      if (!listResult.ok) throw new Error(listResult.error || 'MESSAGES_UNAVAILABLE');

      this.mode = 'live';
      this.messages = listResult.messages;
      this.onStatusChange({
        mode: 'live',
        online: !!health.online,
        workspaceName: health.workspaceName || '',
        sessionId: this.session.sessionId
      });
      return { ok: true, mode: 'live', session: this.session, messages: this.messages };
    } catch (err) {
      this.mode = 'offline';
      this.onStatusChange({ mode: 'offline', online: false, error: err.message });
      return { ok: false, mode: 'offline', error: err.message };
    }
  };

  SourceRatingEmbedAdapter.prototype.createSession = async function () {
    var res = await fetch(this.apiBaseUrl + '/api/embed/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        workspaceKey: this.workspaceKey,
        locale: this.defaultLang,
        sourceUrl: global.location ? global.location.href : ''
      })
    });
    if (!res.ok) throw new Error('SESSION_HTTP_' + res.status);
    var sess = await res.json();
    if (!sess || !sess.sessionId || !sess.guestToken) throw new Error('INVALID_SESSION_PAYLOAD');
    this._saveSession(sess);
    return { ok: true, session: sess };
  };

  SourceRatingEmbedAdapter.prototype.listMessages = async function () {
    if (!this.apiBaseUrl || !this.session) {
      return { ok: false, mode: this.mode, messages: [], error: 'NOT_CONNECTED' };
    }
    try {
      var out = await this._authedFetch(function (sid) {
        return '/api/embed/sessions/' + encodeURIComponent(sid) + '/messages';
      }, { method: 'GET' });
      if (!out.res.ok) return { ok: false, mode: this.mode, messages: [], error: 'HTTP_' + out.res.status, sessionReset: out.sessionReset };
      var data = await out.res.json();
      this.messages = Array.isArray(data.messages) ? data.messages : [];
      return { ok: true, messages: this.messages, sessionReset: out.sessionReset, sessionId: this.session.sessionId };
    } catch (err) {
      return { ok: false, mode: this.mode, messages: [], error: err.message };
    }
  };

  SourceRatingEmbedAdapter.prototype.sendMessage = async function (payload) {
    if (this.mode !== 'live' || !this.session) {
      return { ok: false, mode: this.mode, persistedToServer: false, error: 'NOT_CONNECTED' };
    }
    try {
      var out = await this._authedFetch(function (sid) {
        return '/api/embed/sessions/' + encodeURIComponent(sid) + '/messages';
      }, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!out.res.ok) return { ok: false, mode: this.mode, persistedToServer: false, error: 'HTTP_' + out.res.status, sessionReset: out.sessionReset };
      var data = await out.res.json();
      return { ok: true, mode: 'live', persistedToServer: true, data: data, sessionReset: out.sessionReset, sessionId: this.session.sessionId };
    } catch (err) {
      return { ok: false, mode: this.mode, persistedToServer: false, error: err.message };
    }
  };

  SourceRatingEmbedAdapter.prototype.requestHumanHandoff = async function (payload) {
    if (this.mode !== 'live' || !this.session) {
      return { ok: false, mode: this.mode, error: 'NOT_CONNECTED' };
    }
    try {
      var out = await this._authedFetch(function (sid) {
        return '/api/embed/sessions/' + encodeURIComponent(sid) + '/handoff';
      }, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      if (!out.res.ok) return { ok: false, mode: this.mode, error: 'HTTP_' + out.res.status, sessionReset: out.sessionReset };
      return { ok: true, mode: 'live', data: await out.res.json(), sessionReset: out.sessionReset, sessionId: this.session.sessionId };
    } catch (err) {
      return { ok: false, mode: this.mode, error: err.message };
    }
  };

  SourceRatingEmbedAdapter.prototype.claimAccount = async function (email) {
    if (this.mode !== 'live' || !this.session) {
      return { ok: false, mode: this.mode, error: 'NOT_CONNECTED' };
    }
    try {
      var out = await this._authedFetch(function (sid) {
        return '/api/embed/sessions/' + encodeURIComponent(sid) + '/claim';
      }, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      if (!out.res.ok) return { ok: false, mode: this.mode, error: 'HTTP_' + out.res.status, sessionReset: out.sessionReset };
      return { ok: true, mode: 'live', data: await out.res.json(), sessionReset: out.sessionReset, sessionId: this.session.sessionId };
    } catch (err) {
      return { ok: false, mode: this.mode, error: err.message };
    }
  };

  global.SourceRatingEmbedAdapter = SourceRatingEmbedAdapter;
})(window);

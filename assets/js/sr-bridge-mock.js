/**
 * V1.1 Isolated Contract Mock for SourceRating I-4 Bridge (PR #9 / PR #10 schema)
 * Active ONLY when SR Staging Preview is protected by Vercel SSO (HTTP 302) or in isolated V1.1 preview.
 * - Explicitly sets `isMock: true` and `persistedToSr: false` on every payload.
 * - Pre-seeds TEST-only PublicPost matching docs/v1.1/ANTHAI_RESOURCE_INVENTORY.md Section 7.
 * - Never writes to production or external mailboxes.
 */
(function (global) {
  'use strict';

  var STORAGE_PREFIX = 'sr_v11_mock_state_v1_';

  function makeUuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return '11111111-2222-4333-8444-' + Date.now().toString(16).padStart(12, '0').slice(-12);
  }

  function defaultState(workspaceKey) {
    return {
      organizationId: '00000000-0000-4000-8000-00000000a771',
      workspaceKey: workspaceKey || 'an-thai-th',
      sessions: {},
      posts: [
        {
          id: 'TEST-ANTHAI-UPD-0001',
          organization_id: '00000000-0000-4000-8000-00000000a771',
          post_type: 'project_update',
          source_kind: 'sourcerating_bridge_mock',
          title: '[TEST] Field Testing Briefing & Site-Readiness Visual Check (Bangkok Hub)',
          title_zh: '【TEST 测试动态】曼谷枢纽现场勘测与技术准备展示联调（仅 V1.1 预览）',
          title_th: '[TEST] ทดสอบระบบเผยแพร่ข้อมูลภาคสนาม — ศูนย์ประสานงานกรุงเทพฯ',
          body_markdown: 'Verification fixture tracing controlled employee PublicPost release from SourceRating Staging draft to AN-THAI V1.1 Preview. No fabricated project count, client identity, or test report implied.',
          body_markdown_zh: '用于验证 SourceRating I-4 受控草稿经企业管理员确认后同源展示于官网 V1.1 预览动态区的 TEST 演练条目（不含任何虚构工程、数量或客户名称）。',
          body_markdown_th: 'รายการทดสอบระบบเชื่อมโยง PublicPost ตามสัญญา SourceRating I-4 บนเวอร์ชันทดสอบ V1.1 เท่านั้น (ไม่ระบุชื่อโครงการหรือข้อมูลลูกค้าที่ไม่ได้รับอนุญาต)',
          image_url: '/assets/images/static-load.webp',
          image_caption: '[TEST] Representative AN-THAI brochure equipment visual only — not specific jobsite proof.',
          external_url: 'https://an-thai.com/#TEST-ANTHAI-UPD-0001',
          provider_name: 'AN-THAI Engineering (Mock Staging)',
          visibility: 'public',
          publish_status: 'published',
          is_test: true,
          isMock: true,
          revision_no: 1,
          published_at: '2026-11-26T08:00:00Z',
          corrected_at: null,
          retracted_at: null,
        },
      ],
    };
  }

  function loadState(workspaceKey) {
    var key = STORAGE_PREFIX + (workspaceKey || 'an-thai-th');
    try {
      var raw = global.localStorage ? global.localStorage.getItem(key) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return defaultState(workspaceKey);
  }

  function saveState(workspaceKey, stateObj) {
    var key = STORAGE_PREFIX + (workspaceKey || 'an-thai-th');
    try {
      if (global.localStorage) global.localStorage.setItem(key, JSON.stringify(stateObj));
    } catch (e) {}
  }

  function createMockTransport(workspaceKey) {
    var wKey = workspaceKey || 'an-thai-th';

    return {
      health: async function () {
        var st = loadState(wKey);
        return {
          ok: true,
          configured: true,
          isMock: true,
          mockReason: 'staging_protected_302_awaiting_sr00',
          organizationId: st.organizationId,
          workspaceKey: wKey,
          workspaceName: 'AN-THAI Engineering (V1.1 Mock)',
          online: true,
          supportedLocales: ['en', 'zh', 'th'],
          challengeToken: 'mock_challenge_' + wKey,
        };
      },

      createSession: async function (payload) {
        if (payload && payload.website_url && String(payload.website_url).trim()) {
          return { ok: true, status: 'filtered', requestId: 'FILTERED', isMock: true };
        }
        var st = loadState(wKey);
        st.requestIndex = st.requestIndex || {};
        if (payload && payload.clientRequestId && st.requestIndex[payload.clientRequestId]) {
          var existingId = st.requestIndex[payload.clientRequestId];
          var existingSess = st.sessions[existingId];
          if (existingSess) {
            return {
              ok: true,
              isMock: true,
              persistedToSr: false,
              idempotentReplay: true,
              sessionId: existingSess.sessionId,
              visitorToken: existingSess.visitorToken,
              guestToken: existingSess.visitorToken,
              expiresAt: existingSess.expiresAt,
              status: existingSess.status,
              identityState: existingSess.identityState,
              activeHandover: existingSess.activeHandover,
              requestId: existingSess.requestId,
            };
          }
        }
        var sessionId = makeUuid();
        if (!st.visitorToken) {
          st.visitorToken = 'vtok_mock_' + sessionId.replace(/-/g, '').slice(0, 24);
        }
        var visitorToken = st.visitorToken;
        var dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        var requestId = 'SR-MOCK-' + dateTag + '-' + sessionId.slice(0, 8).toUpperCase();
        var now = new Date().toISOString();
        var initialText = (payload && payload.message ? String(payload.message) : '').trim() || 'Technical inquiry initiated';

        st.sessions[sessionId] = {
          sessionId: sessionId,
          visitorToken: visitorToken,
          requestId: requestId,
          status: 'ai_active',
          activeHandover: true,
          identityState: 'anonymous',
          assignedStaffLabel: 'AN-THAI Bangkok Desk (Mock)',
          takeoverReason: null,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          sourceSummary: payload && payload.sourceMetadata ? payload.sourceMetadata : {},
          messages: [
            {
              id: 'msg-1',
              seq: 1,
              sender: 'guest',
              text: initialText,
              createdAt: now,
            },
            {
              id: 'msg-2',
              seq: 2,
              sender: 'system',
              text: '[MOCK SESSION ' + requestId + '] Staging cross-site access awaits SR-00 302 bypass evaluation. This local mock follows the exact SourceRating I-4 contract and does not transmit to live staff.',
              createdAt: now,
            },
          ],
        };
        if (payload && payload.clientRequestId) {
          st.requestIndex[payload.clientRequestId] = sessionId;
        }
        saveState(wKey, st);

        return {
          ok: true,
          isMock: true,
          persistedToSr: false,
          sessionId: sessionId,
          visitorToken: visitorToken,
          guestToken: visitorToken,
          expiresAt: st.sessions[sessionId].expiresAt,
          status: 'ai_active',
          identityState: 'anonymous',
          activeHandover: true,
          requestId: requestId,
        };
      },

      getSession: async function (sessionId, token) {
        var st = loadState(wKey);
        var sess = st.sessions[sessionId];
        if (!sess || sess.visitorToken !== token) return { ok: false, statusCode: 401, error: 'Unauthorized', isMock: true };
        return {
          ok: true,
          isMock: true,
          session: {
            sessionId: sess.sessionId,
            status: sess.status,
            activeHandover: sess.activeHandover,
            identityState: sess.identityState,
            assignedStaffLabel: sess.assignedStaffLabel,
            takeoverReason: sess.takeoverReason,
            expiresAt: sess.expiresAt,
            sourceSummary: sess.sourceSummary,
          },
        };
      },

      listMessages: async function (sessionId, token, afterSeq) {
        var st = loadState(wKey);
        var sess = st.sessions[sessionId];
        if (!sess || sess.visitorToken !== token) return { ok: false, statusCode: 401, error: 'Unauthorized', isMock: true };
        var startSeq = Number(afterSeq || 0);
        var msgs = sess.messages.filter(function (m) { return Number(m.seq || 0) > startSeq; });
        var nextAfterSeq = sess.messages.length ? sess.messages[sess.messages.length - 1].seq : startSeq;
        return {
          ok: true,
          isMock: true,
          sessionId: sess.sessionId,
          status: sess.status,
          activeHandover: sess.activeHandover,
          messages: msgs,
          nextAfterSeq: nextAfterSeq,
        };
      },

      sendMessage: async function (sessionId, token, payload) {
        if (payload && payload.website_url && String(payload.website_url).trim()) {
          return { ok: true, status: 'filtered', isMock: true };
        }
        var st = loadState(wKey);
        var sess = st.sessions[sessionId];
        if (!sess || sess.visitorToken !== token) return { ok: false, statusCode: 401, error: 'Unauthorized', isMock: true };
        if (payload && payload.clientMsgId) {
          for (var i = 0; i < sess.messages.length; i++) {
            if (sess.messages[i].clientMsgId === payload.clientMsgId) {
              return {
                ok: true,
                isMock: true,
                persisted: false,
                idempotentReplay: true,
                sessionId: sessionId,
                sessionStatus: sess.status,
                eventId: sess.messages[i].id,
                seq: sess.messages[i].seq,
                createdAt: sess.messages[i].createdAt,
              };
            }
          }
        }
        var nextSeq = sess.messages.length + 1;
        var now = new Date().toISOString();
        var msg = {
          id: 'msg-' + nextSeq,
          clientMsgId: payload.clientMsgId || makeUuid(),
          seq: nextSeq,
          sender: 'guest',
          text: String(payload.text || '').trim(),
          createdAt: now,
        };
        sess.messages.push(msg);
        if (payload.requestHandoff) {
          sess.status = 'waiting_human';
          sess.activeHandover = true;
          sess.takeoverReason = payload.takeoverReason || 'visitor_requested';
          var sysSeq = sess.messages.length + 1;
          sess.messages.push({
            id: 'msg-' + sysSeq,
            seq: sysSeq,
            sender: 'system',
            text: '[MOCK] Handoff state -> waiting_human. No real notification was dispatched.',
            createdAt: now,
          });
        }
        saveState(wKey, st);
        return {
          ok: true,
          isMock: true,
          persisted: false,
          sessionId: sessionId,
          sessionStatus: sess.status,
          eventId: msg.id,
          seq: msg.seq,
          createdAt: now,
        };
      },

      listPublicPosts: async function () {
        var st = loadState(wKey);
        return {
          ok: true,
          isMock: true,
          posts: st.posts.filter(function (p) {
            return p.visibility === 'public' && (p.publish_status === 'published' || p.publish_status === 'corrected');
          }),
        };
      },
    };
  }

  global.ANTHAI_SR_MOCK = {
    createTransport: createMockTransport,
    reset: function (workspaceKey) {
      saveState(workspaceKey || 'an-thai-th', defaultState(workspaceKey));
    },
    simulateStaffReply: function (workspaceKey, sessionId, text) {
      var st = loadState(workspaceKey || 'an-thai-th');
      var sess = st.sessions[sessionId];
      if (!sess) return false;
      sess.status = 'human_active';
      var nextSeq = sess.messages.length + 1;
      sess.messages.push({
        id: 'msg-' + nextSeq,
        seq: nextSeq,
        sender: 'human',
        orgVerified: true,
        text: String(text || ''),
        createdAt: new Date().toISOString(),
      });
      saveState(workspaceKey || 'an-thai-th', st);
      return true;
    },
    upsertPublicPost: function (workspaceKey, post) {
      var st = loadState(workspaceKey || 'an-thai-th');
      var idx = st.posts.findIndex(function (p) { return p.id === post.id; });
      var merged = Object.assign({ isMock: true }, post);
      if (idx >= 0) st.posts[idx] = Object.assign({}, st.posts[idx], merged);
      else st.posts.unshift(merged);
      saveState(workspaceKey || 'an-thai-th', st);
      return st.posts;
    },
    retractPublicPost: function (workspaceKey, postId) {
      var st = loadState(workspaceKey || 'an-thai-th');
      st.posts = st.posts.map(function (p) {
        if (p.id === postId) {
          return Object.assign({}, p, { publish_status: 'retracted', retracted_at: new Date().toISOString() });
        }
        return p;
      });
      saveState(workspaceKey || 'an-thai-th', st);
      return st.posts;
    },
  };
})(window);

/**
 * AN-THAI AI Living Website Studio V5.4 – Frontend Application Logic
 * Employee-First Chat · Lite Agent CRM · AI Content Studio Workflow
 */
(function () {
  'use strict';

  var E = window.AnThaiStudioEngine;
  if (!E) {
    console.error('AnThaiStudioEngine not loaded!');
    return;
  }

  var state = {
    channel: '#team-field-ops',
    role: 'contributor',
    user: { name: 'James Cheng', role: 'contributor' },
    pendingPhotos: [],
    pendingVoice: false,
    messages: [
      {
        id: 'msg-init-1',
        channel: '#team-field-ops',
        sender: 'agent',
        author: 'AN-THAI Workspace Agent',
        time: '08:30',
        text: 'Welcome to the AN-THAI V5.4 Workspace. Send field updates, site photos, or customer notes. I will extract Lite CRM candidates (marking missing fields as Unknown) and prepare template-locked website drafts for human review. Note: Contributors cannot self-publish.'
      }
    ],
    crm: {
      customers: [],
      contacts: [],
      leads: [],
      projects: [],
      tasks: [],
      interactions: []
    },
    drafts: []
  };

  function actor() {
    return {
      name: state.user.name + ' (' + (state.role === 'publisher' ? 'Manager' : 'Engineer') + ')',
      role: state.role
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateCounters() {
    var confirmedCrmCount = state.crm.projects.filter(function(p){ return p.confidenceStatus === 'confirmed'; }).length +
                            state.crm.leads.filter(function(l){ return l.confidenceStatus === 'confirmed'; }).length;
    var elCrm = document.getElementById('crmCount');
    var elDraft = document.getElementById('draftCount');
    var elPhoto = document.getElementById('photoBadge');

    if (elCrm) elCrm.textContent = String(confirmedCrmCount);
    if (elDraft) elDraft.textContent = String(state.drafts.length);
    if (elPhoto) elPhoto.textContent = String(state.pendingPhotos.length);
  }

  function showFeedback(text, isError) {
    var fb = document.getElementById('studioFeedback');
    if (!fb) return;
    fb.hidden = false;
    fb.textContent = text;
    fb.className = 'studio-feedback ' + (isError ? 'is-error' : 'is-success');
    setTimeout(function () {
      if (fb) fb.hidden = true;
    }, 6000);
  }

  // 1. RENDER CHAT FEED
  function renderChat() {
    var feed = document.getElementById('chatFeed');
    if (!feed) return;

    var filtered = state.messages.filter(function (m) {
      return !m.channel || m.channel === state.channel || m.channel === 'all';
    });

    if (filtered.length === 0) {
      feed.innerHTML = '<div class="studio-panel"><p style="color:var(--text-muted);text-align:center;">No messages in ' + esc(state.channel) + ' yet. Type a message below to start.</p></div>';
      return;
    }

    feed.innerHTML = filtered.map(function (m) {
      var isUser = m.sender === 'user';
      var bubbleClass = isUser ? 'is-user' : 'is-agent';
      var cardHtml = '';

      // Inline CRM Candidate Card
      if (m.crmCandidate) {
        var c = m.crmCandidate;
        var status = c.confidenceStatus;
        cardHtml += '<div class="inline-card">'
          + '<div class="card-header-row">'
          + '  <span>Lite CRM Candidate · ' + esc(c.sourceMessageId) + '</span>'
          + '  <span class="status-pill ' + (status === 'confirmed' ? 'is-confirmed' : 'is-candidate') + '">' + esc(status) + '</span>'
          + '</div>'
          + (c.duplicateWarning ? '<div class="card-warning">' + esc(c.duplicateWarning) + '</div>' : '')
          + '<div class="crm-object-grid">'
          + '  <div class="crm-kv"><span>Customer</span><strong>' + esc(c.objects.customer.name) + '</strong></div>'
          + '  <div class="crm-kv"><span>Service Unit</span><strong>' + esc(c.objects.lead.serviceUnit) + '</strong></div>'
          + '  <div class="crm-kv"><span>Location</span><strong>' + esc(c.objects.project.location) + '</strong></div>'
          + '  <div class="crm-kv"><span>Unknowns</span><strong class="unknown-tag">' + esc(c.unknownFields.join(', ')) + '</strong></div>'
          + '</div>';

        if (status === 'candidate') {
          cardHtml += '<div class="action-row">'
            + '  <button type="button" class="btn btn-success" data-confirm-crm="' + esc(m.id) + '">Confirm to CRM</button>'
            + '  <button type="button" class="btn btn-outline" data-dismiss-crm="' + esc(m.id) + '">Dismiss</button>'
            + '</div>';
        }
        cardHtml += '</div>';
      }

      // Inline Content Studio Draft Card
      if (m.draftId) {
        var dr = state.drafts.find(function (d) { return d.id === m.draftId; });
        if (dr) {
          cardHtml += '<div class="inline-card">'
            + '<div class="card-header-row">'
            + '  <span>AI Content Studio Draft · ' + esc(dr.contentType) + '</span>'
            + '  <span class="status-pill is-candidate">' + esc(dr.status) + '</span>'
            + '</div>'
            + '<div><strong>Title:</strong> ' + esc(dr.templateData.title) + '</div>'
            + (dr.followUpQuestions && dr.followUpQuestions.length
                ? '<div style="margin-top:4px;"><strong>Targeted Agent Questions:</strong><ul style="padding-left:16px;margin-top:2px;">' + dr.followUpQuestions.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></div>'
                : '')
            + '<div class="action-row">'
            + '  <button type="button" class="btn btn-primary" data-open-draft="' + esc(dr.id) + '">Open in Content Studio →</button>'
            + '</div>'
            + '</div>';
        }
      }

      return '<div class="message-bubble ' + bubbleClass + '">'
        + '<div class="bubble-header">'
        + '  <span class="bubble-author">' + esc(m.author) + '</span>'
        + '  <span>' + esc(m.time || 'Now') + '</span>'
        + '</div>'
        + '<div class="bubble-text">' + esc(m.text) + '</div>'
        + cardHtml
        + '</div>';
    }).join('');

    feed.scrollTop = feed.scrollHeight;
    updateCounters();
  }

  // 2. RENDER LITE CRM TAB
  function renderCrm() {
    var mount = document.getElementById('crmMount');
    if (!mount) return;

    var confirmedProjects = state.crm.projects.filter(function (p) { return p.confidenceStatus === 'confirmed'; });
    var confirmedLeads = state.crm.leads.filter(function (l) { return l.confidenceStatus === 'confirmed'; });
    var confirmedTasks = state.crm.tasks.filter(function (t) { return t.confidenceStatus === 'confirmed'; });

    if (confirmedProjects.length === 0 && confirmedLeads.length === 0) {
      mount.innerHTML = '<div class="studio-panel"><p style="color:var(--text-muted);text-align:center;">No confirmed CRM records yet. Send a message in Team Chat and click "Confirm to CRM".</p></div>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    html += '<h3 style="font-size:13px;font-weight:800;color:var(--brand-navy);">Confirmed Engineering Projects (' + confirmedProjects.length + ')</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:10px;">';

    html += confirmedProjects.map(function (p) {
      return '<div class="inline-card">'
        + '<div class="card-header-row">'
        + '  <span>Project #' + esc(p.id) + '</span>'
        + '  <span class="status-pill is-confirmed">CONFIRMED</span>'
        + '</div>'
        + '<div style="font-weight:700;font-size:13px;color:var(--brand-navy);">' + esc(p.title) + '</div>'
        + '<div style="font-size:11px;color:var(--text-muted);">Location: ' + esc(p.location) + ' · Unit: ' + esc(p.serviceUnit) + '</div>'
        + '<div class="mono" style="font-size:10px;color:var(--text-muted);margin-top:4px;">Source: ' + esc(p.sourceMessageId) + ' · Confirmed by: ' + esc(p.confirmedBy) + '</div>'
        + '</div>';
    }).join('');
    html += '</div>';

    if (confirmedLeads.length > 0) {
      html += '<h3 style="font-size:13px;font-weight:800;color:var(--brand-navy);margin-top:10px;">Confirmed Leads (' + confirmedLeads.length + ')</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:10px;">';
      html += confirmedLeads.map(function (l) {
        return '<div class="inline-card">'
          + '<div class="card-header-row"><span>Lead #' + esc(l.id) + '</span><span class="status-pill is-confirmed">' + esc(l.stage) + '</span></div>'
          + '<div style="font-size:12px;">' + esc(l.summary) + '</div>'
          + '<div style="font-size:11px;color:var(--text-muted);">Unit: ' + esc(l.serviceUnit) + ' · Location: ' + esc(l.location) + '</div>'
          + '</div>';
      }).join('');
      html += '</div>';
    }

    html += '</div>';
    mount.innerHTML = html;
  }

  // 3. RENDER CONTENT STUDIO TAB
  function renderStudio() {
    var mount = document.getElementById('studioMount');
    if (!mount) return;

    if (state.drafts.length === 0) {
      mount.innerHTML = '<div class="studio-panel"><p style="color:var(--text-muted);text-align:center;">No content drafts yet. Send a field update with photos or voice in Team Chat to generate a draft.</p></div>';
      return;
    }

    mount.innerHTML = state.drafts.map(function (dr) {
      var isPub = dr.status === 'published';
      var isRev = dr.status === 'in_review';

      return '<div class="studio-panel" data-draft-id="' + esc(dr.id) + '">'
        + '<div class="card-header-row" style="margin-bottom:12px;border-bottom:1px solid var(--line-border);padding-bottom:8px;">'
        + '  <div>'
        + '    <strong style="font-size:14px;">Draft #' + esc(dr.id) + ' · ' + esc(dr.contentType) + '</strong>'
        + '    <span class="status-pill ' + (isPub ? 'is-confirmed' : 'is-candidate') + '" style="margin-left:6px;">' + esc(dr.status) + '</span>'
        + '  </div>'
        + '  <div class="mono" style="font-size:11px;color:var(--text-muted);">'
        +      (dr.canonicalUrl ? '<a href="' + esc(dr.canonicalUrl) + '" target="_blank" style="color:var(--brand-blue);">' + esc(dr.canonicalUrl) + '</a>' : 'Not Published')
        + '  </div>'
        + '</div>'
        + E.renderTemplateHtml(dr)
        + '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line-border);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">'
        + '  <div style="display:flex;align-items:center;gap:6px;">'
        + '    <label for="rightsSel-' + esc(dr.id) + '" style="font-size:11px;font-weight:700;">Disclosure Clearance:</label>'
        + '    <select id="rightsSel-' + esc(dr.id) + '" class="role-select" data-rights-sel="' + esc(dr.id) + '">'
        + '      <option value="unknown"' + (dr.templateData.photoRights === 'unknown' ? ' selected' : '') + '>Unknown (Blocked from Public)</option>'
        + '      <option value="internal_only"' + (dr.templateData.photoRights === 'internal_only' ? ' selected' : '') + '>Internal Only</option>'
        + '      <option value="client_approved_public"' + (dr.templateData.photoRights === 'client_approved_public' ? ' selected' : '') + '>Client Approved Public</option>'
        + '    </select>'
        + '  </div>'
        + '  <div class="action-row">'
        + '    <button type="button" class="btn btn-outline" data-draft-act="submit" data-did="' + esc(dr.id) + '">Submit for Review</button>'
        + '    <button type="button" class="btn btn-success" data-draft-act="publish" data-did="' + esc(dr.id) + '">Approve &amp; Publish</button>'
        + '    <button type="button" class="btn btn-danger" data-draft-act="retract" data-did="' + esc(dr.id) + '">Retract / Rollback</button>'
        + '  </div>'
        + '</div>'
        + (dr.approvals && dr.approvals.length
            ? '<div class="mono" style="font-size:10px;color:var(--text-muted);margin-top:8px;">Audit Trail: ' + dr.approvals.map(function(a){ return esc(a.action) + ' by ' + esc(a.role) + ' (' + a.timestamp.slice(11,19) + ')'; }).join(' → ') + '</div>'
            : '')
        + '</div>';
    }).join('');
  }

  // 4. RENDER DAILY BRIEF TAB
  function renderBrief() {
    var mount = document.getElementById('briefMount');
    if (!mount) return;

    var brief = E.generateDailyBrief(state.crm, state.drafts);
    mount.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;">'
      + '<div class="mono" style="font-size:11px;color:var(--text-muted);">Generated at: ' + esc(brief.generatedAt) + ' · Zero Fabrication Engine</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:10px;">'
      + '  <div class="crm-kv"><span>Confirmed Projects</span><strong style="font-size:18px;">' + brief.confirmedProjectsCount + '</strong></div>'
      + '  <div class="crm-kv"><span>Confirmed Leads</span><strong style="font-size:18px;">' + brief.confirmedLeadsCount + '</strong></div>'
      + '  <div class="crm-kv"><span>Open Follow-Up Tasks</span><strong style="font-size:18px;">' + brief.openTasksCount + '</strong></div>'
      + '  <div class="crm-kv"><span>Pending Content Reviews</span><strong style="font-size:18px;">' + brief.pendingContentReviewCount + '</strong></div>'
      + '  <div class="crm-kv"><span>Published Field Updates</span><strong style="font-size:18px;">' + brief.publishedContentCount + '</strong></div>'
      + '  <div class="crm-kv"><span>Revenue Estimate</span><strong>' + esc(brief.revenueEstimate) + '</strong></div>'
      + '</div>'
      + '<div style="margin-top:10px;">'
      + '  <h4 style="font-size:12px;font-weight:700;color:var(--brand-navy);">Confirmed Project Highlights</h4>'
      + (brief.highlights.length
          ? '<ul style="padding-left:18px;margin-top:4px;font-size:12px;">' + brief.highlights.map(function(h){ return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>'
          : '<p style="font-size:12px;color:var(--text-muted);margin-top:4px;">No confirmed projects to highlight today.</p>')
      + '</div>'
      + '</div>';
  }

  // EVENT LISTENERS & SETUP
  function setupListeners() {
    // 1. Channel Selector
    document.querySelectorAll('.channel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.channel-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.channel = btn.getAttribute('data-channel');
        renderChat();
      });
    });

    // 2. Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.nav-tab-btn').forEach(function (b) { b.classList.remove('is-active'); });
        document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var pane = document.getElementById('tab-' + tab);
        if (pane) pane.classList.add('is-active');

        if (tab === 'chat') renderChat();
        else if (tab === 'crm') renderCrm();
        else if (tab === 'studio') renderStudio();
        else if (tab === 'brief') renderBrief();
      });
    });

    // 3. Role Selector (Staging verification)
    var roleSel = document.getElementById('roleSelect');
    if (roleSel) {
      roleSel.addEventListener('change', function () {
        state.role = roleSel.value;
        state.user.role = roleSel.value;
        showFeedback('Active role switched to: ' + state.role, false);
      });
    }

    // 4. Quick Sample Chips
    document.querySelectorAll('.sample-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var sample = chip.getAttribute('data-sample');
        var input = document.getElementById('chatInput');
        if (input) {
          input.value = sample;
          input.focus();
        }
      });
    });

    // 5. Photos Button (real file picker; no client-side EXIF processing)
    var photoBtn = document.getElementById('addPhotoBtn');
    var photoInput = document.getElementById('photoFileInput');
    if (photoBtn && photoInput) {
      photoBtn.addEventListener('click', function () {
        photoInput.click();
      });
      photoInput.addEventListener('change', function () {
        if (!photoInput.files || photoInput.files.length === 0) return;
        Array.from(photoInput.files).forEach(function (file) {
          state.pendingPhotos.push({
            name: file.name,
            caption: 'Site Photo: ' + file.name
          });
        });
        updateCounters();
        showFeedback('Attached ' + photoInput.files.length + ' photo(s)', false);
        photoInput.value = '';
      });
    } else if (photoBtn) {
      photoBtn.addEventListener('click', function () {
        var idx = state.pendingPhotos.length + 1;
        state.pendingPhotos.push({
          name: 'field-record-' + idx + '.jpg',
          caption: 'Site Record Photo #' + idx
        });
        updateCounters();
        showFeedback('Attached photo #' + idx, false);
      });
    }

    // 6. Voice Button (Microphone Recording / STT or Prompt)
    var voiceBtn = document.getElementById('addVoiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            var rec = new SpeechRec();
            rec.lang = 'zh-CN';
            rec.onstart = function () { showFeedback('Listening for voice input...', false); };
            rec.onresult = function (ev) {
              var transcript = ev.results[0][0].transcript;
              var input = document.getElementById('chatInput');
              if (input) {
                input.value = (input.value ? input.value + ' ' : '') + transcript;
                input.focus();
              }
              showFeedback('Voice transcribed successfully.', false);
            };
            rec.onerror = function (ev) {
              showFeedback('Voice recognition notice: ' + (ev.error || 'canceled'), false);
            };
            rec.start();
            return;
          } catch (e) {}
        }
        var manualVoice = window.prompt ? window.prompt('Voice recording simulation — please speak or enter field voice memo:') : '';
        if (manualVoice) {
          var input = document.getElementById('chatInput');
          if (input) {
            input.value = (input.value ? input.value + ' ' : '') + manualVoice;
            input.focus();
          }
        }
      });
    }

    // 7. Chat Composer Submit
    var composer = document.getElementById('chatComposer');
    if (composer) {
      composer.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var input = document.getElementById('chatInput');
        var text = (input ? input.value : '').trim();
        if (!text && state.pendingPhotos.length === 0) return;

        var msgId = 'msg-' + Date.now().toString(36);
        var now = new Date().toTimeString().slice(0, 5);

        // Add user message
        var userMsg = {
          id: msgId,
          channel: state.channel,
          sender: 'user',
          author: state.user.name,
          time: now,
          text: text
        };
        state.messages.push(userMsg);

        // Extract CRM candidate objects
        var crmCandidate = E.extractCrmCandidates(userMsg, state.crm);

        // Prepare Content Studio draft if photos or field content present
        var draftId = null;
        if (state.pendingPhotos.length > 0 || /桩|钢|粉体|测试|检测|client|customer/i.test(text)) {
          var slug = E.slugify(crmCandidate.objects.project.title);
          draftId = 'draft-' + Date.now().toString(36).slice(-5);
          var detectedScope = 'unknown';
          if (/(\d+)\s*(根|piles?)[^，。\n]*/i.test(text)) {
            var m = text.match(/(\d+)\s*(根|piles?)[^，。\n]*/i);
            detectedScope = m ? m[0] : 'unknown';
          }
          var draftInput = {
            location: crmCandidate.objects.project.location,
            actualScope: detectedScope,
            photoRights: 'unknown'
          };
          var questions = E.buildInterviewQuestions(draftInput);

        var newDraft = {
          id: draftId,
          slug: slug,
          contentType: 'field_update',
          status: 'draft',
          sourceMessageId: msgId,
          followUpQuestions: questions,
          templateData: {
            title: crmCandidate.objects.project.title,
            location: crmCandidate.objects.project.location,
            serviceUnit: crmCandidate.objects.project.serviceUnit,
            date: new Date().toISOString().slice(0, 10),
            summary: text.slice(0, 200),
            actualScope: detectedScope,
            photoRights: 'unknown',
              photos: state.pendingPhotos.slice()
            },
            approvals: [
              { action: 'created', actor: state.user.name, role: state.role, timestamp: new Date().toISOString() }
            ],
            revisions: []
          };
          state.drafts.push(newDraft);
        }

        // Agent Response Message with interactive cards
        var agentMsg = {
          id: 'agent-' + Date.now().toString(36),
          channel: state.channel,
          sender: 'agent',
          author: 'AN-THAI Workspace Agent',
          time: now,
          text: 'I have analyzed your message in ' + state.channel + '. Extracted Lite CRM candidates (unknown fields explicitly flagged) and created an AI Content Studio draft for review.',
          crmCandidate: crmCandidate,
          draftId: draftId
        };
        state.messages.push(agentMsg);

        // Reset composer inputs
        if (input) input.value = '';
        state.pendingPhotos = [];
        state.pendingVoice = false;

        renderChat();
      });
    }

    // 8. Document-Level Delegation for Dynamic Buttons
    document.addEventListener('click', function (ev) {
      var t = ev.target;

      // Confirm CRM Candidate
      if (t.hasAttribute('data-confirm-crm')) {
        var mId = t.getAttribute('data-confirm-crm');
        var msg = state.messages.find(function (m) { return m.id === mId; });
        if (msg && msg.crmCandidate) {
          var cand = msg.crmCandidate;
          cand.confidenceStatus = 'confirmed';
          cand.confirmedBy = state.user.name;
          cand.confirmedAt = new Date().toISOString();

          // Push objects to confirmed state
          var p = Object.assign({}, cand.objects.project, {
            id: 'proj-' + (state.crm.projects.length + 1),
            confidenceStatus: 'confirmed',
            sourceMessageId: cand.sourceMessageId,
            confirmedBy: state.user.name
          });
          state.crm.projects.push(p);

          var l = Object.assign({}, cand.objects.lead, {
            id: 'lead-' + (state.crm.leads.length + 1),
            confidenceStatus: 'confirmed',
            sourceMessageId: cand.sourceMessageId,
            confirmedBy: state.user.name
          });
          state.crm.leads.push(l);

          renderChat();
          showFeedback('Confirmed Project and Lead to Lite CRM database.', false);
        }
      }

      // Dismiss CRM Candidate
      if (t.hasAttribute('data-dismiss-crm')) {
        var dmId = t.getAttribute('data-dismiss-crm');
        var dmsg = state.messages.find(function (m) { return m.id === dmId; });
        if (dmsg && dmsg.crmCandidate) {
          dmsg.crmCandidate.confidenceStatus = 'dismissed';
          renderChat();
          showFeedback('CRM candidate dismissed.', false);
        }
      }

      // Open Draft in Content Studio Tab
      if (t.hasAttribute('data-open-draft')) {
        var did = t.getAttribute('data-open-draft');
        var studioBtn = document.querySelector('.nav-tab-btn[data-tab="studio"]');
        if (studioBtn) studioBtn.click();
      }

      // Content Studio Actions (submit, publish, retract)
      if (t.hasAttribute('data-draft-act')) {
        var act = t.getAttribute('data-draft-act');
        var draftId = t.getAttribute('data-did');
        var dr = state.drafts.find(function (d) { return d.id === draftId; });
        if (dr) {
          var result = E.transitionDraft(dr, act, actor());
          if (!result.ok) {
            showFeedback(result.error, true);
          } else {
            // Replace draft state with transitioned draft
            var idx = state.drafts.findIndex(function (d) { return d.id === draftId; });
            if (idx !== -1) state.drafts[idx] = result.draft;
            renderStudio();
            showFeedback('Draft #' + draftId + ' transitioned: ' + result.draft.status, false);
          }
        }
      }

      // Refresh Brief Button
      if (t.id === 'refreshBriefBtn') {
        renderBrief();
        showFeedback('Daily Brief refreshed from confirmed records.', false);
      }
    });

    // 9. Document Change for Disclosure Select
    document.addEventListener('change', function (ev) {
      if (ev.target.hasAttribute('data-rights-sel')) {
        var did = ev.target.getAttribute('data-rights-sel');
        var dr = state.drafts.find(function (d) { return d.id === did; });
        if (dr) {
          dr.templateData.photoRights = ev.target.value;
          renderStudio();
          showFeedback('Updated photo disclosure rights for Draft #' + did + ': ' + dr.templateData.photoRights, false);
        }
      }
    });
  }

  // INITIALIZE
  document.addEventListener('DOMContentLoaded', function () {
    setupListeners();
    renderChat();
    updateCounters();
  });
})();

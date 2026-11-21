(function () {
  'use strict';
  var E = window.AnThaiStudioEngine;
  var state = {
    role: 'contributor',
    pendingPhotos: [],
    messages: [
      {
        id: 'msg-init-1',
        sender: 'agent',
        author: 'AN-THAI Workspace Agent',
        text: 'Welcome to the V5.4 Employee-First Workspace. Send a field update, site photos, or customer note below. I will extract Lite CRM candidates (marking missing fields as Unknown) and prepare template-locked website drafts for human review. Contributors cannot self-publish.'
      }
    ],
    crm: { customers: [], contacts: [], leads: [], projects: [], tasks: [], interactions: [] },
    drafts: []
  };

  function actor() {
    return state.role === 'publisher'
      ? { name: 'Manager (Editor/Publisher)', role: 'publisher' }
      : { name: 'Field Engineer (Contributor)', role: 'contributor' };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateCounters() {
    var c = state.crm.projects.length + state.crm.leads.length;
    var elC = document.getElementById('crmCount');
    var elD = document.getElementById('draftCount');
    var elP = document.getElementById('photoBadge');
    if (elC) elC.textContent = String(c);
    if (elD) elD.textContent = String(state.drafts.length);
    if (elP) elP.textContent = String(state.pendingPhotos.length);
  }

  function renderChat() {
    var feed = document.getElementById('chatFeed');
    if (!feed) return;
    feed.innerHTML = state.messages.map(function (m) {
      var cls = m.sender === 'me' ? 'is-me' : 'is-agent';
      var cardHtml = '';
      if (m.crmCandidate) {
        var c = m.crmCandidate;
        var st = c.confidenceStatus;
        cardHtml += '<div class="inline-card">'
          + '<div class="card-head"><span>Lite CRM Candidate · Source: ' + esc(c.sourceMessageId) + '</span><span class="' + (st === 'confirmed' ? 'ok-tag' : 'unknown-tag') + '">' + esc(st) + '</span></div>'
          + (c.duplicateWarning ? '<div class="notice">' + esc(c.duplicateWarning) + '</div>' : '')
          + '<div class="kv-grid">'
          + '<div class="kv-item"><strong>Customer</strong>' + esc(c.objects.customer.name) + '</div>'
          + '<div class="kv-item"><strong>Service Unit</strong>' + esc(c.objects.lead.serviceUnit) + '</div>'
          + '<div class="kv-item"><strong>Location</strong>' + esc(c.objects.project.location) + '</div>'
          + '<div class="kv-item"><strong>Unknown Fields</strong>' + esc(c.unknownFields.join(', ')) + '</div>'
          + '</div>'
          + (st === 'candidate'
            ? '<div class="btn-row"><button type="button" class="btn btn-ok" data-confirm-crm="' + esc(m.id) + '">Confirm to CRM</button><button type="button" class="btn btn-outline" data-dismiss-crm="' + esc(m.id) + '">Dismiss</button></div>'
            : '')
          + '</div>';
      }
      if (m.draftId) {
        var dr = state.drafts.find(function (d) { return d.id === m.draftId; });
        if (dr) {
          cardHtml += '<div class="inline-card">'
            + '<div class="card-head"><span>AI Content Studio Draft · ' + esc(dr.contentType) + '</span><span class="unknown-tag">' + esc(dr.status) + '</span></div>'
            + '<div><strong>Title:</strong> ' + esc(dr.templateData.title) + '</div>'
            + (dr.followUpQuestions && dr.followUpQuestions.length
              ? '<div><strong>Missing Facts (Max 3):</strong> ' + esc(dr.followUpQuestions.join(' | ')) + '</div>'
              : '')
            + '<div class="btn-row"><button type="button" class="btn btn-dark" data-open-draft="' + esc(dr.id) + '">Open in Content Studio →</button></div>'
            + '</div>';
        }
      }
      return '<div class="bubble ' + cls + '"><div class="bubble-meta">' + esc(m.author) + ' · ' + esc(m.id) + '</div><div>' + esc(m.text) + '</div>' + cardHtml + '</div>';
    }).join('');
    updateCounters();
  }

  function renderCrm() {
    var mount = document.getElementById('crmMount');
    if (!mount) return;
    if (!state.crm.projects.length && !state.crm.leads.length) {
      mount.innerHTML = '<div class="notice">No confirmed CRM records yet. Send a message in Team Chat and click "Confirm to CRM".</div>';
      return;
    }
    mount.innerHTML = '<div class="grid-2">'
      + state.crm.projects.map(function (p) {
        return '<div class="inline-card"><div class="card-head"><span>Project · ' + esc(p.id) + '</span><span class="ok-tag">' + esc(p.confidenceStatus) + '</span></div>'
          + '<div><strong>' + esc(p.title) + '</strong></div>'
          + '<div>Location: ' + esc(p.location) + ' · Unit: ' + esc(p.serviceUnit) + '</div>'
          + '<div class="mono" style="font-size:10px;color:var(--muted);">Source Message: ' + esc(p.sourceMessageId) + ' · Confirmed by: ' + esc(p.confirmedBy) + '</div></div>';
      }).join('')
      + '</div>';
  }

  function renderStudio() {
    var mount = document.getElementById('studioMount');
    if (!mount) return;
    if (!state.drafts.length) {
      mount.innerHTML = '<div class="panel"><div class="notice">No content drafts yet. Send a field update in Team Chat to generate a template-locked draft.</div></div>';
      return;
    }
    mount.innerHTML = state.drafts.map(function (dr) {
      return '<div class="panel" data-draft-card="' + esc(dr.id) + '">'
        + '<div class="card-head" style="margin-bottom:10px;"><span>Draft #' + esc(dr.id) + ' · Status: ' + esc(dr.status) + '</span><span>' + esc(dr.canonicalUrl || 'Not Published') + '</span></div>'
        + E.renderTemplateHtml(dr)
        + '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">'
        + '  <label style="font-size:12px;font-weight:600;">Disclosure: <select data-rights-sel="' + esc(dr.id) + '">'
        + '    <option value="unknown"' + (dr.templateData.photoRights === 'unknown' ? ' selected' : '') + '>Unknown (Blocked from Public)</option>'
        + '    <option value="client_approved_public"' + (dr.templateData.photoRights === 'client_approved_public' ? ' selected' : '') + '>Client Approved Public</option>'
        + '  </select></label>'
        + '  <button type="button" class="btn btn-outline" data-draft-act="submit" data-did="' + esc(dr.id) + '">Submit for Review</button>'
        + '  <button type="button" class="btn btn-ok" data-draft-act="publish" data-did="' + esc(dr.id) + '">Approve &amp; Publish</button>'
        + '  <button type="button" class="btn btn-outline" data-draft-act="retract" data-did="' + esc(dr.id) + '">Retract / Rollback</button>'
        + '</div>'
        + '<div class="mono" style="font-size:10px;color:var(--muted);margin-top:8px;">Approvals: ' + esc(dr.approvals.map(function (a) { return a.action + ' by ' + a.role; }).join(' → ') || 'None') + '</div>'
        + '</div>';
    }).join('');
  }

  function renderBrief() {
    var mount = document.getElementById('briefMount');
    if (!mount) return;
    var b = E.generateDailyBrief(state.crm, state.drafts);
    mount.innerHTML = '<div class="kv-grid">'
      + '<div class="kv-item"><strong>Confirmed Projects</strong>' + b.confirmedProjectsCount + '</div>'
      + '<div class="kv-item"><strong>Confirmed Leads</strong>' + b.confirmedLeadsCount + '</div>'
      + '<div class="kv-item"><strong>Open Tasks</strong>' + b.openTasksCount + '</div>'
      + '<div class="kv-item"><strong>Pending Content Review</strong>' + b.pendingContentReviewCount + '</div>'
      + '<div class="kv-item"><strong>Published Content</strong>' + b.publishedContentCount + '</div>'
      + '<div class="kv-item"><strong>Revenue / Value</strong>' + esc(b.revenueEstimate) + '</div>'
      + '</div>'
      + (b.highlights.length ? '<ul style="margin-top:10px;font-size:12px;">' + b.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '<p style="font-size:12px;color:var(--muted);margin-top:10px;">No confirmed project activity recorded today.</p>');
  }

  function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.getAttribute('data-tab') === tabName ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-view').forEach(function (v) {
      v.hidden = v.id !== ('tab-' + tabName);
    });
    if (tabName === 'crm') renderCrm();
    if (tabName === 'studio') renderStudio();
    if (tabName === 'brief') renderBrief();
  }

  // Global Event Handlers
  document.querySelectorAll('.nav-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
  });
  document.getElementById('roleSelect').addEventListener('change', function (e) { state.role = e.target.value; });
  document.getElementById('refreshBriefBtn').addEventListener('click', renderBrief);

  document.querySelectorAll('.chip[data-sample]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.getElementById('chatInput').value = btn.getAttribute('data-sample');
      if (!state.pendingPhotos.length) {
        state.pendingPhotos = [
          { name: 'rayong-site-01.webp', caption: 'Site mobilization' },
          { name: 'rayong-site-02.webp', caption: 'Pile head preparation' },
          { name: 'rayong-site-03.webp', caption: 'CSL probe setup' }
        ];
        updateCounters();
      }
    });
  });

  document.getElementById('addPhotoBtn').addEventListener('click', function () {
    var n = state.pendingPhotos.length + 1;
    state.pendingPhotos.push({ name: 'site-photo-0' + n + '.webp', caption: 'Uploaded site photo #' + n });
    updateCounters();
  });

  document.getElementById('addVoiceBtn').addEventListener('click', function () {
    var inp = document.getElementById('chatInput');
    inp.value = (inp.value ? inp.value + ' ' : '') + '[Voice Note Transcript: Completed CSL testing on 36 bored piles in Rayong EEC today.]';
  });

  document.getElementById('chatComposer').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = document.getElementById('chatInput');
    var txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';

    var msgId = 'msg-' + (state.messages.length + 1);
    var userMsg = { id: msgId, sender: 'me', author: actor().name, text: txt, channel: '#team-field-ops' };
    state.messages.push(userMsg);

    var cand = E.extractCrmCandidates(userMsg, state.crm);
    var draftId = null;
    if (/动态|update|case|照片|photo|整理|测试|检测|steel|pile/i.test(txt)) {
      draftId = 'draft-' + (state.drafts.length + 1);
      var td = {
        title: cand.objects.project.title,
        location: cand.objects.project.location,
        date: new Date().toISOString().slice(0, 10),
        serviceUnit: cand.objects.lead.serviceUnit,
        actualScope: txt.slice(0, 140),
        summary: txt,
        photos: state.pendingPhotos.slice(),
        photoRights: 'unknown'
      };
      state.drafts.push({
        id: draftId,
        slug: E.slugify(td.title),
        contentType: 'field_update',
        status: 'draft',
        templateData: td,
        followUpQuestions: E.buildInterviewQuestions(td),
        approvals: [],
        revisions: [],
        canonicalUrl: null
      });
    }
    state.pendingPhotos = [];

    state.messages.push({
      id: 'agent-' + (state.messages.length + 1),
      sender: 'agent',
      author: 'AN-THAI Workspace Agent',
      text: 'Extracted structured Lite CRM candidate (unconfirmed fields marked Unknown) and prepared a template-locked content draft for human review.',
      crmCandidate: cand,
      draftId: draftId
    });
    renderChat();
  });

  document.addEventListener('click', function (e) {
    var confId = e.target.getAttribute('data-confirm-crm');
    if (confId) {
      var m = state.messages.find(function (x) { return x.id === confId; });
      if (m && m.crmCandidate) {
        m.crmCandidate.confidenceStatus = 'confirmed';
        var o = m.crmCandidate.objects;
        var pid = 'PRJ-' + (state.crm.projects.length + 1);
        state.crm.projects.push({ id: pid, title: o.project.title, location: o.project.location, serviceUnit: o.project.serviceUnit, confidenceStatus: 'confirmed', sourceMessageId: m.crmCandidate.sourceMessageId, confirmedBy: actor().name });
        state.crm.leads.push({ id: 'LED-' + (state.crm.leads.length + 1), serviceUnit: o.lead.serviceUnit, summary: o.lead.summary, confidenceStatus: 'confirmed', sourceMessageId: m.crmCandidate.sourceMessageId });
        state.crm.tasks.push({ id: 'TSK-' + (state.crm.tasks.length + 1), title: o.task.title, status: 'open', confidenceStatus: 'confirmed', sourceMessageId: m.crmCandidate.sourceMessageId });
        renderChat();
      }
      return;
    }
    var disId = e.target.getAttribute('data-dismiss-crm');
    if (disId) {
      var m2 = state.messages.find(function (x) { return x.id === disId; });
      if (m2 && m2.crmCandidate) { m2.crmCandidate.confidenceStatus = 'dismissed'; renderChat(); }
      return;
    }
    var openDid = e.target.getAttribute('data-open-draft');
    if (openDid) { switchTab('studio'); return; }

    var act = e.target.getAttribute('data-draft-act');
    var did = e.target.getAttribute('data-did');
    if (act && did) {
      var idx = state.drafts.findIndex(function (d) { return d.id === did; });
      if (idx !== -1) {
        var fb = document.getElementById('studioFeedback');
        var res = E.transitionDraft(state.drafts[idx], act, actor());
        if (!res.ok) {
          fb.className = 'notice is-err'; fb.textContent = res.error; fb.hidden = false;
        } else {
          state.drafts[idx] = res.draft;
          fb.className = 'notice is-ok'; fb.textContent = 'Draft #' + did + ' transitioned to: ' + res.draft.status; fb.hidden = false;
          renderStudio();
        }
      }
    }
  });

  document.addEventListener('change', function (e) {
    var rid = e.target.getAttribute('data-rights-sel');
    if (rid) {
      var dr = state.drafts.find(function (d) { return d.id === rid; });
      if (dr) { dr.templateData.photoRights = e.target.value; renderStudio(); }
    }
  });

  renderChat();
})();

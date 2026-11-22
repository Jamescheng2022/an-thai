/**
 * AN-THAI V5.4 – Deterministic Lite CRM + AI Content Studio Engine
 * Principles:
 * - Never fabricates missing fields: marks unmentioned attributes as 'Unknown'
 * - Duplicate candidate matching without auto-merging
 * - Fixed template rendering (AI produces validated JSON fields only, never raw HTML/CSS)
 * - Strict role-gated state machine: contributor cannot self-publish
 * - Zero fabrication in Daily Management Brief
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnThaiStudioEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function slugify(text) {
    var base = String(text || 'update').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (base || 'field-update') + '-' + Date.now().toString(36).slice(-4);
  }

  // 1. Lite Agent-native CRM Extractor (6 objects, explicit Unknowns, duplicate detection)
  function extractCrmCandidates(message, existing) {
    existing = existing || { customers: [], projects: [], tasks: [], leads: [] };
    var text = String(message.text || '').trim();
    var lower = text.toLowerCase();
    
    // Deterministic extraction without hallucinations
    var loc = /rayong|罗勇|ระยอง/i.test(text) ? 'Rayong / EEC, Thailand'
      : (/bangkok|曼谷|กรุงเทพ/i.test(text) ? 'Bangkok, Thailand'
      : (/chonburi|春武里|ชลบุรี/i.test(text) ? 'Chonburi, Thailand'
      : (/ayutthaya|大城|อยุธยา/i.test(text) ? 'Ayutthaya, Thailand' : 'Unknown')));

    var unit = /steel|钢结构|เหล็ก/i.test(text) ? '02 Buyer-Side Steel Procurement Agency'
      : (/powder|vrm|mill|粉体|水泥/i.test(text) ? '03 Powder-Process Equipment'
      : (/instrument|sensor|仪器|เครื่องมือ/i.test(text) ? '04 Field Testing Instruments'
      : (/pile|pda|csl|pit|桩|静载|เสาเข็ม/i.test(text) ? '01 Foundation Testing & Geotech' : 'Unknown')));

    // Extract explicit client hint without guessing
    var custMatch = text.match(/(?:client|customer|客户|บริษัท)[:：\s]+([^,，。\n]{2,40})/i);
    var custName = custMatch ? custMatch[1].trim() : 'Unknown';

    // Duplicate detection without auto-merging
    var dupProject = (existing.projects || []).find(function (p) {
      return (p.location !== 'Unknown' && p.location === loc && p.serviceUnit === unit) ||
             (custName !== 'Unknown' && p.title && p.title.toLowerCase().indexOf(custName.toLowerCase()) !== -1);
    });

    var unknownFields = [];
    if (custName === 'Unknown') unknownFields.push('customerName');
    if (loc === 'Unknown') unknownFields.push('location');
    if (unit === 'Unknown') unknownFields.push('serviceUnit');
    unknownFields.push('contactEmail', 'contactPhone', 'dueDate');

    var projTitle = (custName !== 'Unknown' ? custName + ' · ' : '') +
                    (loc !== 'Unknown' ? loc + ' · ' : '') +
                    (unit !== 'Unknown' ? unit : 'Field Project');

    return {
      sourceMessageId: message.id,
      channel: message.channel || '#team-field-ops',
      confidenceStatus: 'candidate',
      unknownFields: unknownFields,
      duplicateWarning: dupProject
        ? ('Possible match with existing project #' + dupProject.id + ' (' + dupProject.title + ') – manual review required, not auto-merged.')
        : null,
      objects: {
        customer: { name: custName, location: loc, industry: 'Unknown', country: loc.indexOf('Thailand') !== -1 ? 'Thailand' : 'Unknown' },
        contact: { fullName: 'Unknown', roleTitle: 'Unknown', email: 'Unknown', phone: 'Unknown' },
        lead: { serviceUnit: unit, location: loc, summary: text.slice(0, 140), stage: 'new' },
        project: { title: projTitle, location: loc, serviceUnit: unit, status: 'active' },
        task: { title: 'Verify site requirements, client clearance & follow-up', dueDate: 'Unknown', status: 'open' },
        interaction: { channel: message.channel || '#team-field-ops', summary: text.slice(0, 140), sourceMessageId: message.id }
      }
    };
  }

  // 2. AI Content Studio: Targeted Follow-Up Questions (max 3 missing facts)
  function buildInterviewQuestions(input) {
    var qs = [];
    if (!input.location || input.location === 'Unknown') {
      qs.push('1. What is the exact project province/city in Thailand (or anonymized region)?');
    }
    if (!input.actualScope || input.actualScope === 'Unknown') {
      qs.push('2. What exact scope did AN-THAI execute directly vs. partner laboratories or manufacturers?');
    }
    if (!input.photoRights || input.photoRights === 'unknown') {
      qs.push('3. Are attached field photos officially cleared for public website publication (Client Approved)?');
    }
    return qs.slice(0, 3);
  }

  // 3. Fixed Template Renderer (AI supplies validated JSON fields ONLY – never writes HTML/CSS)
  function renderTemplateHtml(draft) {
    var d = draft.templateData || {};
    var typeLabel = draft.contentType === 'case_study' ? 'CASE STUDY'
      : (draft.contentType === 'technical_insight' ? 'TECHNICAL INSIGHT' : 'FIELD UPDATE');
    var photos = Array.isArray(d.photos) ? d.photos : [];
    var photoStrip = photos.length
      ? '<div class="tpl-photos">' + photos.map(function (ph) {
          return '<figure class="tpl-figure"><div class="tpl-ph-box">' + esc(ph.name) + '</div><figcaption>' + esc(ph.caption || 'Field verification photo') + '</figcaption></figure>';
        }).join('') + '</div>'
      : '';

    return [
      '<article class="tpl-preview">',
      '  <div class="tpl-kicker">' + typeLabel + ' · ' + esc(d.location || 'Unknown Location') + ' · ' + esc(d.date || new Date().toISOString().slice(0, 10)) + '</div>',
      '  <h3 class="tpl-title">' + esc(d.title || 'Untitled Draft') + '</h3>',
      '  <p class="tpl-summary">' + esc(d.summary || '') + '</p>',
      photoStrip,
      '  <div class="tpl-grid">',
      '    <div><strong>Service Unit:</strong> ' + esc(d.serviceUnit || 'Unknown') + '</div>',
      '    <div><strong>AN-THAI Direct Scope:</strong> ' + esc(d.actualScope || 'Unknown – Pending Engineering Verification') + '</div>',
      '    <div><strong>Public Rights Clearance:</strong> <span class="' + (d.photoRights === 'client_approved_public' ? 'ok-tag' : 'unknown-tag') + '">' + esc(d.photoRights || 'unknown') + '</span></div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  // 4. Role-Gated State Machine (Contributor CANNOT self-publish)
  function transitionDraft(draft, action, actor) {
    var role = (actor && actor.role) || 'contributor';
    var now = new Date().toISOString();
    var next = JSON.parse(JSON.stringify(draft));
    next.approvals = next.approvals || [];
    next.revisions = next.revisions || [];

    if (action === 'submit') {
      next.status = 'in_review';
    } else if (action === 'approve' || action === 'publish') {
      if (role !== 'editor' && role !== 'publisher' && role !== 'admin') {
        return { ok: false, error: 'PERMISSION_DENIED: Contributor role cannot approve or publish directly. Editor or Publisher required.' };
      }
      if (action === 'publish' && next.templateData.photoRights !== 'client_approved_public') {
        return { ok: false, error: 'DISCLOSURE_BLOCKED: Public disclosure permission must be verified (Client Approved Public) before website publishing.' };
      }
      next.revisions.push({
        version: next.revisions.length + 1,
        timestamp: now,
        actor: actor.name,
        role: role,
        snapshot: JSON.parse(JSON.stringify(next.templateData))
      });
      next.status = action === 'publish' ? 'published' : 'approved';
      if (action === 'publish') {
        next.publishedAt = now;
        next.canonicalUrl = 'https://an-thai.com/updates/' + next.slug + '.html';
      }
    } else if (action === 'retract' || action === 'rollback') {
      if (role !== 'editor' && role !== 'publisher' && role !== 'admin') {
        return { ok: false, error: 'PERMISSION_DENIED: Only Editor or Publisher can retract or roll back published content.' };
      }
      next.status = 'retracted';
      next.canonicalUrl = null;
    } else {
      return { ok: false, error: 'INVALID_ACTION: Unknown transition action.' };
    }

    next.approvals.push({ action: action, actor: actor.name, role: role, timestamp: now });
    next.updatedAt = now;
    return { ok: true, draft: next };
  }

  // 5. Daily Management Brief (Strict Zero-Fabrication over Confirmed Records)
  function generateDailyBrief(crm, drafts) {
    crm = crm || {};
    drafts = drafts || [];
    var confirmedProjects = (crm.projects || []).filter(function (x) { return x.confidenceStatus === 'confirmed'; });
    var confirmedLeads = (crm.leads || []).filter(function (x) { return x.confidenceStatus === 'confirmed'; });
    var openTasks = (crm.tasks || []).filter(function (x) { return x.confidenceStatus === 'confirmed' && x.status !== 'done'; });
    var pendingReview = drafts.filter(function (d) { return d.status === 'in_review'; });
    var published = drafts.filter(function (d) { return d.status === 'published'; });

    return {
      generatedAt: new Date().toISOString(),
      confirmedProjectsCount: confirmedProjects.length,
      confirmedLeadsCount: confirmedLeads.length,
      openTasksCount: openTasks.length,
      pendingContentReviewCount: pendingReview.length,
      publishedContentCount: published.length,
      revenueEstimate: 'Not tracked (zero fabrication)',
      highlights: confirmedProjects.map(function (p) {
        return p.title + ' [' + p.location + '] (Source: ' + (p.sourceMessageId || 'Direct') + ')';
      })
    };
  }

  return {
    slugify: slugify,
    extractCrmCandidates: extractCrmCandidates,
    buildInterviewQuestions: buildInterviewQuestions,
    renderTemplateHtml: renderTemplateHtml,
    transitionDraft: transitionDraft,
    generateDailyBrief: generateDailyBrief
  };
});

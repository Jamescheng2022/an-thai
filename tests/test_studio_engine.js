const assert = require('assert');
const path = require('path');
const Engine = require(path.resolve(__dirname, '../studio/studio-engine.js'));

console.log('--- Testing AN-THAI V5.4 Studio Engine ---');

// 1. CRM Candidates Extraction & Unknowns
console.log('1. Testing extractCrmCandidates...');
const msg1 = {
  id: 'msg-test-1',
  channel: '#team-field-ops',
  text: '今天在罗勇进行了桩基检测，工作内容：36根灌注桩CSL声测。客户：Rayong Industrial Park。'
};
const cand1 = Engine.extractCrmCandidates(msg1);
assert.strictEqual(cand1.objects.customer.name, 'Rayong Industrial Park');
assert.strictEqual(cand1.objects.project.location, 'Rayong / EEC, Thailand');
assert.strictEqual(cand1.objects.project.serviceUnit, '01 Foundation Testing & Geotech');
assert.ok(cand1.unknownFields.includes('contactEmail'));
assert.ok(cand1.unknownFields.includes('dueDate'));
assert.strictEqual(cand1.duplicateWarning, null);
console.log('✓ Candidate 1 extraction & Unknowns verified.');

// 2. Duplicate Detection (Zero Silent Auto-Merge)
console.log('2. Testing duplicate detection without auto-merge...');
const existingProjects = [
  { id: 'proj-1', title: 'Rayong / EEC, Thailand · 01 Foundation Testing & Geotech', location: 'Rayong / EEC, Thailand', serviceUnit: '01 Foundation Testing & Geotech' }
];
const cand2 = Engine.extractCrmCandidates(msg1, { projects: existingProjects });
assert.ok(cand2.duplicateWarning !== null);
assert.ok(cand2.duplicateWarning.includes('Possible match with existing project #proj-1'));
assert.strictEqual(cand2.confidenceStatus, 'candidate'); // Not auto-merged
console.log('✓ Duplicate detection & manual review flag verified.');

// 3. Interview Follow-Up Questions (Max 3)
console.log('3. Testing buildInterviewQuestions...');
const qs = Engine.buildInterviewQuestions({ location: 'Unknown', actualScope: 'Unknown', photoRights: 'unknown' });
assert.strictEqual(qs.length, 3);
assert.ok(qs[0].includes('province/city'));
assert.ok(qs[1].includes('scope'));
assert.ok(qs[2].includes('cleared for public website'));
console.log('✓ Interview questions count & targeting verified.');

// 4. Fixed Template Rendering
console.log('4. Testing renderTemplateHtml...');
const sampleDraft = {
  contentType: 'field_update',
  templateData: {
    title: 'Rayong CSL Testing 36 Bored Piles',
    location: 'Rayong / EEC, Thailand',
    date: '2026-11-21',
    summary: 'Field ultrasonic crosshole sonic logging completed on 36 bored piles.',
    serviceUnit: '01 Foundation Testing & Geotech',
    actualScope: 'Direct AN-THAI pile testing execution',
    photoRights: 'client_approved_public',
    photos: [{ name: 'pile-test-1.jpg', caption: 'CSL probe preparation' }]
  }
};
const html = Engine.renderTemplateHtml(sampleDraft);
assert.ok(html.includes('FIELD UPDATE'));
assert.ok(html.includes('Rayong CSL Testing 36 Bored Piles'));
assert.ok(html.includes('EXIF stripped'));
assert.ok(html.includes('client_approved_public'));
console.log('✓ Fixed template rendering verified.');

// 5. Role-Gated State Machine
console.log('5. Testing role-gated state machine...');
const draftObj = {
  id: 'draft-1',
  slug: 'rayong-csl-test',
  contentType: 'field_update',
  status: 'draft',
  templateData: {
    title: 'Rayong CSL Test',
    photoRights: 'unknown'
  }
};

// Contributor submit
const resSubmit = Engine.transitionDraft(draftObj, 'submit', { name: 'Engineer', role: 'contributor' });
assert.strictEqual(resSubmit.ok, true);
assert.strictEqual(resSubmit.draft.status, 'in_review');

// Contributor try publish -> MUST FAIL
const resContribPub = Engine.transitionDraft(resSubmit.draft, 'publish', { name: 'Engineer', role: 'contributor' });
assert.strictEqual(resContribPub.ok, false);
assert.ok(resContribPub.error.includes('PERMISSION_DENIED'));

// Publisher try publish with photoRights = unknown -> MUST FAIL
const resPubBlocked = Engine.transitionDraft(resSubmit.draft, 'publish', { name: 'Manager', role: 'publisher' });
assert.strictEqual(resPubBlocked.ok, false);
assert.ok(resPubBlocked.error.includes('DISCLOSURE_BLOCKED'));

// Publisher publish with photoRights = client_approved_public -> SUCCESS
resSubmit.draft.templateData.photoRights = 'client_approved_public';
const resPubOk = Engine.transitionDraft(resSubmit.draft, 'publish', { name: 'Manager', role: 'publisher' });
assert.strictEqual(resPubOk.ok, true);
assert.strictEqual(resPubOk.draft.status, 'published');
assert.strictEqual(resPubOk.draft.canonicalUrl, 'https://an-thai.com/updates/rayong-csl-test.html');
assert.strictEqual(resPubOk.draft.revisions.length, 1);

// Publisher retract -> SUCCESS
const resRetract = Engine.transitionDraft(resPubOk.draft, 'retract', { name: 'Manager', role: 'publisher' });
assert.strictEqual(resRetract.ok, true);
assert.strictEqual(resRetract.draft.status, 'retracted');
assert.strictEqual(resRetract.draft.canonicalUrl, null);
console.log('✓ Role-gated state machine, permissions, disclosure gate & rollback verified.');

// 6. Daily Management Brief (Zero Fabrication)
console.log('6. Testing generateDailyBrief...');
const briefCrm = {
  projects: [
    { id: 'p1', title: 'Rayong Project', location: 'Rayong', confidenceStatus: 'confirmed' },
    { id: 'p2', title: 'Unconfirmed Project', location: 'Bangkok', confidenceStatus: 'candidate' }
  ],
  leads: [
    { id: 'l1', summary: 'Steel lead', confidenceStatus: 'confirmed' }
  ],
  tasks: [
    { id: 't1', title: 'Check specs', confidenceStatus: 'confirmed', status: 'open' }
  ]
};
const briefDrafts = [resPubOk.draft];
const brief = Engine.generateDailyBrief(briefCrm, briefDrafts);
assert.strictEqual(brief.confirmedProjectsCount, 1); // Only confirmed
assert.strictEqual(brief.confirmedLeadsCount, 1);
assert.strictEqual(brief.openTasksCount, 1);
assert.strictEqual(brief.publishedContentCount, 1);
assert.strictEqual(brief.revenueEstimate, 'Not tracked (zero fabrication)');
console.log('✓ Daily brief zero-fabrication metrics verified.');

console.log('--- ALL STUDIO ENGINE TESTS PASSED! ---');

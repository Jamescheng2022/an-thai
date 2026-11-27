#!/usr/bin/env node
'use strict';

/**
 * Automated P4 Multi-Tenant Provisioning & Gate Verification Suite.
 */
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateAgainstSchema } = require('./provision-tenant.cjs');

const root = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'config/tenants/tenant.schema.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'themes/manifest.json'), 'utf8'));

// 1. Validate all checked-in tenant configs in check-only mode
for (const f of ['test-demo.json', 'an-thai-pilot.json', 'paco-check-only.json']) {
  const out = execFileSync(process.execPath, [path.join(__dirname, 'provision-tenant.cjs'), '--config', `config/tenants/${f}`, '--check-only'], { cwd: root, encoding: 'utf8' });
  assert(out.includes('PASS_CHECK_ONLY'), `Expected PASS_CHECK_ONLY for ${f}, got: ${out}`);
}

// 2. Full build provisioning for test-demo & an-thai-pilot
for (const [f, outDir] of [['test-demo.json', 'dist-test-demo'], ['an-thai-pilot.json', 'dist-an-thai-pilot']]) {
  const out = execFileSync(process.execPath, [path.join(__dirname, 'provision-tenant.cjs'), '--config', `config/tenants/${f}`, '--out', outDir], { cwd: root, encoding: 'utf8' });
  assert(out.includes('PASS_PROVISIONED'), `Expected PASS_PROVISIONED for ${f}: ${out}`);
  const md = fs.readFileSync(path.join(root, outDir, 'PROVISIONING_CHECKLIST.md'), 'utf8');
  const plan = JSON.parse(fs.readFileSync(path.join(root, outDir, 'provision-plan.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, outDir, 'index.html'), 'utf8');
  assert(html.includes('noindex, nofollow'), `${outDir} must enforce noindex`);
  assert(plan.noindex === true && md.includes('noindex, nofollow'), `${outDir} plan/checklist must match HTML noindex policy`);
  const sr03 = plan.steps.find((step) => step.id === 'SR-03');
  assert(sr03 && Array.isArray(sr03.requiredDbBindings) && sr03.requiredDbBindings.length === 4, `${outDir} SR-03 must list all 4 requiredDbBindings`);
  for (const field of ['external_enterprise_id + external_workspace_id', 'organization_id', 'default_project_id']) {
    assert(sr03.requiredDbBindings.some((entry) => entry.includes(field)) && md.includes(field), `${outDir} SR-03 missing DB binding ${field}`);
  }
}

// 3. Verify OWNER_GATES #7 blocks non-check-only build on paco-check-only.json
for (const scriptName of ['provision-tenant.cjs', 'build-tenant.cjs']) {
  let blocked = false;
  try {
    execFileSync(process.execPath, [path.join(__dirname, scriptName), '--config', 'config/tenants/paco-check-only.json'], { cwd: root, stdio: 'pipe' });
  } catch (err) {
    blocked = String(err.stderr || err.message).includes('OWNER_GATE_HOLD_BLOCKS_BUILD');
  }
  assert(blocked, `${scriptName} must fail closed on OWNER_GATES #7 checkOnly profile`);
}

// 4. Exhaustive schema & isolation negative tests
const baseCfg = JSON.parse(fs.readFileSync(path.join(root, 'config/tenants/test-demo.json'), 'utf8'));
const invalidCases = [
  ['numeric legalName', { ...baseCfg, legalName: 12345 }],
  ['numeric primaryDomain', { ...baseCfg, primaryDomain: 999 }],
  ['invalid email', { ...baseCfg, directEmail: 'not-an-email' }],
  ['invalid allowedOrigins', { ...baseCfg, allowedOrigins: ['http://insecure.example.com'] }],
  ['missing sourceRating.bridgeEndpoint', { ...baseCfg, sourceRating: { workspaceKey: 'x-co', callerKind: 'an_thai_v1_1' } }],
  ['extra nested property', { ...baseCfg, sourceRating: { ...baseCfg.sourceRating, extraField: 'nope' } }],
  ['noindex false contradiction', { ...baseCfg, noindex: false }],
  ['embedded Resend secret', { ...baseCfg, officeAddress: 'Leaked re_1234567890abcdef token' }],
  ['unknown theme', { ...baseCfg, theme: 'neon-vapor' }],
];
for (const [label, cfg] of invalidCases) {
  const errs = validateAgainstSchema(cfg, schema, manifest);
  assert(errs.length > 0, `Expected schema validation failure for ${label}`);
}

// 5. Provisioning artifact leak scan rejects cross-tenant marker inside allowedOrigins
const pilotCfg = JSON.parse(fs.readFileSync(path.join(root, 'config/tenants/an-thai-pilot.json'), 'utf8'));
const leakyPilot = { ...pilotCfg, allowedOrigins: ['https://test-demo.example.com'] };
const tmpLeaky = path.join(os.tmpdir(), `leaky-pilot-${Date.now()}.json`);
fs.writeFileSync(tmpLeaky, JSON.stringify(leakyPilot));
try {
  let rejected = false;
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'provision-tenant.cjs'), '--config', tmpLeaky, '--out', 'dist-leaky-tmp'], { cwd: root, stdio: 'pipe' });
  } catch (err) {
    rejected = String(err.stderr || err.message).includes('TENANT_ISOLATION_VIOLATION');
  }
  assert(rejected, 'Provisioner must reject cross-tenant leak inside allowedOrigins before emitting artifacts');
  assert(!fs.existsSync(path.join(root, 'dist-leaky-tmp')), 'Rejected provision must leave zero output directory');
} finally {
  fs.rmSync(tmpLeaky, { force: true });
}

console.log('PASS: P4 recursive schema, artifact isolation leak scan, an-thai internal pilot, paco OWNER_GATES #7 hold, and negative secret/type tests');

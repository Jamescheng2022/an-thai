#!/usr/bin/env node
'use strict';

/**
 * Automated P4 Multi-Tenant Provisioning & Gate Verification Suite.
 */
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
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
  assert(fs.existsSync(path.join(root, outDir, 'PROVISIONING_CHECKLIST.md')), `Missing checklist in ${outDir}`);
  assert(fs.existsSync(path.join(root, outDir, 'provision-plan.json')), `Missing provision plan in ${outDir}`);
  const html = fs.readFileSync(path.join(root, outDir, 'index.html'), 'utf8');
  assert(html.includes('noindex, nofollow'), `${outDir} must enforce noindex`);
}

// 3. Verify OWNER_GATES #7 blocks non-check-only build on paco-check-only.json (both via provision-tenant and build-tenant)
for (const scriptName of ['provision-tenant.cjs', 'build-tenant.cjs']) {
  let blocked = false;
  try {
    execFileSync(process.execPath, [path.join(__dirname, scriptName), '--config', 'config/tenants/paco-check-only.json'], { cwd: root, stdio: 'pipe' });
  } catch (err) {
    blocked = String(err.stderr || err.message).includes('OWNER_GATE_HOLD_BLOCKS_BUILD');
  }
  assert(blocked, `${scriptName} must fail closed on OWNER_GATES #7 checkOnly profile`);
}

// 4. Negative checks: embedded secret rejection & invalid theme rejection
const baseCfg = JSON.parse(fs.readFileSync(path.join(root, 'config/tenants/test-demo.json'), 'utf8'));
const badSecret = Object.assign({}, baseCfg, { officeAddress: 'Leaked re_1234567890abcdef token' });
assert(validateAgainstSchema(badSecret, schema, manifest).some((e) => e.includes('secret')), 'Must reject leaked API secret');

const badTheme = Object.assign({}, baseCfg, { theme: 'neon-vapor' });
assert(validateAgainstSchema(badTheme, schema, manifest).some((e) => e.includes('theme')), 'Must reject unknown theme');

console.log('PASS: P4 10-domain onboarding schema, an-thai internal pilot build + checklists, paco OWNER_GATES #7 fail-closed guard, and secret/theme validation');

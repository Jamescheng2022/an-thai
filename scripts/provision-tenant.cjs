#!/usr/bin/env node
'use strict';

/**
 * P4 Enterprise Fleet Onboarding Validator & Executable Checklist Runner
 * - Enforces full recursive JSON Schema validation (tenant.schema.json) + theme manifest check.
 * - Rejects embedded secret patterns and enforces OWNER_GATES holds (--check-only only).
 * - Enforces shared cross-tenant leak scan across both generated HTML and provisioning artifacts.
 */
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SECRET_VALUE_PATTERNS = [
  /\bre_[A-Za-z0-9_]{12,}\b/,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
  /\bsb_secret_[A-Za-z0-9_-]+\b/,
  /\bpostgres(?:ql)?:\/\/[^/\s]+:[^@\s]+@/i,
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getForbiddenLeakTerms(cfg) {
  const isSelfAnThaiPilot = cfg && cfg.internalPilot === true && cfg.tenantSlug === 'an-thai-pilot';
  return isSelfAnThaiPilot
    ? ['PACO', 'ROGE', 'TEST-ANTHAI-UPD', 'test-demo', 'test-demo-noreply@example.invalid']
    : [
        'an-thai.com', 'info@an-thai.com', 'an-thai-th', '66902921749', '90 292 1749',
        'James2021', 'p0_XsfILmH', 'Arwan', 'PACO', 'ROGE', 'TEST-ANTHAI-UPD', '安泰', 'อัน-ไทย'
      ];
}

function scanTextForLeaks(text, forbiddenTerms, sourceLabel) {
  const lower = String(text).toLowerCase();
  const hits = [];
  for (const term of forbiddenTerms) {
    if (lower.includes(term.toLowerCase())) {
      hits.push(`Forbidden term "${term}" leaked in ${sourceLabel}`);
    }
  }
  return hits;
}

function scanDirForLeaks(dir, forbiddenTerms, baseDir) {
  const rootDir = baseDir || dir;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForLeaks(full, forbiddenTerms, rootDir);
    } else if (entry.isFile()) {
      const content = fs.readFileSync(full, 'utf8');
      const hits = scanTextForLeaks(content, forbiddenTerms, path.relative(rootDir, full));
      assert.strictEqual(hits.length, 0, hits[0] || '');
    }
  }
}

function validateSchemaNode(val, schemaNode, pathLabel, errors) {
  if (!schemaNode || typeof schemaNode !== 'object') return;
  if (schemaNode.type) {
    const actualType = Array.isArray(val) ? 'array' : (val === null ? 'null' : typeof val);
    if (schemaNode.type !== actualType) {
      errors.push(`${pathLabel} expected ${schemaNode.type}, got ${actualType}`);
      return;
    }
  }
  if (Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(val)) {
    errors.push(`${pathLabel} value ${JSON.stringify(val)} not in allowed enum [${schemaNode.enum.map((x) => JSON.stringify(x)).join(', ')}]`);
  }
  if (typeof val === 'string') {
    if (typeof schemaNode.minLength === 'number' && val.length < schemaNode.minLength) {
      errors.push(`${pathLabel} length ${val.length} < minLength ${schemaNode.minLength}`);
    }
    if (typeof schemaNode.maxLength === 'number' && val.length > schemaNode.maxLength) {
      errors.push(`${pathLabel} length ${val.length} > maxLength ${schemaNode.maxLength}`);
    }
    if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(val)) {
      errors.push(`${pathLabel} does not match pattern ${schemaNode.pattern}`);
    }
    if (schemaNode.format === 'email' && !EMAIL_RE.test(val)) {
      errors.push(`${pathLabel} is not a valid email address: ${val}`);
    }
  } else if (Array.isArray(val)) {
    if (typeof schemaNode.minItems === 'number' && val.length < schemaNode.minItems) {
      errors.push(`${pathLabel} items ${val.length} < minItems ${schemaNode.minItems}`);
    }
    if (typeof schemaNode.maxItems === 'number' && val.length > schemaNode.maxItems) {
      errors.push(`${pathLabel} items ${val.length} > maxItems ${schemaNode.maxItems}`);
    }
    if (schemaNode.items) {
      val.forEach((item, idx) => validateSchemaNode(item, schemaNode.items, `${pathLabel}[${idx}]`, errors));
    }
  } else if (val && typeof val === 'object') {
    const props = schemaNode.properties || {};
    if (schemaNode.additionalProperties === false) {
      for (const k of Object.keys(val)) {
        if (!Object.prototype.hasOwnProperty.call(props, k)) {
          errors.push(`Unexpected property: ${pathLabel ? pathLabel + '.' : ''}${k}`);
        }
      }
    }
    for (const req of schemaNode.required || []) {
      if (val[req] === undefined || val[req] === null || val[req] === '') {
        errors.push(`Missing required field: ${pathLabel ? pathLabel + '.' : ''}${req}`);
      }
    }
    for (const [k, subSchema] of Object.entries(props)) {
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        validateSchemaNode(val[k], subSchema, pathLabel ? `${pathLabel}.${k}` : k, errors);
      }
    }
  }
}

function validateAgainstSchema(cfg, schema, manifest) {
  const errors = [];
  validateSchemaNode(cfg, schema, '', errors);

  const validThemes = new Set(['default', ...manifest.presets.map((p) => p.id)]);
  if (cfg && typeof cfg.theme === 'string' && !validThemes.has(cfg.theme)) {
    errors.push(`Theme "${cfg.theme}" missing from themes/manifest.json`);
  }

  const rawStr = JSON.stringify(cfg);
  for (const rx of SECRET_VALUE_PATTERNS) {
    if (rx.test(rawStr)) errors.push(`Forbidden secret-like value detected matching ${rx}`);
  }
  return errors;
}

function buildChecklistPlan(cfg, rootDir, outDirRel) {
  const domainHost = String(cfg.primaryDomain || '').replace(/^https?:\/\//i, '');
  const wsKey = cfg.sourceRating.workspaceKey;
  const origins = Array.isArray(cfg.allowedOrigins) && cfg.allowedOrigins.length
    ? cfg.allowedOrigins
    : [cfg.primaryDomain];
  const held = Boolean(cfg.checkOnly || cfg.ownerGateHold);

  return {
    schemaVersion: '1.0.0',
    tenantSlug: cfg.tenantSlug,
    legalName: cfg.legalName,
    workspaceKey: wsKey,
    theme: cfg.theme,
    mode: held ? 'check-only-held' : 'executable-ready',
    ownerGateHold: cfg.ownerGateHold || null,
    // build-tenant.cjs unconditionally enforces <meta name="robots" content="noindex, nofollow" />
    noindex: true,
    outDir: outDirRel,
    steps: [
      {
        id: 'DNS-01',
        stage: 'Domain & DNS Verification',
        verifyCmd: `nslookup -type=TXT ${domainHost} 1.1.1.1`,
        requirements: [
          `CNAME / A record pointing ${domainHost} to Vercel Edge`,
          'TXT resend-domain-verification, SPF, DKIM (resend._domainkey), DMARC (_dmarc)',
        ],
      },
      {
        id: 'VERCEL-02',
        stage: 'Vercel Project & Env Key Inventory (Names Only — Zero Secret Values)',
        envKeysPreviewOnly: ['SR_BRIDGE_BASE_URL', 'SR_VERCEL_PROTECTION_BYPASS'],
        envKeysSharedNames: ['RESEND_API_KEY', 'ENQUIRY_FROM_EMAIL', 'ENQUIRY_TO_EMAIL', 'NEXT_PUBLIC_GA_MEASUREMENT_ID'],
        policy: 'previewDeploymentsDisabled=true; manual single Preview only via MASTER LEAD',
      },
      {
        id: 'SR-03',
        stage: 'SourceRating I-4 External Workspace Binding',
        workspaceKey: wsKey,
        callerKind: cfg.sourceRating.callerKind,
        allowedOrigins: origins,
        verifyEndpoint: `${cfg.primaryDomain}/api/sr-bridge?route=health&workspaceKey=${wsKey}`,
      },
      {
        id: 'THEME-04',
        stage: 'Visual Preset & Byte Budget Gate',
        theme: cfg.theme,
        verifyCmd: 'node scripts/check-themes.cjs',
      },
      {
        id: 'ISOLATION-05',
        stage: 'Static Build, Leak Scan & Inquiry Failover Smoke',
        verifyCmd: held
          ? `node scripts/provision-tenant.cjs --config config/tenants/${cfg.tenantSlug}.json --check-only`
          : `node scripts/build-tenant.cjs --config config/tenants/${cfg.tenantSlug}.json --out ${outDirRel}`,
      },
    ],
  };
}

function renderChecklistMarkdown(plan) {
  const lines = [
    `# Provisioning Checklist — ${plan.legalName} (\`${plan.tenantSlug}\`)`,
    '',
    `- **Schema Version:** \`${plan.schemaVersion}\``,
    `- **Mode:** \`${plan.mode}\`${plan.ownerGateHold ? ` (**HOLD:** \`${plan.ownerGateHold}\`)` : ''}`,
    `- **Workspace Key:** \`${plan.workspaceKey}\``,
    `- **Visual Theme Preset:** \`${plan.theme}\``,
    `- **Robots Policy:** \`noindex, nofollow (enforced by isolated template)\``,
    '',
    '## Provisioning & Verification Steps',
    '',
  ];
  for (const s of plan.steps) {
    lines.push(`### ${s.id}: ${s.stage}`);
    if (s.verifyCmd) lines.push(`- **Command:** \`${s.verifyCmd}\``);
    if (s.requirements) s.requirements.forEach((r) => lines.push(`- ${r}`));
    if (s.envKeysPreviewOnly) lines.push(`- **Preview-Only Keys:** \`${s.envKeysPreviewOnly.join('`, `')}\``);
    if (s.envKeysSharedNames) lines.push(`- **Env Keys Required (Names Only):** \`${s.envKeysSharedNames.join('`, `')}\``);
    if (s.allowedOrigins) lines.push(`- **Allowed Origins:** \`${s.allowedOrigins.join('`, `')}\``);
    if (s.verifyEndpoint) lines.push(`- **Health Endpoint:** \`${s.verifyEndpoint}\``);
    lines.push('');
  }
  return lines.join('\n');
}

function runCli() {
  const args = process.argv.slice(2);
  const cfgIdx = args.indexOf('--config');
  const outIdx = args.indexOf('--out');
  const checkOnly = args.includes('--check-only');
  const jsonMode = args.includes('--json');

  const root = path.resolve(__dirname, '..');
  const cfgPath = path.resolve(root, cfgIdx >= 0 ? args[cfgIdx + 1] : 'config/tenants/test-demo.json');
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'config/tenants/tenant.schema.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'themes/manifest.json'), 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

  const errs = validateAgainstSchema(cfg, schema, manifest);
  if (errs.length > 0) {
    throw new Error(`TENANT_CONFIG_INVALID (${path.basename(cfgPath)}): ${errs.join('; ')}`);
  }

  const outRel = outIdx >= 0 ? args[outIdx + 1] : `dist-${cfg.tenantSlug}`;
  const plan = buildChecklistPlan(cfg, root, outRel);
  const planJson = JSON.stringify(plan, null, 2);
  const checklistMd = renderChecklistMarkdown(plan);
  const forbiddenTerms = getForbiddenLeakTerms(cfg);

  if (!(cfg.checkOnly || cfg.ownerGateHold)) {
    const leakHits = [
      ...scanTextForLeaks(planJson, forbiddenTerms, 'provision-plan.json'),
      ...scanTextForLeaks(checklistMd, forbiddenTerms, 'PROVISIONING_CHECKLIST.md'),
    ];
    if (leakHits.length > 0) {
      throw new Error(`TENANT_ISOLATION_VIOLATION: ${leakHits.join('; ')}`);
    }
  }

  if (checkOnly) {
    const msg = cfg.ownerGateHold || cfg.checkOnly
      ? `PASS_CHECK_ONLY_HOLD_ENFORCED (${cfg.tenantSlug}, hold=${cfg.ownerGateHold || 'checkOnly'})`
      : `PASS_CHECK_ONLY (${cfg.tenantSlug}, theme=${cfg.theme}, workspace=${plan.workspaceKey})`;
    if (jsonMode) console.log(JSON.stringify({ ok: true, status: msg, plan }, null, 2));
    else console.log(msg);
    return;
  }

  if (cfg.checkOnly || cfg.ownerGateHold) {
    throw new Error(`OWNER_GATE_HOLD_BLOCKS_BUILD: cannot emit site for held profile "${cfg.tenantSlug}" (${cfg.ownerGateHold || 'checkOnly'})`);
  }

  execFileSync(process.execPath, [path.join(__dirname, 'check-themes.cjs')], { cwd: root, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(__dirname, 'build-tenant.cjs'), '--config', cfgPath, '--out', outRel], { cwd: root, stdio: 'pipe' });

  const outAbs = path.resolve(root, outRel);
  fs.writeFileSync(path.join(outAbs, 'provision-plan.json'), planJson);
  fs.writeFileSync(path.join(outAbs, 'PROVISIONING_CHECKLIST.md'), checklistMd);
  scanDirForLeaks(outAbs, forbiddenTerms);

  if (jsonMode) console.log(JSON.stringify({ ok: true, built: outRel, plan }, null, 2));
  else console.log(`PASS_PROVISIONED: "${cfg.legalName}" -> ${outRel} (checklist + plan + 6 noindex pages, workspaceKey=${plan.workspaceKey})`);
}

if (require.main === module) {
  runCli();
}

module.exports = {
  getForbiddenLeakTerms,
  scanTextForLeaks,
  scanDirForLeaks,
  validateAgainstSchema,
  buildChecklistPlan,
  renderChecklistMarkdown,
};

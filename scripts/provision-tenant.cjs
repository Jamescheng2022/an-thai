#!/usr/bin/env node
'use strict';

/**
 * P4 Enterprise Fleet Onboarding Validator & Executable Checklist Runner
 * - Validates tenant configs against config/tenants/tenant.schema.json + themes/manifest.json.
 * - Rejects embedded secret patterns and enforces OWNER_GATES holds (--check-only only).
 * - Builds isolated site via build-tenant.cjs and writes deterministic PROVISIONING_CHECKLIST.md + provision-plan.json.
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

function validateAgainstSchema(cfg, schema, manifest) {
  const errors = [];
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    return ['Root config must be a JSON object'];
  }
  const allowedTop = new Set(Object.keys(schema.properties || {}));
  for (const k of Object.keys(cfg)) {
    if (!allowedTop.has(k)) errors.push(`Unexpected top-level property: ${k}`);
  }
  for (const req of schema.required || []) {
    if (cfg[req] === undefined || cfg[req] === null || cfg[req] === '') {
      errors.push(`Missing required field: ${req}`);
    }
  }
  if (typeof cfg.tenantSlug === 'string' && !/^[a-z0-9][a-z0-9-]{1,48}$/.test(cfg.tenantSlug)) {
    errors.push(`Invalid tenantSlug format: ${cfg.tenantSlug}`);
  }
  if (typeof cfg.primaryDomain === 'string' && !/^https:\/\/[a-z0-9.-]+$/.test(cfg.primaryDomain)) {
    errors.push(`primaryDomain must be strict https:// hostname: ${cfg.primaryDomain}`);
  }
  const validThemes = new Set(['default', ...manifest.presets.map((p) => p.id)]);
  if (!validThemes.has(cfg.theme)) {
    errors.push(`Invalid theme "${cfg.theme}"; allowed: ${Array.from(validThemes).join(', ')}`);
  }
  for (const locKey of ['brandTagline', 'heroHeadline', 'heroLead']) {
    const obj = cfg[locKey];
    if (!obj || typeof obj !== 'object') {
      errors.push(`Missing object ${locKey}`);
    } else {
      for (const l of ['EN', 'ZH', 'TH']) {
        if (!obj[l] || typeof obj[l] !== 'string' || obj[l].trim().length < 2) {
          errors.push(`${locKey}.${l} must be non-empty string`);
        }
      }
    }
  }
  if (!cfg.sourceRating || typeof cfg.sourceRating !== 'object') {
    errors.push('Missing sourceRating object');
  } else {
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(String(cfg.sourceRating.workspaceKey || ''))) {
      errors.push(`Invalid sourceRating.workspaceKey: ${cfg.sourceRating.workspaceKey}`);
    }
    if (!['an_thai_v1_1', 'precast_v3_1'].includes(cfg.sourceRating.callerKind)) {
      errors.push(`Unsupported callerKind: ${cfg.sourceRating.callerKind}`);
    }
  }
  if (!Array.isArray(cfg.serviceLines) || cfg.serviceLines.length < 1) {
    errors.push('serviceLines must contain at least 1 entry');
  } else {
    cfg.serviceLines.forEach((s, idx) => {
      for (const k of ['code', 'value', 'titleEN', 'descEN', 'titleZH', 'descZH', 'titleTH', 'descTH']) {
        if (!s || typeof s[k] !== 'string' || !s[k].trim()) {
          errors.push(`serviceLines[${idx}].${k} required`);
        }
      }
    });
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
    noindex: cfg.noindex !== false,
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
    `- **Robots Policy:** \`${plan.noindex ? 'noindex, nofollow (safe isolated preview)' : 'index, follow'}\``,
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
  fs.writeFileSync(path.join(outAbs, 'provision-plan.json'), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(outAbs, 'PROVISIONING_CHECKLIST.md'), renderChecklistMarkdown(plan));

  if (jsonMode) console.log(JSON.stringify({ ok: true, built: outRel, plan }, null, 2));
  else console.log(`PASS_PROVISIONED: "${cfg.legalName}" -> ${outRel} (checklist + plan + 6 noindex pages, workspaceKey=${plan.workspaceKey})`);
}

if (require.main === module) {
  runCli();
}

module.exports = { validateAgainstSchema, buildChecklistPlan, renderChecklistMarkdown };

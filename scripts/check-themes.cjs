#!/usr/bin/env node
'use strict';

/**
 * Enforces P1 theme template manifest budgets, reduced-motion guards,
 * production switcher isolation, and zero-numeric Blueprint schematic rules.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'themes', 'manifest.json');
assert(fs.existsSync(manifestPath), 'Missing themes/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.match(String(manifest.version || ''), /^\d+\.\d+\.\d+$/, 'manifest.version must be semver');
assert(Array.isArray(manifest.presets) && manifest.presets.length >= 3, 'At least 3 presets required');

function measureFile(relPath) {
  const full = path.join(root, relPath);
  assert(fs.existsSync(full), `Missing theme asset: ${relPath}`);
  const buf = fs.readFileSync(full);
  return {
    path: relPath,
    rawBytes: buf.length,
    gzipBytes: zlib.gzipSync(buf).length,
    text: buf.toString('utf8'),
  };
}

function stripJsComments(s) {
  return s.replace(/`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => {
    if (m[0] === '`' || m[0] === '"' || m[0] === "'") return m;
    return m[1] === '*' ? ' ' : '';
  });
}
const VALID_RM_PROPS = {
  animation: /^(?:none|inherit|initial|unset)$/i,
  'animation-duration': /^(?:0(?:m?s)?|0\.0+m?s|inherit|initial|unset)(?:\s*,\s*(?:0(?:m?s)?|0\.0+m?s))*$/i,
  transition: /^(?:none|inherit|initial|unset)$/i,
  'transition-duration': /^(?:0(?:m?s)?|0\.0+m?s|inherit|initial|unset)(?:\s*,\s*(?:0(?:m?s)?|0\.0+m?s))*$/i,
  transform: /^(?:none|inherit|initial|unset)$/i,
  opacity: /^(?:0(?:\.\d+)?|1(?:\.0+)?|inherit|initial|unset)$/i,
  'stroke-dashoffset': /^(?:0(?:px|%|em|rem)?|inherit|initial|unset)$/i,
  'scroll-behavior': /^(?:auto|inherit|initial|unset)$/i,
};
function hasReducedMotionRule(cssText) {
  const clean = cssText
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  let pos = 0;
  while (pos < clean.length) {
    const idx = clean.slice(pos).search(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/i);
    if (idx < 0) return false;
    const open = clean.indexOf('{', pos + idx);
    let depth = 0;
    for (let i = open; i < clean.length; i++) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') {
        depth--;
        if (depth === 0) {
          const block = clean.slice(open + 1, i);
          const innerDecls = Array.from(block.matchAll(/\{([^{}]+)\}/g), (m) => m[1]).join(';');
          const hasMotionDecl = innerDecls
            .split(';')
            .some((d) => {
              const colon = d.indexOf(':');
              if (colon < 0) return false;
              const prop = d.slice(0, colon).trim().toLowerCase();
              const val = d.slice(colon + 1).replace(/\s*!important\s*$/i, '').trim();
              return Object.prototype.hasOwnProperty.call(VALID_RM_PROPS, prop) && VALID_RM_PROPS[prop].test(val);
            });
          if (hasMotionDecl) return true;
          pos = i + 1;
          break;
        }
      }
    }
    if (depth !== 0) return false;
  }
  return false;
}

const coreCss = measureFile(manifest.core.css);
const coreJs = measureFile(manifest.core.js);
assert(coreCss.rawBytes <= manifest.core.maxCssRawBytes, `core CSS raw ${coreCss.rawBytes} > ${manifest.core.maxCssRawBytes}`);
assert(coreCss.gzipBytes <= manifest.core.maxCssGzipBytes, `core CSS gz ${coreCss.gzipBytes} > ${manifest.core.maxCssGzipBytes}`);
assert(coreJs.rawBytes <= manifest.core.maxJsRawBytes, `core JS raw ${coreJs.rawBytes} > ${manifest.core.maxJsRawBytes}`);
assert(coreJs.gzipBytes <= manifest.core.maxJsGzipBytes, `core JS gz ${coreJs.gzipBytes} > ${manifest.core.maxJsGzipBytes}`);
assert(hasReducedMotionRule(coreCss.text), 'tokens.css must guard prefers-reduced-motion with CSS rule');
const cleanCoreJs = stripJsComments(coreJs.text);
assert(cleanCoreJs.includes('prefers-reduced-motion') && cleanCoreJs.includes('vercel\\.app'), 'motion-core.js must gate preview host and reduced motion');

const summary = {
  version: manifest.version,
  core: { cssRaw: coreCss.rawBytes, cssGz: coreCss.gzipBytes, jsRaw: coreJs.rawBytes, jsGz: coreJs.gzipBytes },
  presets: {},
};

for (const preset of manifest.presets) {
  const css = measureFile(preset.css);
  const js = measureFile(preset.js);
  assert(css.rawBytes <= preset.maxCssRawBytes, `${preset.id} CSS raw ${css.rawBytes} > ${preset.maxCssRawBytes}`);
  assert(css.gzipBytes <= preset.maxCssGzipBytes, `${preset.id} CSS gz ${css.gzipBytes} > ${preset.maxCssGzipBytes}`);
  assert(js.rawBytes <= preset.maxJsRawBytes, `${preset.id} JS raw ${js.rawBytes} > ${preset.maxJsRawBytes}`);
  assert(js.gzipBytes <= preset.maxJsGzipBytes, `${preset.id} JS gz ${js.gzipBytes} > ${preset.maxJsGzipBytes}`);
  assert(coreJs.rawBytes + js.rawBytes <= 5632, `${preset.id} total raw JS ${coreJs.rawBytes + js.rawBytes} > 5632`);
  assert(coreJs.gzipBytes + js.gzipBytes <= 2560, `${preset.id} total gzip JS ${coreJs.gzipBytes + js.gzipBytes} > 2560`);
  assert(hasReducedMotionRule(css.text), `${preset.id} CSS must support prefers-reduced-motion rule`);

  if (preset.id === 'blueprint') {
    assert(!js.text.includes('bpPanel') && !js.text.includes('SCHEMATIC'), 'Blueprint preset must not inject bpPanel or SCHEMATIC SVG');
    assert(!css.text.includes('.bp-panel') && !css.text.includes('.bp-note') && !css.text.includes('Conceptual curve'), 'Blueprint CSS must not contain removed .bp-* schematic panel rules');
  }

  summary.presets[preset.id] = {
    cssRaw: css.rawBytes,
    cssGz: css.gzipBytes,
    jsRaw: js.rawBytes,
    jsGz: js.gzipBytes,
    totalJsRawWithCore: coreJs.rawBytes + js.rawBytes,
    totalJsGzWithCore: coreJs.gzipBytes + js.gzipBytes,
  };
}

console.log('PASS: theme manifest byte budgets & schematic/reduced-motion contracts:', JSON.stringify(summary));

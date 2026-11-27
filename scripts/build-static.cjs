// Package only public website files. No dependencies or framework build.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html', 'about.html', 'contact.html', 'testing.html',
  'steel-procurement.html', 'powder-equipment.html', 'testing-instruments.html',
  'services.html', 'equipment.html', 'portfolio.html', 'insights.html',
  '404.html', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'llms.txt'
];
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));

// Copy public asset and content directories (exclude internal studio/, api/, review-only leads, raw cases registry, rights-held external case banners, unlinked legacy draft downloads; V1.1 branch includes sourcerating-embed-adapter.js & sr-bridge-mock.js)
if (fs.existsSync(path.join(root, 'assets'))) {
  const heldCasesDir = path.join(root, 'assets', 'images', 'cases');
  const legacyDownloadsDir = path.join(root, 'assets', 'downloads');
  fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {
    recursive: true,
    filter: (src) =>
      src !== heldCasesDir && !src.startsWith(heldCasesDir + path.sep) &&
      src !== legacyDownloadsDir && !src.startsWith(legacyDownloadsDir + path.sep)
  });
}
if (fs.existsSync(path.join(root, 'cases'))) fs.cpSync(path.join(root, 'cases'), path.join(output, 'cases'), {recursive: true});
if (fs.existsSync(path.join(root, 'content'))) {
  const excludedContent = new Set(['project-references-review.json', 'cases.json', 'cases-ai-index.json', 'image_evidence.json']);
  fs.cpSync(path.join(root, 'content'), path.join(output, 'content'), {
    recursive: true,
    filter: (src) => !excludedContent.has(path.basename(src))
  });
}
if (fs.existsSync(path.join(root, 'insights'))) fs.cpSync(path.join(root, 'insights'), path.join(output, 'insights'), {recursive: true});

// Run localizer (generates static /zh/ and /th/ pages)
require('node:child_process').execFileSync('python3', [path.join(root, 'scripts/localize.py')], {stdio:'inherit', env: {...process.env, PYTHONUTF8: '1'}});

// Run full insights compiler (compiles content/insights/*.json into full articles in dist/insights/)
require('node:child_process').execFileSync('python3', [path.join(root, 'scripts/build-insights.py')], {stdio:'inherit', env: {...process.env, PYTHONUTF8: '1'}});

// Run V1.0 cases compiler (compiles verified reference cases + AI similarity index into dist/cases/, /zh/cases/, /th/cases/)
require('node:child_process').execFileSync('python3', [path.join(root, 'scripts/build-cases.py')], {stdio:'inherit', env: {...process.env, PYTHONUTF8: '1'}});

require('./inject-analytics.cjs')(output);
require('./check-themes.cjs');
{
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'themes/manifest.json'), 'utf8'));
  const distStylesPath = path.join(output, 'assets/css/styles.css');
  let bundledCss = fs.readFileSync(distStylesPath, 'utf8') + `\n/* anthai-themes-bundled:v${manifest.version} */\n:root{--thb:1;}\n`;
  for (const p of manifest.presets) {
    bundledCss += `\n/* preset:${p.id} */\n` + fs.readFileSync(path.join(root, p.css), 'utf8') + '\n';
  }
  fs.writeFileSync(distStylesPath, bundledCss);
}

// Publish AdSense ownership verification across generated and localized pages.
const adsenseMeta = '<meta name="google-adsense-account" content="ca-pub-4813203643604350">';
function addAdSenseVerification(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) addAdSenseVerification(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      if (!html.includes('google-adsense-account')) {
        if (!/<\/head>/i.test(html)) throw new Error(`Missing head in ${file}`);
        fs.writeFileSync(file, html.replace(/<\/head>/i, `${adsenseMeta}\n</head>`));
      }
    }
  }
}
addAdSenseVerification(output);
fs.writeFileSync(path.join(output, 'ads.txt'), 'google.com, pub-4813203643604350, DIRECT, f08c47fec0942fa0\n');

// Enforce strict noindex + Disallow on Vercel Preview builds (V1.1 isolated staging)
if (process.env.VERCEL_ENV === 'preview') {
  const robotsMeta = '<meta name="robots" content="noindex, nofollow">';
  (function applyPreviewNoIndex(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) applyPreviewNoIndex(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        let html = fs.readFileSync(file, 'utf8')
          .replace(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>\s*/gi, '');
        if (!/<\/head>/i.test(html)) throw new Error(`Missing head in ${file}`);
        html = html.replace(/<\/head>/i, `${robotsMeta}\n</head>`);
        fs.writeFileSync(file, html);
      }
    }
  })(output);
  fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

console.log('Static website packaged in dist, including V5.3 Services, Cases & Insights (Studio isolated for internal staging).');

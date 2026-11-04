// Package only public website files. No dependencies or framework build.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html', 'services.html', 'equipment.html', 'portfolio.html',
  'about.html', 'contact.html', 'insights.html', '404.html', 'robots.txt', 'sitemap.xml', 'llms.txt'
];
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {recursive: true});
require('node:child_process').execFileSync('python3', [path.join(root, 'scripts/localize.py')], {stdio:'inherit', env: {...process.env, PYTHONUTF8: '1'}});
require('node:child_process').execFileSync('python3', [path.join(root, 'scripts/build-insights.py')], {stdio:'inherit', env: {...process.env, PYTHONUTF8: '1'}});
require('./inject-analytics.cjs')(output);
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
console.log('Static website packaged in dist, including Insights.');

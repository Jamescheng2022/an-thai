// Package only public website files. No dependencies or framework build.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html', 'services.html', 'equipment.html', 'portfolio.html',
  'about.html', 'contact.html', '404.html', 'robots.txt', 'sitemap.xml', 'llms.txt'
];
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {recursive: true});
console.log('Static website packaged in dist: 7 HTML pages, sitemap, robots and assets.');

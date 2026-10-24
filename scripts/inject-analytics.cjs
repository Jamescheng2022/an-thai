const fs = require('node:fs');
const path = require('node:path');

// Static HTML cannot read runtime environment variables. Add the Google tag
// to built output only, after all translated pages have been generated.
module.exports = function injectAnalytics(output, env = process.env) {
  const id = (env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
  if (env.VERCEL_ENV !== 'production' || !/^G-[A-Z0-9]+$/.test(id) || /^G-X+$/.test(id)) return;
  const script = `(function(){
    if(location.hostname!=='an-thai.com'&&location.hostname!=='www.an-thai.com')return;
    if(document.getElementById('ga4-library'))return;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());
    window.gtag('config',${JSON.stringify(id)});
    var tag=document.createElement('script');tag.id='ga4-library';tag.async=true;
    tag.src='https://www.googletagmanager.com/gtag/js?id='+${JSON.stringify(id)};
    document.head.appendChild(tag);
  })();`;
  fs.writeFileSync(path.join(output, 'assets/js/ga4.js'), script);
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
        const html = fs.readFileSync(file, 'utf8');
        if (!html.includes('id="ga4-loader"')) {
          fs.writeFileSync(file, html.replace('</head>', '<script id="ga4-loader" src="/assets/js/ga4.js" defer></script>\n</head>'));
        }
      }
    }
  }
  visit(output);
};

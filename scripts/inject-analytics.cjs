const fs = require('node:fs');
const path = require('node:path');

// Static HTML cannot read runtime environment variables. Add the Google tag
// to built output only, after all translated pages have been generated.
module.exports = function injectAnalytics(output, env = process.env) {
  const id = (env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
  if (env.VERCEL_ENV !== 'production' || !/^G-[A-Z0-9]+$/.test(id) || /^G-X+$/.test(id)) return;
  const debug = env.GA4_DEBUG_MODE === 'true';
  const script = `(function(){
    var localDebug=${JSON.stringify(debug)} && (location.hostname==='localhost'||location.hostname==='127.0.0.1');
    if(location.hostname!=='an-thai.com'&&location.hostname!=='www.an-thai.com'&&!localDebug)return;
    var key='ga4_analytics_consent_v1', choice=null;
    try{choice=localStorage.getItem(key);}catch(e){}
    function load(){
      if(document.getElementById('ga4-library'))return;
      window.dataLayer=window.dataLayer||[];
      window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
      window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      window.gtag('set',{allow_google_signals:false,allow_ad_personalization_signals:false${debug ? ",traffic_type:'internal'" : ""}});
      window.gtag('js',new Date());
      window.gtag('config',${JSON.stringify(id)},{debug_mode:${JSON.stringify(debug)}});
      var tag=document.createElement('script');tag.id='ga4-library';tag.async=true;
      tag.src='https://www.googletagmanager.com/gtag/js?id='+${JSON.stringify(id)};
      document.head.appendChild(tag);
    }
    var box=document.createElement('section');box.setAttribute('aria-label','Analytics preferences');
    box.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:1000;padding:16px;background:white;color:#17202a;border:1px solid #89939e;border-radius:8px;max-width:560px';
    function choose(value){
      try{localStorage.setItem(key,value);}catch(e){return;}
      if(choice==='granted'&&value==='denied'){location.reload();return;}
      choice=value;render();if(value==='granted')load();
    }
    function button(label,value){var el=document.createElement('button');el.type='button';el.textContent=label;el.style.cssText='padding:8px 14px;margin-right:12px;border:1px solid currentColor;border-radius:4px';el.onclick=function(){choose(value);};box.appendChild(el);}
    function render(){
      box.replaceChildren();
      if(choice===null){var p=document.createElement('p');p.textContent='Allow Google Analytics cookies to help us understand visits? Optional analytics stays off until you allow it. You can change this choice at any time.';box.appendChild(p);var link=document.createElement('a');link.href='https://policies.google.com/privacy';link.textContent='Google privacy policy';link.style.cssText='display:block;margin-bottom:12px';box.appendChild(link);button('Allow analytics','granted');button('Reject analytics','denied');}
      else button(choice==='granted'?'Analytics: on — turn off':'Analytics: off — allow',choice==='granted'?'denied':'granted');
    }
    window.addEventListener('storage',function(e){if(e.key===key)location.reload();});
    render();document.body.appendChild(box);if(choice==='granted')load();
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

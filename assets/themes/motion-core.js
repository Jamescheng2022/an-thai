(function(w,d){
'use strict';
var T={cinematic:1,blueprint:1,storytelling:1},de=d.documentElement,u='/assets/themes/';
function sa(o,k,v){o.setAttribute(k,v);}
var isP=(function(){try{var l=w.location,h=(l.hostname||'').toLowerCase();return l.protocol==='file:'||h==='localhost'||h==='127.0.0.1'||h==='[::1]'||/\.vercel\.app$/i.test(h);}catch(e){return!1;}})();
function loc(){var l=((de&&de.lang)||'en').toLowerCase();return!l.indexOf('zh')?'ZH':(l==='th'?'TH':'EN');}
function rm(){return!!(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches);}
function get(){
  if(isP){try{var q=new URLSearchParams(w.location.search||'').get('theme');if(q==='default'||T[q])return q;}catch(e){}}
  var c=w.ANTHAI_CONFIG||{};return T[c.theme]?c.theme:'default';
}
function css(id,hr){if(!d.getElementById(id)){var e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=hr;d.head.appendChild(e);}}
function io(cls){
  var c=cls||'is-visible';
  return{observeAll:function(els){
    if(!els||!els.length)return;
    if(rm()||!w.IntersectionObserver){for(var i=0;i<els.length;i++)els[i].classList.add(c);return;}
    var ob=new w.IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add(c);ob.unobserve(x.target);}});},{threshold:0.12});
    for(var k=0;k<els.length;k++)ob.observe(els[k]);
  }};
}
function bar(cur){
  if(d.getElementById('anthaiThemeBar'))return;
  var el=d.createElement('div');el.id='anthaiThemeBar';sa(el,'data-preview-theme-bar','1');sa(el,'role','region');sa(el,'aria-label','Theme');
  ['default','cinematic','blueprint','storytelling'].forEach(function(id,i){
    var b=d.createElement('button');b.type='button';b.className='ptb-btn';sa(b,'data-theme-opt',id);sa(b,'aria-pressed',cur===id);
    b.textContent=i?id:'V1.0';
    b.onclick=function(){var x=new URL(w.location.href);if(!i)x.searchParams.delete('theme');else x.searchParams.set('theme',id);w.location.assign(x.href);};
    el.appendChild(b);
  });
  d.body.appendChild(el);
  if(cur!=='default')d.querySelectorAll('a[href*=".html"]').forEach(function(a){
    var hr=a.getAttribute('href')||'';if(!hr||/^https?:|^mailto:|^tel:/i.test(hr)||hr.indexOf('theme=')>0)return;
    var p=hr.split('#');sa(a,'href',p[0]+(p[0].indexOf('?')>0?'&':'?')+'theme='+cur+(p[1]?'#'+p[1]:''));
  });
}
var cur=get();
if(cur!=='default'){
  sa(de,'data-theme',cur);
  var s=d.createElement('script');s.defer=1;s.src=u+'presets/'+cur+'/preset.js';d.head.appendChild(s);
}
w.ANTHAI_THEME_KIT={version:'1.0.0',getActiveTheme:function(){return cur;},getLocale:loc,isPreviewHost:function(){return isP;},prefersReducedMotion:rm,createRevealObserver:io};
function m(){if(isP){css('atTk',u+'tokens.css');bar(cur);}}
d.readyState[0]==='c'?m():w.addEventListener('load',m);
})(window,document);

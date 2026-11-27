(function(w,d){
'use strict';
var K=['default','cinematic','blueprint','storytelling'],de=d.documentElement,u='/assets/themes/',L=w.location,cf=w.ANTHAI_CONFIG||{},td;
function has(k){return K.indexOf(k)>0;}
td=has(cf.theme);
function sa(o,k,v){o.setAttribute(k,v);}
var h=(L&&L.hostname||'').toLowerCase().replace(/\.+$/,''),
  isP=!!L&&(h==='localhost'||h==='127.0.0.1'||h==='[::1]'||/\.vercel\.app$/.test(h));
function loc(){var l=((de&&de.lang)||'en').toLowerCase();return!l.indexOf('zh')?'ZH':(l==='th'?'TH':'EN');}
function rm(){return!!(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches);}
function get(){
  if(td)return cf.theme;
  if(cf.theme==='default')return'default';
  return'blueprint';
}
function io(cls){
  var c=cls||'is-visible';
  return{observeAll:function(els){
    if(!els||!els.length)return;
    if(rm()||!w.IntersectionObserver){for(var i=0;i<els.length;i++)els[i].classList.add(c);return;}
    var ob=new w.IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add(c);ob.unobserve(x.target);}});},{threshold:0.12});
    for(var k=0;k<els.length;k++)ob.observe(els[k]);
  }};
}
var cur=get();
if(cur!=='default'){
  sa(de,'data-theme',cur);
  var s=d.createElement('script');s.defer=1;s.src=u+'presets/'+cur+'/preset.js';d.head.appendChild(s);
}
w.ANTHAI_THEME_KIT={version:'1.0.0',getActiveTheme:function(){return cur;},getLocale:loc,isPreviewHost:function(){return isP;},prefersReducedMotion:rm,createRevealObserver:io};
})(window,document);

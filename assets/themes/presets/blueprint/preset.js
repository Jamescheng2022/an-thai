(function(w,d){
'use strict';
var k=w.ANTHAI_THEME_KIT;if(!k||k.getActiveTheme()!=='blueprint')return;
var p=d.querySelector('.split-box .split-pane,.diagram-box,footer');
if(!p||d.getElementById('bpPanel'))return;
var B={ZH:'示意图',TH:'แผนภาพจำลอง',EN:'SCHEMATIC'}[k.getLocale()];
function T(x,y,s,c){return'<text x="'+x+'" y="'+y+'"'+(c?' class="'+c+'"':'')+'>'+s+'</text>';}
function draw(m){
  var b=m==='f'
    ?'<path class="bp-draw bp-c1" d="M36 64H324"/>'+['01','02','03','04'].map(function(s,i){var x=22+i*84;return'<rect class="bp-box" x="'+x+'" y="44" width="64" height="40"/>'+T(x+32,68,s,'bp-w');}).join('')
    :'<path class="bp-ax" d="M36 16V104H332"/><path class="bp-draw bp-c1" d="M36 22C135 26,225 46,304 98"/><path class="bp-draw bp-c2" d="M36 22Q160 28 240 54"/>'+T(44,22,'Q')+T(318,118,'s');
  return'<svg class="bp-svg" viewBox="0 0 360 128" role="img" aria-label="'+B+'"><rect x="252" y="6" width="102" height="16" fill="#075985"/>'+T(303,17,B,'bp-w')+b+'</svg>';
}
var box=d.createElement('div');box.id='bpPanel';box.className='bp-panel';
box.innerHTML='<div class="bp-head"><div class="bp-tabs"><button type="button" class="bp-tab" data-bp="q" aria-pressed="true">Q-s</button><button type="button" class="bp-tab" data-bp="f" aria-pressed="false">01-04</button></div></div><div data-bs="">'+draw('q')+'</div><div class="bp-note"></div>';
p.classList.add('has-bp');p.appendChild(box);
var st=box.querySelector('[data-bs]'),bs=box.querySelectorAll('[data-bp]');
bs.forEach(function(b){b.onclick=function(){st.innerHTML=draw(b.dataset.bp);bs.forEach(function(x){x.setAttribute('aria-pressed',x===b);});};});
k.createRevealObserver('is-drawn').observeAll([box]);
})(window,document);

(function(w,d){
'use strict';
var k=w.ANTHAI_THEME_KIT;if(!k||k.getActiveTheme()!=='storytelling')return;
var c=d.querySelectorAll('.unit-card:nth-child(n+2),.split-box,.insight-card');
for(var i=0;i<c.length;i++)c[i].classList.add('th-story');
k.createRevealObserver('is-visible').observeAll(c);
})(window,document);

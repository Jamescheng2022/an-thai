(function (win, doc) {
  'use strict';
  var kit = win.ANTHAI_THEME_KIT;
  if (!kit || kit.getActiveTheme() !== 'cinematic') return;
  var targets = doc.querySelectorAll('.unit-card, .split-box, .insight-card');
  for (var i = 0; i < targets.length; i++) targets[i].classList.add('th-reveal');
  kit.createRevealObserver('is-visible').observeAll(targets);
  if (kit.prefersReducedMotion()) return;
  var heroImg = doc.querySelector('.hero-img');
  var pending = false;
  if (heroImg) {
    win.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      win.requestAnimationFrame(function () {
        var y = Math.min(24, Math.max(0, (win.scrollY || 0) * 0.08));
        heroImg.style.setProperty('--hero-shift', y.toFixed(1) + 'px');
        pending = false;
      });
    }, { passive: true });
  }
  if (win.matchMedia && win.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cards = doc.querySelectorAll('.unit-card');
    for (var j = 0; j < cards.length; j++) {
      (function (c) {
        c.addEventListener('pointermove', function (e) {
          var r = c.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var dx = ((e.clientX - r.left) / r.width - 0.5) * 3;
          var dy = ((e.clientY - r.top) / r.height - 0.5) * -3;
          c.style.setProperty('--ry', dx.toFixed(2) + 'deg');
          c.style.setProperty('--rx', dy.toFixed(2) + 'deg');
        }, { passive: true });
        c.addEventListener('pointerleave', function () {
          c.style.setProperty('--ry', '0deg');
          c.style.setProperty('--rx', '0deg');
        }, { passive: true });
      })(cards[j]);
    }
  }
})(window, document);

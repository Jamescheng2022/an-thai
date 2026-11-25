/**
 * AN-THAI Engineering V1.0 — Cases & Reference Directory Interactive Filter
 * Progressive enhancement over pre-rendered static crawlable cards.
 * Never invents items; filters by attribution, engineering type/service, region, and keyword search.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-cases-root]');
  if (!root) return;

  var cards = Array.prototype.slice.call(root.querySelectorAll('[data-case-card]'));
  var countEl = root.querySelector('#casesMatchCount');
  var emptyEl = root.querySelector('#casesNoMatch');
  var searchEl = root.querySelector('#casesSearchInput');

  var state = {
    attr: 'all',
    service: 'all',
    region: 'all',
    q: ''
  };

  function updateButtons(group, value) {
    root.querySelectorAll('[data-filter-' + group + ']').forEach(function (btn) {
      var active = btn.getAttribute('data-filter-' + group) === value;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyFilters() {
    var visibleCount = 0;
    var q = state.q.toLowerCase();

    cards.forEach(function (card) {
      var cAttr = card.getAttribute('data-attr') || '';
      var cService = card.getAttribute('data-service') || '';
      var cRegion = card.getAttribute('data-region') || '';
      var cSearch = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();

      var okAttr = (state.attr === 'all' || cAttr === state.attr);
      var okSvc = (state.service === 'all' || cService === state.service);
      var okReg = (state.region === 'all' || cRegion === state.region);
      var okQ = (!q || cSearch.indexOf(q) !== -1);

      var show = okAttr && okSvc && okReg && okQ;
      card.hidden = !show;
      if (show) visibleCount += 1;
    });

    if (countEl) {
      var tpl = countEl.getAttribute('data-count-tpl') || '{n} records shown';
      countEl.textContent = tpl.replace('{n}', String(visibleCount));
    }
    if (emptyEl) {
      emptyEl.hidden = visibleCount > 0;
    }
  }

  ['attr', 'service', 'region'].forEach(function (group) {
    root.querySelectorAll('[data-filter-' + group + ']').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[group] = btn.getAttribute('data-filter-' + group) || 'all';
        updateButtons(group, state[group]);
        applyFilters();
        if (btn.hasAttribute('data-scroll-cards')) {
          var target = root.querySelector('#casesGridAnchor');
          if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      state.q = (searchEl.value || '').trim();
      applyFilters();
    });
  }

  applyFilters();
})();

/* Filtros del catálogo: categoría, framework, precio, rendimiento y búsqueda. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('#cards .card'));
  if (!cards.length) return;

  var countEl = document.getElementById('count');
  var emptyEl = document.getElementById('empty');
  var searchEl = document.getElementById('q');
  var sortEl = document.getElementById('sort');
  var clearEl = document.getElementById('clear');
  var container = document.getElementById('cards');

  var state = { category: 'all', frameworks: [], prices: [], fast: false, q: '', sort: 'cpu' };

  var inPriceRange = function (price, range) {
    if (range === 0) return price < 20;
    if (range === 1) return price >= 20 && price <= 35;
    return price > 35;
  };

  function matches(card) {
    var price = parseFloat(card.dataset.price);
    var frameworks = card.dataset.frameworks.split('|');

    if (state.category !== 'all' && card.dataset.category !== state.category) return false;
    if (state.frameworks.length && !state.frameworks.some(function (f) { return frameworks.indexOf(f) !== -1; })) return false;
    if (state.prices.length && !state.prices.some(function (r) { return inPriceRange(price, r); })) return false;
    if (state.fast && parseFloat(card.dataset.cpu) > 0.01) return false;
    if (state.q && card.dataset.search.indexOf(state.q) === -1) return false;
    return true;
  }

  function sorted(list) {
    var copy = list.slice();
    copy.sort(function (a, b) {
      if (state.sort === 'price-asc') return a.dataset.price - b.dataset.price;
      if (state.sort === 'price-desc') return b.dataset.price - a.dataset.price;
      if (state.sort === 'name') return a.dataset.name.localeCompare(b.dataset.name);
      return a.dataset.cpu - b.dataset.cpu || a.dataset.price - b.dataset.price;
    });
    return copy;
  }

  function apply() {
    var visible = cards.filter(matches);
    cards.forEach(function (card) { card.hidden = visible.indexOf(card) === -1; });
    sorted(visible).forEach(function (card) { container.appendChild(card); });

    var template = visible.length === 1 ? countEl.dataset.one : countEl.dataset.many;
    countEl.textContent = template.replace('{count}', visible.length);
    emptyEl.style.display = visible.length ? 'none' : 'block';
  }

  document.querySelectorAll('[data-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var kind = button.dataset.filter;
      var value = button.dataset.value;

      if (kind === 'category') {
        state.category = value;
        document.querySelectorAll('[data-filter="category"]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === button));
        });
      } else if (kind === 'fast') {
        state.fast = !state.fast;
        button.setAttribute('aria-pressed', String(state.fast));
      } else {
        var list = kind === 'framework' ? state.frameworks : state.prices;
        var parsed = kind === 'price' ? parseInt(value, 10) : value;
        var at = list.indexOf(parsed);
        if (at === -1) list.push(parsed); else list.splice(at, 1);
        button.setAttribute('aria-pressed', String(at === -1));
      }
      apply();
    });
  });

  searchEl.addEventListener('input', function () {
    state.q = searchEl.value.trim().toLowerCase();
    apply();
  });

  sortEl.addEventListener('change', function () {
    state.sort = sortEl.value;
    apply();
  });

  clearEl.addEventListener('click', function () {
    state = { category: 'all', frameworks: [], prices: [], fast: false, q: '', sort: sortEl.value };
    searchEl.value = '';
    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.filter === 'category' && b.dataset.value === 'all'));
    });
    apply();
  });

  apply();
})();

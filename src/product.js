/* Pestañas de la ficha de producto. */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  if (!tabs.length) return;

  function select(key) {
    tabs.forEach(function (tab) {
      var on = tab.dataset.tab === key;
      tab.setAttribute('aria-selected', String(on));
      var panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) { if (on) panel.setAttribute('data-active', ''); else panel.removeAttribute('data-active'); }
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { select(tab.dataset.tab); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      select(next.dataset.tab);
    });
  });
})();

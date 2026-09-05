/* Documentación: búsqueda, índice, menú móvil y copiar código. */
(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const sidebar = qs('[data-docs-sidebar]');
  const backdrop = qs('[data-docs-close-nav]');
  const searchRoot = qs('[data-docs-search]');
  const searchInput = qs('[data-docs-search-input]');
  const resultsEl = qs('[data-docs-search-results]');
  const emptyEl = qs('[data-docs-search-empty]');
  const copiedLabel = document.body.dataset.docsCopied || 'OK';
  const indexUrl = document.body.dataset.docsIndex;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  qsa('[data-docs-hotkey]').forEach((el) => { el.textContent = isMac ? '⌘K' : 'Ctrl K'; });

  const setNav = (open) => {
    document.body.classList.toggle('docs-nav-open', open);
    if (backdrop) backdrop.hidden = !open;
    if (sidebar) sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  qsa('[data-docs-open-nav]').forEach((btn) => btn.addEventListener('click', () => setNav(true)));
  qsa('[data-docs-close-nav]').forEach((el) => el.addEventListener('click', () => setNav(false)));

  qsa('[data-docs-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-docs-group]');
      if (!group) return;
      const open = !group.hasAttribute('data-open');
      if (open) group.setAttribute('data-open', '');
      else group.removeAttribute('data-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  const current = qs('.docs-side__link[aria-current="page"]');
  if (current && current.scrollIntoView) {
    current.scrollIntoView({ block: 'center', inline: 'nearest' });
  }

  /* ----- copiar código ----- */
  qsa('[data-docs-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const block = btn.closest('.code');
      const code = block ? qs('code', block) : null;
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
      }
      const prev = btn.getAttribute('aria-label');
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', copiedLabel);
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (prev) btn.setAttribute('aria-label', prev);
      }, 1600);
    });
  });

  /* ----- índice de la página ----- */
  const tocLinks = qsa('.docs-toc a');
  const headingIds = tocLinks.map((a) => decodeURIComponent(a.hash.slice(1))).filter(Boolean);
  const headings = headingIds.map((id) => document.getElementById(id)).filter(Boolean);

  if (headings.length && 'IntersectionObserver' in window) {
    const visible = new Map();
    const setActive = (id) => {
      tocLinks.forEach((a) => {
        a.classList.toggle('is-active', a.hash === `#${id}`);
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
        else visible.delete(entry.target.id);
      });
      const ordered = headings.map((h) => h.id).filter((id) => visible.has(id));
      if (ordered.length) setActive(ordered[0]);
    }, { rootMargin: '-80px 0px -55% 0px', threshold: [0, 1] });
    headings.forEach((h) => io.observe(h));
  }

  /* ----- búsqueda ----- */
  let index = [];
  let active = -1;
  let loaded = false;

  const loadIndex = async () => {
    if (loaded || !indexUrl) return;
    loaded = true;
    try {
      const res = await fetch(indexUrl);
      index = await res.json();
    } catch {
      index = [];
    }
  };

  const score = (item, words) => {
    const title = item.title.toLowerCase();
    const crumb = (item.crumb || '').toLowerCase();
    const text = (item.text || '').toLowerCase();
    let s = 0;
    for (const w of words) {
      if (title === w) s += 80;
      else if (title.startsWith(w)) s += 40;
      else if (title.includes(w)) s += 24;
      else if (crumb.includes(w)) s += 10;
      else if (text.includes(w)) s += 4;
      else return 0;
    }
    return s;
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderResults = (hits) => {
    active = hits.length ? 0 : -1;
    if (!hits.length) {
      resultsEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    resultsEl.innerHTML = hits.map((item, i) => `
      <li>
        <a href="${escapeHtml(item.href)}" data-i="${i}">
          <span class="docs-modal__crumb">${escapeHtml(item.crumb)}</span>
          <span class="docs-modal__hit">${escapeHtml(item.title)}</span>
        </a>
      </li>`).join('');
    markActive();
  };

  const markActive = () => {
    qsa('a', resultsEl).forEach((a) => {
      a.classList.toggle('is-active', Number(a.dataset.i) === active);
    });
    const cur = qs('a.is-active', resultsEl);
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };

  const runSearch = () => {
    const words = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      resultsEl.innerHTML = '';
      emptyEl.hidden = true;
      active = -1;
      return;
    }
    const hits = index
      .map((item) => ({ item, s: score(item, words) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.item);
    renderResults(hits);
  };

  const openSearch = async () => {
    setNav(false);
    await loadIndex();
    searchRoot.hidden = false;
    document.body.classList.add('docs-search-open');
    searchInput.value = '';
    resultsEl.innerHTML = '';
    emptyEl.hidden = true;
    active = -1;
    searchInput.focus();
  };

  const closeSearch = () => {
    searchRoot.hidden = true;
    document.body.classList.remove('docs-search-open');
  };

  qsa('[data-docs-open-search]').forEach((btn) => btn.addEventListener('click', openSearch));
  qsa('[data-docs-close-search]').forEach((el) => el.addEventListener('click', closeSearch));
  if (searchInput) searchInput.addEventListener('input', runSearch);

  if (resultsEl) {
    resultsEl.addEventListener('mousemove', (e) => {
      const a = e.target.closest('a[data-i]');
      if (!a) return;
      active = Number(a.dataset.i);
      markActive();
    });
  }

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const metaK = (e.ctrlKey || e.metaKey) && (key === 'k' || key === 'K');
    if (metaK) {
      e.preventDefault();
      if (searchRoot.hidden === false) closeSearch();
      else openSearch();
      return;
    }
    if (key === 'Escape') {
      if (!searchRoot.hidden) { closeSearch(); return; }
      if (document.body.classList.contains('docs-nav-open')) setNav(false);
      return;
    }
    if (searchRoot.hidden) return;
    const items = qsa('a', resultsEl);
    if (key === 'ArrowDown' && items.length) {
      e.preventDefault();
      active = (active + 1) % items.length;
      markActive();
    } else if (key === 'ArrowUp' && items.length) {
      e.preventDefault();
      active = (active - 1 + items.length) % items.length;
      markActive();
    } else if (key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      items[active].click();
    }
  });

  const mq = window.matchMedia('(min-width: 997px)');
  const onMq = () => { if (mq.matches) setNav(false); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  else if (mq.addListener) mq.addListener(onMq);
})();

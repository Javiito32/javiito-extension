/* Documentación al estilo Docusaurus: una página por tema, agrupada por script. */

import {
  changelogOf, date, esc, icon, layout, price, tpl,
} from './templates.mjs';

const slugify = (text) => {
  const base = String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'section';
};

const strip = (html) => String(html || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const headingTracker = () => {
  const used = new Map();
  const headings = [];
  const idOf = (text) => {
    let id = slugify(text);
    const n = (used.get(id) || 0) + 1;
    used.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    return id;
  };
  const add = (text, level) => {
    const id = idOf(text);
    headings.push({ id, text: String(text), level });
    return id;
  };
  return { headings, add };
};

const heading = (tag, id, text, cls = '') =>
  `<${tag}${cls ? ` class="${cls}"` : ''} id="${esc(id)}"><a class="docs-anchor" href="#${esc(id)}">${esc(text)}</a></${tag}>`;

const codeBlock = (head, code, copyLabel) => `
  <div class="code">
    <div class="code__bar">
      ${head ? `<p class="code__head">${esc(head)}</p>` : '<span class="code__head"></span>'}
      <button type="button" class="code__copy" data-docs-copy aria-label="${esc(copyLabel)}">${icon.copy(14)}</button>
    </div>
    <pre><code>${esc(code)}</code></pre>
  </div>`;

const manualBlock = (b, tracker, copyLabel) => {
  switch (b.type) {
    case 'p':
      return `<p class="body">${b.html}</p>`;
    case 'note':
      return `<aside class="docs-note">${b.html}</aside>`;
    case 'ul':
      return `<ul class="dot-list">${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol class="steps">${b.items.map((i) => `<li><span>${i}</span></li>`).join('')}</ol>`;
    case 'h': {
      const id = tracker.add(b.text, 2);
      return heading('h2', id, b.text, b.mono ? 'docs-h docs-h--fn' : 'docs-h');
    }
    case 'code':
      return codeBlock(b.head, b.code, copyLabel);
    case 'table':
      return `
        <div class="doc-table">
          <table>
            <thead><tr>${b.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>${b.rows.map((r) => `
              <tr>${r.map((cell, i) => `<td>${i === 0 ? `<code>${esc(cell)}</code>` : cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    default:
      return '';
  }
};

const manualOf = (s, lang) => ((s.manual || {})[lang] || {}).sections || [];

const otherLang = (ctx) => (ctx.langs.find((l) => l.code !== ctx.lang) || ctx.langs[0]).code;

const changelogTable = (ctx, s) => {
  const { t, lang } = ctx;
  const d = t.docs;
  return `
    <div class="data-table">
      <div class="data-table__head">
        <span>${esc(d.changelog.columns.changes)}</span><span>${esc(d.changelog.columns.version)}</span><span>${esc(d.changelog.columns.date)}</span>
      </div>
      ${changelogOf(s).map((e) => `
      <div class="data-table__row"><span>${esc(e[lang] || s.name)}</span><b>${esc(e.version)}</b><b>${esc(date(e.date, lang))}</b></div>`).join('')}
    </div>`;
};

const fillPage = (ctx, p) => {
  const { site, t, url, vars, scripts, lang } = ctx;
  const d = t.docs;
  const copyLabel = d.copy;
  const tracker = headingTracker();
  let html = '';
  let lead = '';
  let description = tpl(t.meta.docs.description, vars);

  const s = p.script;
  const loc = s ? s[lang] : null;
  const sVars = s
    ? { ...vars, name: s.name, exports: s.apiNote.exports, events: s.apiNote.events }
    : vars;

  if (p.kind === 'intro') {
    lead = d.subtitle;
    const scriptsId = tracker.add(d.scripts.title, 2);
    const howId = tracker.add(d.introHowTitle, 2);
    html = `
      ${d.introLead.map((par) => `<p class="body">${par}</p>`).join('')}
      ${heading('h2', scriptsId, d.scripts.title)}
      <p class="body">${esc(d.scripts.text)}</p>
      <div class="docs-index">
        ${scripts.map((script) => `
        <a class="docs-index__row" href="${url.doc(script.slug)}">
          <span class="docs-index__name">${esc(script.name)}</span>
          <span class="docs-index__tag">${esc(script[lang].tagline)}</span>
          <span class="chip chip--accent">v${esc(script.version)}</span>
          <span class="docs-index__go">${esc(d.openManual)} ${icon.arrow(14)}</span>
        </a>`).join('')}
      </div>
      ${heading('h2', howId, d.introHowTitle)}
      <ul class="dot-list">${d.introHow.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  }

  if (p.kind === 'performance') {
    html = `
      <p class="body">${d.performance.text}</p>
      <div class="data-table">
        <div class="data-table__head">
          <span>${esc(t.home.resmon.columns.resource)}</span><span>${esc(t.home.resmon.columns.cpu)}</span><span>${esc(t.home.resmon.columns.memory)}</span>
        </div>
        ${scripts.map((script) => `
        <div class="data-table__row"><span>${esc(script.name)}</span><b class="good">${esc(script.idle)}</b><b>${esc(script.performance[0] ? script.performance[0].memory : '—')}</b></div>`).join('')}
      </div>
      <p class="small">${esc(tpl(d.performance.note, vars))}</p>`;
  }

  if (p.kind === 'overview') {
    lead = loc.tagline;
    description = loc.tagline;
    const featId = tracker.add(d.script.features, 2);
    html = `
      <div class="docs-meta">
        <span class="chip chip--accent">v${esc(s.version)}</span>
        ${s.frameworks.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}
        ${s.status === 'beta' ? `<span class="chip">${esc(t.statuses.beta)}</span>` : ''}
      </div>
      ${loc.description.map((par) => `<p class="body">${par}</p>`).join('')}
      ${heading('h2', featId, d.script.features)}
      <ul class="check-list">${loc.features.map((f) => `<li>${icon.check()}<span>${esc(f)}</span></li>`).join('')}</ul>
      <div class="docs-actions">
        <a class="btn btn--ghost btn--md" href="${url.product(s.slug)}">${esc(d.script.product)} ${icon.arrow(15)}</a>
        ${s.status === 'beta'
          ? `<p class="small">${esc(d.script.beta)}</p>`
          : `<a class="btn btn--primary btn--md" href="${esc(s.tebex)}" rel="noopener">${esc(d.script.buy)} ${icon.external()}</a>`}
      </div>`;
  }

  if (p.kind === 'manual') {
    html = p.section.blocks.map((b) => manualBlock(b, tracker, copyLabel)).join('');
    const first = p.section.blocks.find((b) => b.type === 'p' || b.type === 'note');
    if (first) description = strip(first.html).slice(0, 220);
  }

  if (p.kind === 'install') {
    html = `<ol class="steps">${(loc.installSteps || t.product.install.steps).map((st) => `<li><span>${tpl(st, sVars)}</span></li>`).join('')}</ol>`;
  }

  if (p.kind === 'api') {
    html = `
      ${codeBlock(t.product.api.file, s.code, copyLabel)}
      <p class="small">${esc(tpl(t.product.api.note, sVars))}</p>`;
  }

  if (p.kind === 'requirements') {
    html = `
      <ul class="check-list">
        <li>${icon.check()}<span>${esc(t.product.aside.spec.frameworks)}: ${esc(s.frameworks.join(' · '))}</span></li>
        <li>${icon.check()}<span>${esc(t.product.aside.spec.dependencies)}: ${esc(s.dependencies.length ? s.dependencies.join(' · ') : t.product.aside.spec.none)}</span></li>
        <li>${icon.check()}<span>${esc(t.product.aside.spec.locales)}: ${esc(s.locales.join(' · '))}</span></li>
      </ul>
      <p class="small">${esc(t.product.requirements.buildNote)}</p>`;
  }

  if (p.kind === 'script-changelog') {
    html = `
      <p class="body">${esc(d.changelog.text)}</p>
      ${changelogTable(ctx, s)}`;
  }

  if (p.kind === 'changelog') {
    html = `
      <p class="body">${esc(d.changelog.text)}</p>
      ${scripts.map((script) => {
        const id = tracker.add(script.name, 2);
        return `
        ${heading('h2', id, script.name, 'docs-h')}
        ${changelogTable(ctx, script)}
        <p class="small"><a href="${url.doc(script.slug + '/changelog')}">${esc(d.openManual)} ${esc(script.name)}</a></p>`;
      }).join('')}`;
  }

  if (p.kind === 'legal') {
    html = d.legal.items.map((item) => {
      tracker.headings.push({ id: item.id, text: item.title, level: 2 });
      return `
        <section class="docs-legal">
          ${heading('h2', item.id, item.title)}
          <p class="body">${esc(item.text)}</p>
        </section>`;
    }).join('');
  }

  if (p.kind === 'support') {
    html = `
      <p class="body">${esc(d.support.text)}</p>
      <div class="docs-actions">
        <a class="btn btn--primary btn--md" href="${esc(site.links.discord)}" rel="noopener">${icon.chat(15)} ${esc(d.support.discord)}</a>
        <a class="btn btn--ghost btn--md" href="${esc(site.links.tebexStore)}" rel="noopener">${esc(d.support.store)} ${icon.external()}</a>
      </div>`;
  }

  p.html = html;
  p.lead = lead;
  p.headings = tracker.headings;
  p.description = description;
  p.searchText = strip(`${p.title} ${lead} ${html}`).slice(0, 1400);
  p.h1 = p.kind === 'overview' ? s.name : (p.kind === 'intro' ? d.title : p.title);
  return p;
};

const makePages = (ctx) => {
  const { scripts, t, url, lang } = ctx;
  const d = t.docs;
  const pages = [];
  const push = (p) => {
    pages.push(p);
    return p;
  };

  push({
    id: 'intro',
    file: 'index.html',
    href: url.docs,
    title: d.indexNav || d.title,
    group: 'start',
    groupLabel: d.sidebarStart,
    kind: 'intro',
  });

  push({
    id: 'performance',
    file: 'performance/index.html',
    href: url.doc('performance'),
    title: d.performance.title,
    group: 'start',
    groupLabel: d.sidebarStart,
    kind: 'performance',
  });

  for (const s of scripts) {
    const group = s.slug;
    const groupLabel = s.name;

    push({
      id: s.slug,
      file: `${s.slug}/index.html`,
      href: url.doc(s.slug),
      title: d.script.overview,
      group,
      groupLabel,
      kind: 'overview',
      script: s,
    });

    const sections = manualOf(s, lang);
    if (sections.length) {
      for (const sec of sections) {
        push({
          id: `${s.slug}/${sec.id}`,
          file: `${s.slug}/${sec.id}/index.html`,
          href: url.doc(`${s.slug}/${sec.id}`),
          title: sec.title,
          group,
          groupLabel,
          kind: 'manual',
          script: s,
          section: sec,
        });
      }
    } else {
      for (const key of ['install', 'api', 'requirements']) {
        push({
          id: `${s.slug}/${key}`,
          file: `${s.slug}/${key}/index.html`,
          href: url.doc(`${s.slug}/${key}`),
          title: d.script[key],
          group,
          groupLabel,
          kind: key,
          script: s,
        });
      }
    }

    push({
      id: `${s.slug}/changelog`,
      file: `${s.slug}/changelog/index.html`,
      href: url.doc(`${s.slug}/changelog`),
      title: d.changelog.title,
      group,
      groupLabel,
      kind: 'script-changelog',
      script: s,
    });
  }

  push({
    id: 'changelog',
    file: 'changelog/index.html',
    href: url.doc('changelog'),
    title: d.changelog.title,
    group: 'changelog',
    groupLabel: d.changelog.title,
    kind: 'changelog',
  });

  push({
    id: 'legal',
    file: 'legal/index.html',
    href: url.doc('legal'),
    title: d.legal.title,
    group: 'legal',
    groupLabel: d.legal.title,
    kind: 'legal',
  });

  push({
    id: 'support',
    file: 'support/index.html',
    href: url.doc('support'),
    title: d.support.title,
    group: 'support',
    groupLabel: d.support.title,
    kind: 'support',
  });

  return pages.map((p) => fillPage(ctx, p));
};

const makeGroups = (ctx, pages) => {
  const d = ctx.t.docs;
  const groups = [];
  const ensure = (id, label, extra = {}) => {
    let g = groups.find((x) => x.id === id);
    if (!g) {
      g = { id, label, items: [], ...extra };
      groups.push(g);
    }
    return g;
  };

  for (const p of pages) {
    if (p.kind === 'legal') {
      ensure('legal', d.legal.title, { script: false }).items = d.legal.items.map((item) => ({
        id: `legal-${item.id}`,
        href: ctx.url.doc('legal', item.id),
        title: item.title,
        pageId: 'legal',
      }));
      continue;
    }
    const g = ensure(p.group, p.groupLabel, {
      version: p.script ? p.script.version : null,
      script: Boolean(p.script),
    });
    g.items.push({
      id: p.id,
      href: p.href,
      title: p.title,
    });
  }

  for (const g of groups) g.collapsible = g.items.length > 1;
  return groups;
};

const crumbsOf = (ctx, p) => {
  const d = ctx.t.docs;
  const items = [{ label: d.title, href: p.id === 'intro' ? '' : ctx.url.docs }];
  if (p.script) {
    if (p.kind === 'overview') items.push({ label: p.script.name, href: '' });
    else {
      items.push({ label: p.script.name, href: ctx.url.doc(p.script.slug) });
      items.push({ label: p.title, href: '' });
    }
  } else if (p.id !== 'intro') {
    items.push({ label: p.title, href: '' });
  }
  return items;
};

const redirectMap = (ctx, pages) => {
  const map = {
    performance: ctx.url.doc('performance'),
    install: ctx.url.docs,
    changelog: ctx.url.doc('changelog'),
    license: ctx.url.doc('legal', 'license'),
    terms: ctx.url.doc('legal', 'terms'),
    privacy: ctx.url.doc('legal', 'privacy'),
    refunds: ctx.url.doc('legal', 'refunds'),
    support: ctx.url.doc('support'),
  };
  for (const p of pages) {
    if (p.script && p.kind === 'overview') map[p.script.slug] = p.href;
    if (p.script && p.kind === 'manual') map[`${p.script.slug}-${p.section.id}`] = p.href;
    if (p.script && p.kind === 'script-changelog') map[`${p.script.slug}-changelog`] = p.href;
  }
  return map;
};

const searchIndex = (pages) => pages.map((p) => ({
  title: p.kind === 'overview' ? p.script.name : p.title,
  crumb: p.groupLabel,
  href: p.href,
  text: p.searchText,
}));

const docTitle = (ctx, p) => {
  const brand = ctx.vars.brand;
  if (p.kind === 'intro') return `${ctx.t.docs.title} · ${brand}`;
  if (p.kind === 'overview') return `${p.script.name} · ${brand}`;
  if (p.script) return `${p.title} · ${p.script.name} · ${brand}`;
  return `${p.title} · ${brand}`;
};

const sidebar = (ctx, groups, page) => {
  const d = ctx.t.docs;
  const scriptCount = groups.filter((g) => g.script).length;

  const link = (item) => {
    const current = item.id === page.id ? ' aria-current="page"' : '';
    return `<a class="docs-side__link" href="${esc(item.href)}"${current}>${esc(item.title)}</a>`;
  };

  return `
  <aside class="docs-side" data-docs-sidebar id="docs-sidebar">
    <button type="button" class="docs-search-trigger" data-docs-open-search>
      ${icon.search(15)}
      <span>${esc(d.searchPlaceholder)}</span>
      <kbd data-docs-hotkey>Ctrl K</kbd>
    </button>
    <nav class="docs-side__nav" aria-label="${esc(d.title)}">
      ${groups.map((g) => {
        const inGroup = page.group === g.id;
        const open = inGroup || (g.script && scriptCount === 1) || g.id === 'start';
        if (!g.collapsible) {
          return `<div class="docs-side__solo">${link(g.items[0])}</div>`;
        }
        return `
        <div class="docs-side__group${inGroup ? ' is-current' : ''}" data-docs-group="${esc(g.id)}"${open ? ' data-open' : ''}>
          <button type="button" class="docs-side__cat${g.script ? ' docs-side__cat--script' : ''}" data-docs-toggle aria-expanded="${open}">
            <span class="docs-side__cat-label">${esc(g.label)}</span>
            ${g.version ? `<span class="docs-side__ver">v${esc(g.version)}</span>` : ''}
            ${icon.chevron(12)}
          </button>
          <div class="docs-side__items">
            ${g.items.map(link).join('')}
          </div>
        </div>`;
      }).join('')}
    </nav>
  </aside>`;
};

const tocNav = (d, headings, extraClass = '') => {
  if (!headings.length) return '';
  return `
    <nav class="docs-toc ${extraClass}" aria-label="${esc(d.tocTitle)}">
      <p class="docs-toc__title">${esc(d.tocTitle)}</p>
      <ol class="docs-toc__list">
        ${headings.map((h) => `<li data-level="${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}
      </ol>
    </nav>`;
};

const pager = (d, pages, page) => {
  const i = pages.findIndex((p) => p.id === page.id);
  const prev = i > 0 ? pages[i - 1] : null;
  const next = i < pages.length - 1 ? pages[i + 1] : null;
  if (!prev && !next) return '';
  return `
    <nav class="docs-pager">
      ${prev ? `<a class="docs-pager__link" href="${esc(prev.href)}"><span class="docs-pager__dir">${esc(d.previous)}</span><span class="docs-pager__title">${esc(prev.kind === 'overview' ? prev.script.name : prev.title)}</span></a>` : '<span></span>'}
      ${next ? `<a class="docs-pager__link docs-pager__link--next" href="${esc(next.href)}"><span class="docs-pager__dir">${esc(d.next)}</span><span class="docs-pager__title">${esc(next.kind === 'overview' ? next.script.name : next.title)}</span></a>` : '<span></span>'}
    </nav>`;
};

const searchModal = (d) => `
  <div class="docs-modal" hidden data-docs-search>
    <div class="docs-modal__backdrop" data-docs-close-search></div>
    <div class="docs-modal__panel" role="dialog" aria-modal="true" aria-labelledby="docs-search-title">
      <h2 id="docs-search-title" class="sr-only">${esc(d.searchLabel)}</h2>
      <div class="docs-modal__input">
        ${icon.search(16)}
        <input type="search" data-docs-search-input placeholder="${esc(d.searchPlaceholder)}" autocomplete="off">
        <kbd>Esc</kbd>
      </div>
      <ul class="docs-modal__results" data-docs-search-results></ul>
      <p class="docs-modal__empty" data-docs-search-empty hidden>${esc(d.searchNoResults)}</p>
    </div>
  </div>`;

const renderDocsPage = (ctx, tree, page) => {
  const d = ctx.t.docs;
  const crumbs = crumbsOf(ctx, page);
  const hasToc = page.headings.length > 0;
  const alt = page.href.replace(`/${ctx.lang}/`, `/${otherLang(ctx)}/`);

  const body = `
  <div class="docs-shell${hasToc ? '' : ' docs-shell--no-toc'}">
    <div class="docs-toolbar">
      <button type="button" class="btn btn--ghost btn--sm" data-docs-open-nav>
        ${icon.menu(15)} ${esc(d.menuOpen)}
      </button>
      <button type="button" class="btn btn--ghost btn--sm" data-docs-open-search>
        ${icon.search(15)} ${esc(d.searchPlaceholder)}
      </button>
    </div>
    <div class="docs-backdrop" data-docs-close-nav hidden></div>
    ${sidebar(ctx, tree.groups, page)}
    <div class="docs-main">
      <article class="docs-article">
        <nav class="docs-crumbs" aria-label="${esc(d.breadcrumb)}">
          ${crumbs.map((c, i) => (c.href
            ? `<a href="${esc(c.href)}">${esc(c.label)}</a>`
            : `<span${i === crumbs.length - 1 ? ' aria-current="page"' : ''}>${esc(c.label)}</span>`)).join('<span class="docs-crumbs__sep">/</span>')}
        </nav>
        ${tocNav(d, page.headings, 'docs-toc--mobile')}
        <header class="docs-article__head">
          <h1>${esc(page.h1)}</h1>
          ${page.lead ? `<p class="lead">${esc(page.lead)}</p>` : ''}
        </header>
        <div class="docs-prose">
          ${page.html}
        </div>
        ${pager(d, tree.pages, page)}
      </article>
    </div>
    ${hasToc ? tocNav(d, page.headings, 'docs-toc--aside') : ''}
  </div>
  ${searchModal(d)}`;

  const headExtra = page.kind === 'intro'
    ? `<script>(function(){var h=location.hash.slice(1);if(!h)return;var m=${JSON.stringify(tree.redirects)};if(m[h])location.replace(m[h]);})();</script>`
    : '';

  return layout({
    ...ctx,
    url: { ...ctx.url, self: page.href },
    altUrl: alt,
    canonical: ctx.absolute(page.href),
  }, {
    title: docTitle(ctx, page),
    description: page.description,
    current: 'docs',
    body,
    bodyClass: 'is-docs',
    mainClass: '',
    bodyAttrs: ` data-docs-index="/assets/docs-search-${ctx.lang}.json" data-docs-copied="${esc(d.copied)}"`,
    headExtra,
    script: '<script src="/assets/docs.js" defer></script>',
  });
};

export const buildDocs = (ctx) => {
  const pages = makePages(ctx);
  const groups = makeGroups(ctx, pages);
  const redirects = redirectMap(ctx, pages);
  const tree = { pages, groups, redirects };
  return {
    files: pages.map((p) => ({
      file: p.file,
      href: p.href,
      html: renderDocsPage(ctx, tree, p),
    })),
    index: searchIndex(pages),
  };
};

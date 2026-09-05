/* Plantillas HTML. Todo el texto viene de content/*.json — aquí no hay copy. */

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Sustituye {claves} por valores. Se aplica a todas las cadenas del JSON. */
export const tpl = (s = '', vars = {}) =>
  String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/* Una cadena del JSON puede ser "texto" o {one, other}: elige según el número. */
export const plural = (value, count) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (count === 1 ? value.one : value.other)
    : value;

export const price = (value, lang) =>
  lang === 'es'
    ? `${value.toFixed(2).replace('.', ',')} €`
    : `€${value.toFixed(2)}`;

export const date = (iso, lang) => {
  const [y, m, d] = String(iso).split('-');
  return lang === 'es' ? `${d}/${m}/${y}` : `${y}-${m}-${d}`;
};

const svg = (body, size = 16, stroke = 1.5) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icon = {
  arrow: (s = 16) => svg('<path d="M3 8h10M9 4l4 4-4 4"/>', s, 1.7),
  check: (s = 15) => svg('<path d="M3 8.5l3.5 3.5L13 5"/>', s, 1.7),
  chat: (s = 15) => svg('<path d="M13 10.5a1.5 1.5 0 01-1.5 1.5H5l-3 2.5V4a1.5 1.5 0 011.5-1.5h8A1.5 1.5 0 0113 4z"/>', s, 1.4),
  external: (s = 15) => svg('<path d="M6.5 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5V9.5"/><path d="M9.5 2.5H14v4.5M14 2.5L7.5 9"/>', s, 1.6),
  search: (s = 16) => svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4L14 14"/>'),
  image: (s = 28) => svg('<rect x="1.5" y="3" width="13" height="10" rx="1.5"/><circle cx="5.5" cy="6.5" r="1.2"/><path d="M2 11l3.5-3 3 2.5L11 8l3 3"/>', s, 1.2),
  bolt: (s = 20) => svg('<path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z"/>', s, 1.4),
  code: (s = 20) => svg('<path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5"/>', s, 1.4),
  book: (s = 20) => svg('<path d="M2.5 3.5h4a2 2 0 012 2v7a1.5 1.5 0 00-1.5-1.5H2.5zM13.5 3.5h-4a2 2 0 00-2 2v7a1.5 1.5 0 011.5-1.5h4.5z"/>', s, 1.4),
  refresh: (s = 20) => svg('<path d="M13.5 8a5.5 5.5 0 01-9.4 3.9M2.5 8a5.5 5.5 0 019.4-3.9M12 2.4v2.3H9.7M4 13.6v-2.3h2.3"/>', s, 1.4),
};

const featureIcons = [icon.bolt, icon.code, icon.book, icon.refresh];

/* Un script puede traer su historial en scripts.json; si no, se usa su versión actual. */
export const changelogOf = (s) =>
  (Array.isArray(s.changelog) && s.changelog.length
    ? s.changelog
    : [{ version: s.version, date: s.updated }]);

/* ---------- manual largo de un script (content/manuals/<slug>.json) ---------- */

/* Los textos del manual llevan HTML propio (<code>, <strong>, enlaces): se
   escriben tal cual. Solo se escapa lo que es literal: código y tablas. */
const manualBlock = (b) => {
  switch (b.type) {
    case 'p':
      return `<p class="body">${b.html}</p>`;
    case 'note':
      return `<p class="small">${b.html}</p>`;
    case 'ul':
      return `<ul class="dot-list">${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol class="steps">${b.items.map((i) => `<li><span>${i}</span></li>`).join('')}</ol>`;
    case 'h':
      return `<h5 class="manual__sub${b.mono ? ' mono' : ''}">${esc(b.text)}</h5>`;
    case 'code':
      return `<div class="code">${b.head ? `<p class="code__head">${esc(b.head)}</p>` : ''}<pre><code>${esc(b.code)}</code></pre></div>`;
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

/* Devuelve '' si el script no trae manual en este idioma. */
const manualOf = (s, lang) => ((s.manual || {})[lang] || {}).sections || [];

const manualSections = (s, lang, d) => {
  const sections = manualOf(s, lang);
  if (!sections.length) return '';
  const anchorOf = (sec) => `${s.slug}-${sec.id}`;
  return `
        <div class="docs__block">
          <span class="label">${esc(d.script.manual)}</span>
          <nav class="manual__nav" aria-label="${esc(d.script.manualNav)}">
            ${sections.map((sec) => `<a href="#${esc(anchorOf(sec))}">${esc(sec.title)}</a>`).join('')}
          </nav>
          <div class="manual">
            ${sections.map((sec) => `
            <section class="manual__section" id="${esc(anchorOf(sec))}">
              <h4 class="manual__title">${esc(sec.title)}</h4>
              ${sec.blocks.map(manualBlock).join('')}
            </section>`).join('')}
          </div>
        </div>`;
};

/* ---------- piezas compartidas ---------- */

const brand = (site, big = false) => `
  <span class="brand${big ? ' brand--lg' : ''}">
    <span class="brand__mark" aria-hidden="true">${esc(site.brand.initials)}</span>
    <span class="brand__lockup">
      <span class="brand__name">${esc(site.brand.name)}</span>
      <span class="brand__hand">${esc(site.brand.handwritten)}</span>
    </span>
    <span class="sr-only">${esc(site.brand.fullName)}</span>
  </span>`;

const topbar = (ctx, current) => {
  const { site, t, url, altUrl, lang } = ctx;
  return `
  <header class="topbar">
    <div class="topbar__inner wrap">
      <div class="topbar__left">
        <a href="${url.home}" aria-label="${esc(site.brand.fullName)}">${brand(site)}</a>
        <nav class="nav" aria-label="${esc(t.nav.catalog)}">
          <a href="${url.catalog}"${current === 'catalog' ? ' aria-current="page"' : ''}>${esc(t.nav.catalog)}</a>
          <a href="${url.docs}"${current === 'docs' ? ' aria-current="page"' : ''}>${esc(t.nav.docs)}</a>
          <a href="${url.docs}#changelog">${esc(t.nav.changelog)}</a>
          <a href="${esc(site.links.discord)}" rel="noopener">${esc(t.nav.support)}</a>
        </nav>
      </div>
      <div class="topbar__right">
        <div class="lang" role="group" aria-label="${esc(t.common.languageLabel)}">
          ${ctx.langs.map((l) => `<a href="${l.code === lang ? url.self : altUrl}" hreflang="${l.code}"${l.code === lang ? ' aria-current="true"' : ''}>${esc(l.short)}</a>`).join('')}
        </div>
        <a class="btn btn--ghost btn--sm" href="${esc(site.links.discord)}" rel="noopener">${icon.chat()} ${esc(t.nav.discord)}</a>
        <a class="btn btn--primary btn--sm" href="${esc(site.links.tebexStore)}" rel="noopener">${esc(t.nav.store)} ${icon.external(13)}</a>
      </div>
    </div>
  </header>`;
};

const footer = (ctx) => {
  const { site, t, url, vars } = ctx;
  /* Solo hay tres destinos: la propia web, la tienda de Tebex y el Discord. */
  const href = (item) => ({
    catalog: url.catalog,
    docs: item.anchor ? `${url.docs}#${item.anchor}` : url.docs,
    bundle: site.links.tebexBundle,
    store: site.links.tebexStore,
    discord: site.links.discord,
  }[item.type] || url.home);

  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__about">
          <a href="${url.home}" aria-label="${esc(site.brand.fullName)}">${brand(site, true)}</a>
          <p>${esc(t.footer.tagline)}</p>
        </div>
        ${t.footer.columns.map((col) => `
        <div class="footer__col">
          <span class="label">${esc(col.title)}</span>
          ${col.items.filter((it) => it.type !== 'bundle' || ctx.hasBundle).map((it) => `<a href="${esc(href(it))}" rel="noopener">${esc(it.label)}</a>`).join('')}
        </div>`).join('')}
      </div>
      <div class="footer__bottom">
        <span>${esc(tpl(t.footer.copyright, vars))}</span>
        <span>${esc(t.footer.disclaimer)}</span>
      </div>
    </div>
  </footer>`;
};

export const layout = (ctx, { title, description, current, body, script = '' }) => {
  const { site, t, lang, url, altUrl, canonical } = ctx;
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${ctx.langs.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${esc(l.code === lang ? canonical : ctx.absolute(altUrl))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(ctx.absolute(url.homeDefault))}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.brand.fullName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_GB'}">
<meta name="theme-color" content="${esc(site.theme.bg)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(site.fonts.googleUrl)}">
<link rel="stylesheet" href="/assets/site.css">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
</head>
<body>
<a class="skip" href="#main">${esc(t.common.skipToContent)}</a>
${topbar(ctx, current)}
<main id="main">
${body}
</main>
${footer(ctx)}
${script}
</body>
</html>
`;
};

/* ---------- portada ---------- */

export const renderHome = (ctx) => {
  const { site, t, url, vars, scripts, lang } = ctx;
  const h = t.home;
  const featured = scripts.filter((s) => s.featured).slice(0, 4);
  const plans = h.licenses.plans.filter((p) => p.ctaType !== 'bundle' || ctx.hasBundle);

  const body = `
  <section class="hero section--grid">
    <div class="wrap hero__grid">
      <div class="hero__copy">
        <p class="hero__eyebrow eyebrow eyebrow--dim"><span class="dot"></span>${esc(h.hero.eyebrow)}</p>
        <h1 class="h1">${esc(h.hero.title)}</h1>
        <p class="lead">${h.hero.subtitle}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="${url.catalog}">${esc(h.hero.ctaPrimary)} ${icon.arrow()}</a>
          <a class="btn btn--ghost" href="${url.docs}#performance">${esc(h.hero.ctaSecondary)}</a>
        </div>
        <p class="hero__badges">${h.hero.badges.map(esc).join('<span class="sep">/</span>')}</p>
      </div>

      <div class="resmon">
        <div class="resmon__head">
          <span class="label">${esc(h.resmon.title)}</span>
          <span class="resmon__players"><span class="dot"></span>${esc(h.resmon.players)}</span>
        </div>
        <div class="resmon__row resmon__row--head">
          <span>${esc(h.resmon.columns.resource)}</span><span>${esc(h.resmon.columns.cpu)}</span><span>${esc(h.resmon.columns.memory)}</span>
        </div>
        ${site.resmonDemo.map((r) => `
        <div class="resmon__row resmon__row--${esc(r.tone)}">
          <span>${esc(r.name)}</span><span>${esc(r.cpu)}</span><span>${esc(r.memory)}</span>
        </div>`).join('')}
        <p class="resmon__note">${esc(h.resmon.note)}</p>
      </div>
    </div>
  </section>

  <section class="compat">
    <div class="wrap compat__inner">
      <span class="label">${esc(h.compat.label)}</span>
      <div class="chip-row">${site.compat.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      <span class="compat__servers">${esc(tpl(h.compat.servers, vars))}</span>
    </div>
  </section>

  <section class="section">
    <div class="wrap stack stack--56">
      <div class="section-head">
        <p class="eyebrow">${esc(h.features.eyebrow)}</p>
        <h2 class="h2">${esc(h.features.title)}</h2>
      </div>
      <div class="features">
        ${h.features.items.map((f, i) => `
        <article class="feature">
          <span class="feature__num">0${i + 1}</span>
          ${(featureIcons[i] || icon.bolt)()}
          <h3 class="h3">${esc(f.title)}</h3>
          <p>${esc(f.text)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap stack stack--40">
      <div class="head-row">
        <div class="section-head">
          <p class="eyebrow">${esc(h.catalogSection.eyebrow)}</p>
          <h2 class="h2">${esc(plural(h.catalogSection.title, scripts.length))}</h2>
        </div>
        <a class="btn btn--ghost btn--md" href="${url.catalog}">${esc(tpl(plural(h.catalogSection.cta, scripts.length), vars))} ${icon.arrow(15)}</a>
      </div>

      <div class="table">
        <div class="table__head">
          <span>${esc(h.catalogSection.columns.script)}</span>
          <span>${esc(h.catalogSection.columns.description)}</span>
          <span style="text-align:right">${esc(h.catalogSection.columns.cpu)}</span>
          <span>${esc(h.catalogSection.columns.framework)}</span>
          <span style="text-align:right">${esc(h.catalogSection.columns.price)}</span>
          <span></span>
        </div>
        ${featured.map((s) => `
        <div class="table__row">
          <span class="table__name">${esc(s.name)}</span>
          <span class="table__desc">${esc(s[lang].tagline)}</span>
          <span class="table__cpu${parseFloat(s.idle) > 0.01 ? ' table__cpu--slow' : ''}">${esc(s.idle)}</span>
          <span class="chip-row">${s.frameworks.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}</span>
          <span class="table__price">${esc(price(s.price, lang))}</span>
          <a class="table__action" href="${url.product(s.slug)}">${esc(t.common.view)}</a>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap stack stack--44">
      <div class="section-head">
        <p class="eyebrow">${esc(h.licenses.eyebrow)}</p>
        <h2 class="h2">${esc(h.licenses.title)}</h2>
        <p class="body" style="font-size:15px">${h.licenses.note}</p>
      </div>
      <div class="plans plans--${plans.length}">
        ${plans.map((p) => {
          const cta = {
            catalog: { href: url.catalog, cls: 'btn--ghost', ext: false },
            bundle: { href: site.links.tebexBundle, cls: 'btn--primary', ext: true },
            discord: { href: site.links.discord, cls: 'btn--ghost', ext: false },
          }[p.ctaType];
          return `
        <article class="plan${p.highlight ? ' plan--highlight' : ''}">
          ${p.badge ? `<span class="plan__badge">${esc(p.badge)}</span>` : ''}
          <div class="stack" style="gap:8px">
            <span class="label">${esc(p.label)}</span>
            <p class="plan__price"><b>${esc(tpl(p.price, vars))}</b>${p.priceNote ? `<span>${esc(plural(p.priceNote, vars.availableCount))}</span>` : ''}</p>
          </div>
          <p>${esc(p.text)}</p>
          <ul class="check-list">${p.features.map((f) => `<li>${icon.check()}<span>${esc(tpl(plural(f, vars.availableCount), vars))}</span></li>`).join('')}</ul>
          <a class="btn ${cta.cls} btn--md btn--block" href="${esc(cta.href)}"${cta.ext ? ' rel="noopener"' : ''}>${esc(p.cta)}${cta.ext ? ` ${icon.external()}` : ''}</a>
        </article>`;
        }).join('')}
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap faq">
      <div class="section-head">
        <p class="eyebrow">${esc(h.faq.eyebrow)}</p>
        <h2 class="h2">${esc(h.faq.title)}</h2>
        <p class="small">${esc(h.faq.note)}</p>
      </div>
      <div>
        ${h.faq.items.map((f) => `
        <article class="faq__item">
          <h3>${esc(f.q)}</h3>
          <p>${f.a}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--grid">
    <div class="wrap cta-band">
      <div class="cta-band__copy">
        <h2 class="h2">${esc(h.cta.title)}</h2>
        <p class="lead" style="font-size:16px">${esc(h.cta.text)}</p>
      </div>
      <div class="cta-band__actions">
        <a class="btn btn--primary" href="${url.catalog}">${esc(h.cta.primary)} ${icon.arrow()}</a>
        <a class="btn btn--ghost" href="${esc(site.links.discord)}" rel="noopener">${icon.chat(16)} ${esc(h.cta.secondary)}</a>
      </div>
    </div>
  </section>`;

  return layout(ctx, {
    title: tpl(t.meta.home.title, vars),
    description: tpl(t.meta.home.description, vars),
    current: 'home',
    body,
  });
};

/* ---------- catálogo ---------- */

export const renderCatalog = (ctx) => {
  const { site, t, url, vars, scripts, lang, counts } = ctx;
  const c = t.catalog;
  const frameworks = [...new Set(scripts.flatMap((s) => s.frameworks))];
  const categories = [...new Set(scripts.map((s) => s.category))];

  const body = `
  <section class="page-head">
    <div class="wrap page-head__inner">
      <div class="page-head__copy">
        <p class="label">${esc(c.breadcrumb)}</p>
        <h1 class="h1">${esc(c.title)}</h1>
        <p class="body">${esc(tpl(plural(c.subtitle, scripts.length), vars))}</p>
      </div>
      <label class="search">
        ${icon.search()}
        <input type="search" id="q" placeholder="${esc(c.search)}" aria-label="${esc(c.search)}">
      </label>
    </div>
  </section>

  <section class="catalog">
    <div class="wrap catalog__layout">
      <aside class="filters" aria-label="${esc(c.filters.category)}">
        <div class="filters__group">
          <span class="label">${esc(c.filters.category)}</span>
          <div class="filters__list">
            <button type="button" class="filters__opt" data-filter="category" data-value="all" aria-pressed="true">
              ${esc(t.categories.all)} <span class="count">${scripts.length}</span>
            </button>
            ${categories.map((cat) => `
            <button type="button" class="filters__opt" data-filter="category" data-value="${esc(cat)}" aria-pressed="false">
              ${esc(t.categories[cat] || cat)} <span class="count">${counts.category[cat]}</span>
            </button>`).join('')}
          </div>
        </div>

        <div class="filters__group">
          <span class="label">${esc(c.filters.framework)}</span>
          <div class="filters__list">
            ${frameworks.map((f) => `
            <button type="button" class="checkbox" data-filter="framework" data-value="${esc(f)}" aria-pressed="false">
              <span class="box">${icon.check(11)}</span>${esc(f)}
            </button>`).join('')}
          </div>
        </div>

        <div class="filters__group">
          <span class="label">${esc(c.filters.price)}</span>
          <div class="chip-row">
            ${c.filters.priceRanges.map((label, i) => `
            <button type="button" class="pill" data-filter="price" data-value="${i}" aria-pressed="false">${esc(label)}</button>`).join('')}
          </div>
        </div>

        <div class="filters__group">
          <span class="label">${esc(c.filters.performance)}</span>
          <button type="button" class="checkbox" data-filter="fast" data-value="1" aria-pressed="false">
            <span class="box">${icon.check(11)}</span>${esc(c.filters.fastOnly)}
          </button>
        </div>

        <button type="button" class="btn btn--ghost btn--md btn--block" id="clear">${esc(c.filters.clear)}</button>
      </aside>

      <div class="results">
        <div class="results__bar">
          <p class="results__count" id="count" data-one="${esc(c.results.countOne)}" data-many="${esc(c.results.count)}">${esc(tpl(scripts.length === 1 ? c.results.countOne : c.results.count, { count: scripts.length }))}</p>
          <div class="results__sort">
            <span class="label">${esc(c.results.sortLabel)}</span>
            <select class="select" id="sort" aria-label="${esc(c.results.sortLabel)}">
              ${c.results.sortOptions.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="cards" id="cards">
          ${scripts.map((s) => `
          <article class="card${s.status === 'beta' ? ' card--beta' : ''}"
                   data-name="${esc(s.name)}"
                   data-search="${esc((s.name + ' ' + s[lang].tagline).toLowerCase())}"
                   data-category="${esc(s.category)}"
                   data-frameworks="${esc(s.frameworks.join('|'))}"
                   data-price="${s.price}"
                   data-cpu="${parseFloat(s.idle)}">
            <div class="card__main">
              <div class="card__title">
                <span class="card__name">${esc(s.name)}</span>
                ${s.status === 'beta' ? `<span class="chip">${esc(t.statuses.beta)}</span>` : ''}
              </div>
              <p class="card__desc">${esc(s[lang].tagline)}</p>
            </div>
            <span class="card__cpu${parseFloat(s.idle) > 0.01 ? ' card__cpu--slow' : ''}">${esc(s.idle)}</span>
            <span class="chip-row">${s.frameworks.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}</span>
            <span class="card__price${s.status === 'beta' ? ' card__price--muted' : ''}">${esc(price(s.price, lang))}</span>
            <a class="card__action ${s.featured && s.status !== 'beta' ? 'card__action--primary' : 'card__action--ghost'}" href="${url.product(s.slug)}">${esc(s.status === 'beta' ? t.common.waitlist : t.common.view)}</a>
          </article>`).join('')}
        </div>

        <p class="empty" id="empty">${esc(c.results.empty)}</p>

        ${ctx.hasBundle ? `
        <div class="bundle-banner">
          <div class="bundle-banner__copy">
            <b>${esc(c.bundle.title)}</b>
            <p>${esc(tpl(c.bundle.text, vars))}</p>
          </div>
          <a class="btn btn--primary btn--md" href="${esc(site.links.tebexBundle)}" rel="noopener">${esc(c.bundle.cta)} ${icon.external()}</a>
        </div>` : ''}
      </div>
    </div>
  </section>`;

  return layout(ctx, {
    title: tpl(t.meta.catalog.title, vars),
    description: tpl(t.meta.catalog.description, vars),
    current: 'catalog',
    body,
    script: '<script src="/assets/catalog.js" defer></script>',
  });
};

/* ---------- ficha de producto ---------- */

export const renderProduct = (ctx, s) => {
  const { site, t, url, vars, lang, scripts } = ctx;
  const p = t.product;
  const loc = s[lang];
  const isBeta = s.status === 'beta';
  const related = scripts.filter((x) => x.slug !== s.slug && x.status !== 'beta').slice(0, 2);
  const pVars = { ...vars, name: s.name, exports: s.apiNote.exports, events: s.apiNote.events };

  const body = `
  <section class="product__head">
    <div class="wrap stack" style="gap:18px">
      <p class="label"><a href="${url.catalog}" style="color:inherit">${esc(p.breadcrumb)}</a> / ${esc(t.categories[s.category] || s.category)} / ${esc(s.name)}</p>
      <div class="product__title">
        <h1>${esc(s.name)}</h1>
        <span class="chip chip--accent">v${esc(s.version)}</span>
        ${s.frameworks.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}
        ${isBeta ? `<span class="chip">${esc(t.statuses.beta)}</span>` : ''}
      </div>
      <p class="lead" style="max-width:760px">${esc(loc.tagline)}</p>
    </div>
  </section>

  <section class="product">
    <div class="wrap product__layout">
      <div class="product__main">

        <div class="media">
          <div class="media__main">
            ${icon.image()}
            <p class="media__caption">${esc(p.mediaPlaceholder)}</p>
          </div>
          <div class="media__thumbs">
            <div class="media__thumb media__thumb--active"></div>
            <div class="media__thumb"></div>
            <div class="media__thumb"></div>
            <div class="media__thumb">${esc(p.mediaVideo)}</div>
          </div>
        </div>

        <div class="tabs">
          <div class="tabs__list" role="tablist">
            ${['description', 'install', 'api', 'changelog', 'requirements'].map((k, i) => `
            <button type="button" class="tabs__tab" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" data-tab="${k}">${esc(p.tabs[k])}</button>`).join('')}
          </div>

          <div class="tabs__panel" id="panel-description" role="tabpanel" aria-labelledby="tab-description" data-active>
            ${loc.description.map((par) => `<p class="body">${par}</p>`).join('')}
            <ul class="feature-cols check-list">
              ${loc.features.map((f) => `<li>${icon.check()}<span>${esc(f)}</span></li>`).join('')}
            </ul>
          </div>

          <div class="tabs__panel" id="panel-install" role="tabpanel" aria-labelledby="tab-install">
            <h2 class="h3">${esc(p.install.title)}</h2>
            <ol class="steps">${(loc.installSteps || p.install.steps).map((st) => `<li><span>${tpl(st, pVars)}</span></li>`).join('')}</ol>
          </div>

          <div class="tabs__panel" id="panel-api" role="tabpanel" aria-labelledby="tab-api">
            <h2 class="h3">${esc(p.api.title)}</h2>
            <div class="code">
              <p class="code__head">${esc(p.api.file)}</p>
              <pre><code>${esc(s.code)}</code></pre>
            </div>
            <p class="small">${esc(tpl(p.api.note, pVars))}</p>
            <a class="btn btn--ghost btn--md" href="${url.docs}#${esc(s.slug)}" style="align-self:flex-start">${esc(p.api.manualCta)} ${icon.arrow(15)}</a>
          </div>

          <div class="tabs__panel" id="panel-changelog" role="tabpanel" aria-labelledby="tab-changelog">
            <h2 class="h3">${esc(p.changelog.title)}</h2>
            <div class="data-table">
              <div class="data-table__head"><span>${esc(p.tabs.changelog)}</span><span>${esc(t.product.aside.spec.version)}</span><span>${esc(t.product.aside.spec.updated)}</span></div>
              ${changelogOf(s).map((e) => `
              <div class="data-table__row"><span>${esc(e[lang] || s.name)}</span><b>${esc(e.version)}</b><b>${esc(date(e.date, lang))}</b></div>`).join('')}
            </div>
            <p class="small">${esc(p.changelog.note)}</p>
            <a class="btn btn--ghost btn--md" href="${url.docs}#changelog" style="align-self:flex-start">${esc(p.changelog.cta)} ${icon.arrow(15)}</a>
          </div>

          <div class="tabs__panel" id="panel-requirements" role="tabpanel" aria-labelledby="tab-requirements">
            <h2 class="h3">${esc(p.requirements.title)}</h2>
            <ul class="check-list">
              <li>${icon.check()}<span>${esc(t.product.aside.spec.frameworks)}: ${esc(s.frameworks.join(' · '))}</span></li>
              <li>${icon.check()}<span>${esc(t.product.aside.spec.dependencies)}: ${esc(s.dependencies.length ? s.dependencies.join(' · ') : t.product.aside.spec.none)}</span></li>
            </ul>
            <p class="small">${esc(p.requirements.buildNote)}</p>
          </div>
        </div>

        <div class="stack" style="gap:16px">
          <h2 class="h3" style="font-size:20px">${esc(p.performance.title)}</h2>
          <div class="data-table">
            <div class="data-table__head">
              <span>${esc(p.performance.columns.scenario)}</span><span>${esc(p.performance.columns.cpu)}</span><span>${esc(p.performance.columns.memory)}</span>
            </div>
            ${s.performance.map((r) => `
            <div class="data-table__row">
              <span>${esc(t.perfScenarios[r.scenario] || r.scenario)}</span>
              <b class="${r.good ? 'good' : ''}">${esc(r.cpu)}</b>
              <b>${esc(r.memory)}</b>
            </div>`).join('')}
          </div>
          <p class="small mono" style="font-size:11px">${esc(tpl(p.performance.note, vars))}</p>
        </div>

      </div>

      <aside class="aside">
        <div class="buybox">
          <p class="buybox__price"><b>${esc(price(s.price, lang))}</b><span>${esc(p.aside.vat)}</span></p>
          <div class="stack" style="gap:8px">
            <span class="label">${esc(p.aside.packageLabel)}</span>
            <p class="buybox__field">${esc(p.aside.licenceOption)}</p>
          </div>
          <div class="buybox__actions">
            ${isBeta
              ? `<p class="notice">${esc(p.betaNotice)}</p>
                 <a class="btn btn--ghost btn--block" href="${esc(site.links.discord)}" rel="noopener">${icon.chat(16)} ${esc(p.aside.supportCta)}</a>`
              : `<a class="btn btn--primary btn--block" style="min-height:48px" href="${esc(s.tebex)}" rel="noopener">${esc(p.aside.buy)} ${icon.external()}</a>
                 <a class="btn btn--ghost btn--md btn--block" href="${url.docs}#${esc(s.slug)}">${esc(p.aside.docs)}</a>
                 <p class="buybox__note">${esc(p.aside.checkoutNote)}</p>`}
          </div>
          <ul class="buybox__includes">
            ${p.aside.includes.map((i) => `<li>${icon.check(14)}<span>${esc(i)}</span></li>`).join('')}
          </ul>
        </div>

        <div class="panel">
          <p class="panel__head label">${esc(p.aside.specTitle)}</p>
          <dl style="margin:0">
            <div class="panel__row"><dt>${esc(p.aside.spec.version)}</dt><dd>${esc(s.version)}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.updated)}</dt><dd>${esc(date(s.updated, lang))}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.category)}</dt><dd>${esc(t.categories[s.category] || s.category)}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.frameworks)}</dt><dd>${esc(s.frameworks.join(' · '))}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.dependencies)}</dt><dd>${esc(s.dependencies.length ? s.dependencies.join(' · ') : p.aside.spec.none)}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.size)}</dt><dd>${esc(s.size)}</dd></div>
            <div class="panel__row"><dt>${esc(p.aside.spec.locales)}</dt><dd>${esc(s.locales.join(' · '))}</dd></div>
          </dl>
        </div>

        <div class="panel panel__box">
          <h3>${esc(p.aside.supportTitle)}</h3>
          <p>${esc(p.aside.supportText)}</p>
          <a class="btn btn--ghost btn--md btn--block" href="${esc(site.links.discord)}" rel="noopener">${icon.chat(15)} ${esc(p.aside.supportCta)}</a>
        </div>

        ${related.length ? `
        <div class="crosssell">
          <span class="label">${esc(p.aside.crossSellTitle)}</span>
          ${related.map((r) => `
          <p class="crosssell__row"><a href="${url.product(r.slug)}">${esc(r.name)}</a><span>${esc(price(r.price, lang))}</span></p>`).join('')}
          ${ctx.hasBundle ? `<p class="crosssell__total"><span>${esc(p.aside.bundleRow)}</span><span>${esc(price(site.bundle.price, lang))}</span></p>` : ''}
        </div>` : ''}
      </aside>
    </div>
  </section>`;

  return layout(ctx, {
    title: tpl(t.meta.product.title, { ...vars, name: s.name }),
    description: tpl(t.meta.product.description, {
      ...vars, tagline: loc.tagline, idle: s.idle, frameworks: s.frameworks.join(', '),
    }),
    current: 'catalog',
    body,
    script: '<script src="/assets/product.js" defer></script>',
  });
};

/* ---------- documentación ---------- */

export const renderDocs = (ctx) => {
  const { site, t, url, vars, scripts, lang } = ctx;
  const d = t.docs;

  const toc = [
    { id: 'performance', label: d.performance.title },
    { id: 'install', label: d.scripts.title },
    ...scripts.map((s) => ({ id: s.slug, label: s.name, sub: true })),
    { id: 'changelog', label: d.changelog.title },
    { id: 'license', label: d.legal.title },
    { id: 'support', label: d.support.title },
  ];

  const scriptBlock = (s) => {
    const loc = s[lang];
    const isBeta = s.status === 'beta';
    const sVars = { ...vars, name: s.name, exports: s.apiNote.exports, events: s.apiNote.events };
    return `
      <article class="docs__section" id="${esc(s.slug)}">
        <div class="docs__head">
          <h3>${esc(s.name)}</h3>
          <span class="chip chip--accent">v${esc(s.version)}</span>
          ${s.frameworks.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}
          ${isBeta ? `<span class="chip">${esc(t.statuses.beta)}</span>` : ''}
        </div>
        <p class="body">${esc(loc.tagline)}</p>

        <div class="docs__block">
          <span class="label">${esc(d.script.install)}</span>
          <ol class="steps">${(loc.installSteps || t.product.install.steps).map((st) => `<li><span>${tpl(st, sVars)}</span></li>`).join('')}</ol>
        </div>

        <div class="docs__block">
          <span class="label">${esc(d.script.api)}</span>
          <div class="code">
            <p class="code__head">${esc(t.product.api.file)}</p>
            <pre><code>${esc(s.code)}</code></pre>
          </div>
          <p class="small">${esc(tpl(t.product.api.note, sVars))}</p>
        </div>

        <div class="docs__block">
          <span class="label">${esc(d.script.requirements)}</span>
          <ul class="check-list">
            <li>${icon.check()}<span>${esc(t.product.aside.spec.frameworks)}: ${esc(s.frameworks.join(' · '))}</span></li>
            <li>${icon.check()}<span>${esc(t.product.aside.spec.dependencies)}: ${esc(s.dependencies.length ? s.dependencies.join(' · ') : t.product.aside.spec.none)}</span></li>
            <li>${icon.check()}<span>${esc(t.product.aside.spec.locales)}: ${esc(s.locales.join(' · '))}</span></li>
          </ul>
          <p class="small">${esc(t.product.requirements.buildNote)}</p>
        </div>

        ${manualSections(s, lang, d)}

        <div class="docs__actions">
          <a class="btn btn--ghost btn--md" href="${url.product(s.slug)}">${esc(d.script.product)} ${icon.arrow(15)}</a>
          ${isBeta
            ? `<p class="small">${esc(d.script.beta)}</p>`
            : `<a class="btn btn--primary btn--md" href="${esc(s.tebex)}" rel="noopener">${esc(d.script.buy)} ${icon.external()}</a>`}
        </div>
      </article>`;
  };

  const body = `
  <section class="page-head">
    <div class="wrap page-head__inner">
      <div class="page-head__copy">
        <p class="label">${esc(d.breadcrumb)}</p>
        <h1 class="h1">${esc(d.title)}</h1>
        <p class="body">${esc(d.subtitle)}</p>
      </div>
    </div>
  </section>

  <section class="docs">
    <div class="wrap docs__layout">
      <aside class="docs__toc" aria-label="${esc(d.tocTitle)}">
        <span class="label">${esc(d.tocTitle)}</span>
        <nav class="docs__toc-list">
          ${toc.map((i) => `<a href="#${esc(i.id)}"${i.sub ? ' class="docs__toc-sub"' : ''}>${esc(i.label)}</a>`).join('')}
        </nav>
      </aside>

      <div class="docs__body">
        <article class="docs__section" id="performance">
          <h2 class="h2">${esc(d.performance.title)}</h2>
          <p class="body">${d.performance.text}</p>
          <div class="data-table">
            <div class="data-table__head">
              <span>${esc(t.home.resmon.columns.resource)}</span><span>${esc(t.home.resmon.columns.cpu)}</span><span>${esc(t.home.resmon.columns.memory)}</span>
            </div>
            ${scripts.map((s) => `
            <div class="data-table__row"><span>${esc(s.name)}</span><b class="good">${esc(s.idle)}</b><b>${esc(s.performance[0] ? s.performance[0].memory : '—')}</b></div>`).join('')}
          </div>
          <p class="small">${esc(tpl(d.performance.note, vars))}</p>
        </article>

        <article class="docs__section" id="install">
          <h2 class="h2">${esc(d.scripts.title)}</h2>
          <p class="body">${esc(d.scripts.text)}</p>
        </article>

        ${scripts.map(scriptBlock).join('')}

        <article class="docs__section" id="changelog">
          <h2 class="h2">${esc(d.changelog.title)}</h2>
          <p class="body">${esc(d.changelog.text)}</p>
          ${scripts.map((s) => `
          <div class="docs__block">
            <span class="label">${esc(s.name)}</span>
            <div class="data-table">
              <div class="data-table__head">
                <span>${esc(d.changelog.columns.changes)}</span><span>${esc(d.changelog.columns.version)}</span><span>${esc(d.changelog.columns.date)}</span>
              </div>
              ${changelogOf(s).map((e) => `
              <div class="data-table__row"><span>${esc(e[lang] || s.name)}</span><b>${esc(e.version)}</b><b>${esc(date(e.date, lang))}</b></div>`).join('')}
            </div>
          </div>`).join('')}
        </article>

        <article class="docs__section" id="license">
          <h2 class="h2">${esc(d.legal.title)}</h2>
          <div>
            ${d.legal.items.map((i) => `
            <article class="faq__item" id="${esc(i.id)}">
              <h3>${esc(i.title)}</h3>
              <p>${esc(i.text)}</p>
            </article>`).join('')}
          </div>
        </article>

        <article class="docs__section" id="support">
          <h2 class="h2">${esc(d.support.title)}</h2>
          <p class="body">${esc(d.support.text)}</p>
          <div class="docs__actions">
            <a class="btn btn--primary btn--md" href="${esc(site.links.discord)}" rel="noopener">${icon.chat(15)} ${esc(d.support.discord)}</a>
            <a class="btn btn--ghost btn--md" href="${esc(site.links.tebexStore)}" rel="noopener">${esc(d.support.store)} ${icon.external()}</a>
          </div>
        </article>
      </div>
    </div>
  </section>`;

  return layout(ctx, {
    title: tpl(t.meta.docs.title, vars),
    description: tpl(t.meta.docs.description, vars),
    current: 'docs',
    body,
  });
};

/* ---------- 404 ---------- */

export const renderNotFound = (ctx) => {
  const { t, url, vars } = ctx;
  const body = `
  <section class="notfound">
    <p class="eyebrow">404</p>
    <h1 class="h1">${esc(t.notFound.title)}</h1>
    <p class="lead">${esc(t.notFound.text)}</p>
    <a class="btn btn--primary" href="${url.catalog}">${esc(t.notFound.cta)} ${icon.arrow()}</a>
  </section>`;
  return layout(ctx, {
    title: `${t.notFound.title} · ${vars.brand}`,
    description: t.notFound.text,
    current: 'none',
    body,
  });
};

#!/usr/bin/env node
/* ============================================================
   Javiito Extensions — generador del sitio
   Lee content/*.json y escribe dist/ en español y en inglés.
   Sin dependencias: node build.mjs
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHome, renderCatalog, renderProduct, renderNotFound, price, tpl } from './src/templates.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const site = read('content/site.json');
const scripts = read('content/scripts.json');
const langs = site.languages.map((code) => read(`content/${code}.json`));

const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });

const write = (relative, contents) => {
  const target = join(dist, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  return relative;
};

/* ---------- comprobaciones de contenido ---------- */

const problems = [];
const slugs = new Set();
for (const s of scripts) {
  if (slugs.has(s.slug)) problems.push(`slug repetido: ${s.slug}`);
  slugs.add(s.slug);
  for (const lang of site.languages) {
    if (!s[lang]) problems.push(`${s.slug}: falta el bloque "${lang}"`);
    else if (!s[lang].tagline) problems.push(`${s.slug}.${lang}: falta "tagline"`);
  }
  if (typeof s.price !== 'number') problems.push(`${s.slug}: "price" debe ser un número`);
}
if (problems.length) {
  console.error('Contenido con problemas:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

/* ---------- valores derivados del contenido ---------- */

const available = scripts.filter((s) => s.status !== 'beta');
const individualTotal = available.reduce((sum, s) => sum + s.price, 0);
const minPrice = Math.min(...available.map((s) => s.price));
/* El pack solo tiene sentido con más de un script a la venta. */
const hasBundle = available.length > 1;

const counts = { category: {} };
for (const s of scripts) counts.category[s.category] = (counts.category[s.category] || 0) + 1;

/* ---------- contexto por idioma ---------- */

const summary = [];

for (const t of langs) {
  const lang = t.code;
  const other = site.languages.find((l) => l !== lang);
  const base = `/${lang}/`;

  const url = {
    home: base,
    catalog: `${base}scripts/`,
    product: (slug) => `${base}scripts/${slug}/`,
    homeDefault: `/${site.defaultLang}/`,
    self: base,
  };

  const vars = {
    brand: site.brand.fullName,
    fullName: site.brand.fullName,
    name: site.brand.name,
    domain: site.domain,
    year: new Date().getFullYear(),
    scriptCount: scripts.length,
    availableCount: available.length,
    minPrice: price(minPrice, lang),
    bundlePrice: price(site.bundle.price, lang),
    individualTotal: price(individualTotal, lang),
    activeServers: site.stats.activeServers,
    hardware: site.stats.benchmarkHardware,
    build: site.stats.fivemBuild,
  };

  const ctx = {
    site, t, lang, scripts, counts, vars, hasBundle,
    langs: langs.map((l) => ({ code: l.code, short: l.short, label: l.label })),
    absolute: (path) => site.baseUrl.replace(/\/$/, '') + path,
  };

  const page = (extra) => ({ ...ctx, ...extra });

  // portada
  summary.push(write(`${lang}/index.html`, renderHome(page({
    url: { ...url, self: base },
    altUrl: `/${other}/`,
    canonical: ctx.absolute(base),
  }))));

  // catálogo
  summary.push(write(`${lang}/scripts/index.html`, renderCatalog(page({
    url: { ...url, self: url.catalog },
    altUrl: `/${other}/scripts/`,
    canonical: ctx.absolute(url.catalog),
  }))));

  // fichas de producto
  for (const s of scripts) {
    summary.push(write(`${lang}/scripts/${s.slug}/index.html`, renderProduct(page({
      url: { ...url, self: url.product(s.slug) },
      altUrl: `/${other}/scripts/${s.slug}/`,
      canonical: ctx.absolute(url.product(s.slug)),
    }), s)));
  }

  // 404 por idioma
  summary.push(write(`${lang}/404.html`, renderNotFound(page({
    url: { ...url, self: base },
    altUrl: `/${other}/`,
    canonical: ctx.absolute(`${base}404`),
  }))));
}

/* ---------- raíz: reparto por idioma del navegador ---------- */

const defaultLang = site.defaultLang;
const rootRedirect = `<!doctype html>
<html lang="${defaultLang}">
<head>
<meta charset="utf-8">
<title>${site.brand.fullName}</title>
<meta name="robots" content="noindex">
${site.languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${site.baseUrl.replace(/\/$/, '')}/${l}/">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${site.baseUrl.replace(/\/$/, '')}/${defaultLang}/">
<meta http-equiv="refresh" content="0; url=/${defaultLang}/">
<script>
  (function () {
    var supported = ${JSON.stringify(site.languages)};
    var wanted = (navigator.languages || [navigator.language || '${defaultLang}'])
      .map(function (l) { return String(l).slice(0, 2).toLowerCase(); })
      .find(function (l) { return supported.indexOf(l) !== -1; });
    location.replace('/' + (wanted || '${defaultLang}') + '/');
  })();
</script>
</head>
<body>
${site.languages.map((l) => `<p><a href="/${l}/">${l.toUpperCase()}</a></p>`).join('\n')}
</body>
</html>
`;
summary.push(write('index.html', rootRedirect));

// 404 de Cloudflare Pages, en el idioma por defecto
summary.push(write('404.html', readFileSync(join(dist, `${defaultLang}/404.html`), 'utf8')));

/* ---------- estáticos ---------- */

const theme = site.theme;
const tokens = `:root {
  --bg: ${theme.bg};
  --surface: ${theme.surface};
  --raised: ${theme.raised};
  --header: ${theme.header};
  --border: ${theme.border};
  --border-soft: ${theme.borderSoft};
  --border-strong: ${theme.borderStrong};
  --text: ${theme.text};
  --text-body: ${theme.textBody};
  --text-muted: ${theme.textMuted};
  --text-faint: ${theme.textFaint};
  --text-dim: ${theme.textDim};
  --acc: ${theme.accent};
  --acc-hi: ${theme.accent};
  --acc-ink: ${theme.accentInk};
  --acc-soft: ${theme.accentSoft};
  --warn: ${theme.warn};
  --font-sans: ${site.fonts.sans};
  --font-mono: ${site.fonts.mono};
  --font-hand: ${site.fonts.hand};
  color-scheme: dark;
}

@supports (color: color-mix(in srgb, red, white)) {
  :root { --acc-hi: color-mix(in srgb, ${theme.accent} 78%, white); }
}

`;
summary.push(write('assets/site.css', tokens + readFileSync(join(root, 'src/styles.css'), 'utf8')));
summary.push(write('assets/catalog.js', readFileSync(join(root, 'src/catalog.js'), 'utf8')));
summary.push(write('assets/product.js', readFileSync(join(root, 'src/product.js'), 'utf8')));

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${theme.accent}"/>
  <text x="16" y="22" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="16" font-weight="700" fill="${theme.accentInk}">${site.brand.initials}</text>
</svg>
`;
summary.push(write('assets/favicon.svg', favicon));

// robots + sitemap
const urls = [];
for (const lang of site.languages) {
  urls.push(`/${lang}/`, `/${lang}/scripts/`, ...scripts.map((s) => `/${lang}/scripts/${s.slug}/`));
}
summary.push(write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.baseUrl.replace(/\/$/, '')}${u}</loc></url>`).join('\n')}
</urlset>
`));
summary.push(write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl.replace(/\/$/, '')}/sitemap.xml\n`));

// carpeta opcional para tus imágenes: public/ se copia tal cual a dist/
if (existsSync(join(root, 'public'))) {
  cpSync(join(root, 'public'), dist, { recursive: true });
}

const pages = summary.filter((f) => f.endsWith('.html')).length;
console.log(`dist/ generado — ${pages} páginas HTML, ${site.languages.join(' + ')}, ${scripts.length} scripts`);

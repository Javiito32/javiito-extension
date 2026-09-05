# Javiito Extensions — sitio

Sitio estático bilingüe (español e inglés) para vender scripts de FiveM.
Todo el contenido vive en `content/*.json`; no hace falta tocar HTML para
cambiar textos, precios ni scripts. Sin dependencias: solo Node.

```bash
node build.mjs     # genera dist/
node serve.mjs     # lo sirve en http://localhost:4321
```

## Qué edito para cada cosa

| Quiero cambiar | Archivo |
| --- | --- |
| Enlaces de Discord y Tebex, dominio, colores, fuentes | `content/site.json` |
| Los scripts: precio, versión, frameworks, textos, rendimiento | `content/scripts.json` |
| Todo el texto de la web en español | `content/es.json` |
| Todo el texto de la web en inglés | `content/en.json` |
| La documentación (índice en `/es/docs/` y `/en/docs/`, un apartado por script) | `content/es.json` → `docs`, `content/en.json` → `docs` |
| El manual largo de un script | `content/manuals/<slug>.json` |
| Aspecto visual | `src/styles.css` |
| Estructura de las páginas | `src/templates.mjs` |

Las imágenes que pongas en `public/` se copian tal cual a la raíz del sitio:
`public/capturas/garage.png` se sirve como `/capturas/garage.png`.

## Enlaces externos

El sitio solo apunta a dos sitios de fuera: la tienda
(`links.tebexStore`) y el Discord (`links.discord`), los dos en
`content/site.json`. No hay wiki, changelog ni página de términos en otro
dominio: todo eso vive en `/es/docs/` y `/en/docs/`, que se generan desde el
bloque `docs` de cada idioma. Si añades un enlace nuevo, que salga de ahí.

`scripts[].tebex` es el enlace de compra de cada script: apunta a la tienda y
puedes cambiarlo por la URL directa de su paquete cuando la tengas.

## Huecos por rellenar

Búscalos con `grep -rn "\[" content/` — todo lo que va entre corchetes es
tuyo: número de servidores activos, hardware de las mediciones y política de
reembolsos. Falta también el dominio real en `domain` y `baseUrl`, que solo se
usan para el `canonical` y el sitemap.

Los nombres de scripts, los precios y los milisegundos son valores de ejemplo.

## La documentación

La documentación se genera como un sitio aparte, al estilo Docusaurus: barra
lateral, una página por tema y un apartado por script.

| Ruta | Qué es |
| --- | --- |
| `/{lang}/docs/` | Índice: lista de scripts y cómo está organizada |
| `/{lang}/docs/performance/` | Cómo se mide el rendimiento |
| `/{lang}/docs/<slug>/` | Introducción de ese script |
| `/{lang}/docs/<slug>/<id>/` | Cada sección del manual |
| `/{lang}/docs/<slug>/changelog/` | Historial de ese script |
| `/{lang}/docs/changelog/` | Historial de todos |
| `/{lang}/docs/legal/` | Licencia, términos, privacidad y reembolsos |
| `/{lang}/docs/support/` | Soporte |

Si un script no tiene `content/manuals/<slug>.json`, el build crea páginas de
instalación, API y requisitos a partir de `content/scripts.json`. Encima van
rendimiento, licencia y soporte, en `docs.legal` y `docs.support` de cada idioma.

Los anclajes antiguos (`/docs/#jex-interactions`, `/docs/#changelog`,
`#<slug>-<id>`) redirigen solos a la página nueva.

El historial de cada script sale de su lista `changelog` en
`content/scripts.json` (`version`, `date` y el texto en `es` y `en`). Si no la
pones, se muestra su versión actual.

## El manual de un script

Si un script necesita más que los pasos de instalación —configuración, API
completa, integraciones, solución de problemas— ponlo en
`content/manuals/<slug>.json`. El build lo detecta solo por el nombre del
archivo y convierte cada sección en una página bajo
`/{lang}/docs/<slug>/<id>/`. La ficha del script enlaza al manual desde la
pestaña de exports. Sin ese archivo, se generan las páginas cortas de
instalación, API y requisitos.

El archivo tiene un bloque por idioma y las mismas secciones en los dos, con el
mismo `id` y en el mismo orden (el build para si no coinciden). Cada sección
vive en `/{lang}/docs/<slug>/<id>/`; los anclajes viejos `#<slug>-<id>` siguen
funcionando porque redirigen:

```json
{
  "slug": "mi-script",
  "es": { "sections": [ { "id": "config", "title": "Configuración", "blocks": [] } ] },
  "en": { "sections": [ { "id": "config", "title": "Configuration", "blocks": [] } ] }
}
```

Cada sección es una lista de bloques y hay siete tipos:

| `type` | Campos | Qué pinta |
| --- | --- | --- |
| `p` | `html` | Un párrafo. |
| `note` | `html` | Un párrafo pequeño, para avisos y matices. |
| `ul` | `items` | Una lista de puntos. |
| `ol` | `items` | Una lista numerada. |
| `h` | `text`, `mono` | Un subtítulo dentro de la sección; con `"mono": true` sale en monoespaciada y en color de acento, para nombres de funciones. |
| `code` | `head`, `code` | Un bloque de código; `head` es la etiqueta de arriba (`client.lua`, `server.cfg`) y puede ir vacía. |
| `table` | `columns`, `rows` | Una tabla; la primera columna sale como código. |

En `html` y en `items` puedes escribir HTML: `<code>`, `<strong>` o un enlace.
El contenido de `code` y los títulos se escapan solos, así que el código va tal
cual, con sus `<`, sus comillas y sus llaves.

## Añadir un script

Copia un bloque de `content/scripts.json` y cambia `slug`, `name`, `price`,
`category`, `frameworks`, `tebex`, `changelog` y los bloques `es` y `en`. El build crea sus
dos páginas, lo mete en el catálogo y recalcula los contadores, el precio
mínimo y el ahorro del pack. Categorías nuevas: añade su etiqueta en
`categories` dentro de `es.json` y `en.json`.

Si te falta una clave en un idioma, el build avisa antes de generar nada.
Categorías nuevas hay que declararlas: añade su etiqueta en `categories` dentro
de `es.json` y `en.json`. Lo mismo con los escenarios de la tabla de
rendimiento, en `perfScenarios`.

## Singular y plural

Cualquier texto del JSON puede ser una cadena normal o un par:

```json
"subtitle": {
  "one":   "Un recurso en producción.",
  "other": "{scriptCount} recursos en producción."
}
```

El build elige según cuántos scripts haya. Ya está puesto en el título de la
portada, el botón del catálogo, el subtítulo del catálogo y las licencias.

## El pack completo

La licencia «Pack completo», su banner en el catálogo, su enlace en el pie y la
fila del pack en la ficha aparecen **solos** en cuanto tengas dos o más scripts
a la venta. Con uno no se muestran, porque no habría pack que vender: los textos
y el precio siguen en los JSON esperando.


## Idiomas

- `/es/…` y `/en/…` son páginas reales, con `hreflang` y `canonical`.
- Cada idioma tiene portada, catálogo, documentación, una ficha por script y 404.
- La raíz `/` reparte según el idioma del navegador.
- Para añadir un idioma: crea `content/<código>.json` copiando `es.json` y
  añade el código a `languages` en `content/site.json`.

## Cloudflare Pages

Conecta el repositorio y usa:

- **Build command:** `node build.mjs`
- **Build output directory:** `dist`
- **Framework preset:** ninguno

El sitio es HTML plano: no hay servidor, no hay base de datos y el cobro lo
gestiona Tebex desde sus propios enlaces.

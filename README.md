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
| Aspecto visual | `src/styles.css` |
| Estructura de las páginas | `src/templates.mjs` |

Las imágenes que pongas en `public/` se copian tal cual a la raíz del sitio:
`public/capturas/garage.png` se sirve como `/capturas/garage.png`.

## Huecos por rellenar

Búscalos con `grep -rn "\[" content/` — todo lo que va entre corchetes es
tuyo: dominio, invitación de Discord, enlaces de paquete de Tebex, número de
servidores activos, hardware de las mediciones y política de reembolsos.

Los nombres de scripts, los precios y los milisegundos son valores de ejemplo.

## Añadir un script

Copia un bloque de `content/scripts.json` y cambia `slug`, `name`, `price`,
`category`, `frameworks`, `tebex` y los bloques `es` y `en`. El build crea sus
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

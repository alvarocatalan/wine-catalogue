# Handoff: Rediseño del Catálogo de vinos

> Paquete de referencia de diseño para implementar el **rediseño** sobre el repo real
> [`alvarocatalan/wine-catalogue`](https://github.com/alvarocatalan/wine-catalogue).
> Alineado con el stack y el schema **reales** del repo (leídos de `keystatic.config.ts`
> y del README del repo).

## Overview
Catálogo editorial de vinos, **totalmente estático**, contenido versionado en git (sin
backend, sin base de datos, sin storage de navegador). El usuario explora un grid, abre la
ficha de un vino y busca/filtra en la propia página. No es e-commerce.

Este handoff cubre el **rediseño visual** (aspecto y comportamiento) para aplicarlo dentro
de tu entorno Astro existente, reutilizando tus componentes y patrones.

## Stack real (del repo) — implementa aquí
- **Astro 5** (`output: 'static'`) + TypeScript strict.
- **CSS plano con design tokens en custom properties** → `src/styles/global.css`.
  **No hay Tailwind.** Los tokens de este handoff (`design-tokens.css`) están en formato
  custom-property precisamente para que los fusiones en tu `global.css`.
- **Preact island** para búsqueda/filtro **en memoria** sobre un índice JSON generado en
  build (no hay red, no hay storage). **No es Pagefind.**
- **Keystatic** (git-based CMS, `storage: local`, solo en dev) como editor de contenido.
  El schema de Keystatic refleja el Zod de `src/lib/schema.ts` (test de paridad).
- Imágenes optimizadas en build con `astro:assets` (`<Image />` + helper `image()`).
- Deploy a GitHub Pages vía Actions.

### Componentes / rutas reales a tocar
| Archivo repo | Rol | Qué aplicar del rediseño |
|---|---|---|
| `src/layouts/BaseLayout.astro` | layout base | tokens, fuentes (Playfair Display + Helvetica), fondo crema |
| `src/pages/index.astro` | Home / índice | hero burdeos + buscador + `WineGrid` |
| `src/pages/vinos/[slug].astro` | Ficha de detalle | layout a dos columnas + notas de cata |
| `src/components/WineCard.astro` | tarjeta | panel gris + botella + nombre/bodega/D.O./añada |
| `src/components/WineGrid.astro` | grid | `repeat(auto-fill, minmax(240px,1fr))`, gap `36px 28px` |
| `src/components/CatalogueSearch` (Preact island) | búsqueda | input único "casi imperceptible" + estado sin resultados |
| `src/styles/global.css` | tokens | fusionar `design-tokens.css` |

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados e interacciones son finales.
Las botellas del prototipo son **placeholders**; usa la `foto` real (con `fotoAlt`) vía
`astro:assets`.

## ⚠️ Alineación con el SCHEMA real (crítico)
El prototipo se diseñó con más campos de los que hoy existen. Campos **reales** del schema
(`keystatic.config.ts` / `src/lib/schema.ts`):

| Campo real | Tipo | Uso en el rediseño |
|---|---|---|
| `nombre` | slug | Título de tarjeta y de ficha (Playfair) |
| `bodega` | text (req.) | Subtítulo junto al nombre |
| `denominacionOrigen` | text (req.) | D.O. — línea secundaria en tarjeta y fila de datos |
| `anada` | text `^(NV\|\d{4})$` | Añada. **Puede ser "NV"** → mostrar "NV" tal cual, no un año |
| `foto` | image (req.) | Foto de botella (protagonista) |
| `fotoAlt` | text (req.) | `alt` de la imagen |
| `notas` | markdoc | **Notas de cata** (cuerpo) → columna de lectura en la ficha |
| `createdAt` | date | Orden por defecto (más reciente primero), no visible |

**Decisión tomada:** extender el schema con **un solo campo nuevo: `tipo`**.
El resto de campos del brief (`uva`, `pais`, `graduacion`, `precio`, `puntuacion`,
`maridaje`) y el `enlaceBodega` **se descartan** — no se añaden al schema ni aparecen en el
diseño final.

`tipo` habilita el **chip con color-coding** en tarjeta y ficha (el único acento por
categoría). Hay que añadirlo a `src/lib/schema.ts` **y** a `keystatic.config.ts` (el test de
paridad los exige en ambos):

`src/lib/schema.ts`
```ts
tipo: z.enum(['tinto','blanco','rosado','espumoso','dulce','generoso']),
```
Espejo en `keystatic.config.ts`
```ts
tipo: fields.select({
  label: 'Tipo',
  options: [
    { label: 'Tinto', value: 'tinto' },
    { label: 'Blanco', value: 'blanco' },
    { label: 'Rosado', value: 'rosado' },
    { label: 'Espumoso', value: 'espumoso' },
    { label: 'Dulce', value: 'dulce' },
    { label: 'Generoso', value: 'generoso' },
  ],
  defaultValue: 'tinto',
}),
```

### Campos finales del rediseño
`nombre`, `bodega`, `denominacionOrigen` (D.O.), `anada`, **`tipo`** (nuevo), `foto`,
`fotoAlt`, `notas`, `createdAt` (orden, no visible).

## Screens / Views

### 1. Home / Índice (`screenshots/01-home-grid.png`) — `index.astro`
- **Hero** ancho completo, fondo burdeos `#6b2c37`, centrado, padding `84px 40px 64px`.
  - Overline "COLECCIÓN PERSONAL · EST. 2019": 11px, `letter-spacing:.34em`, uppercase,
    color `#d8a9a3`.
  - Título "Catálogo de Vinos": Playfair Display 500, **72px**, line-height 1, color `#f0e4d9`.
  - Subtítulo italic 23px, color `#e6cfc9`.
  - **Buscador** (ver Interactions): campo único casi imperceptible dentro del hero.
- **Sección grid**: contenedor `max-width:1160px`, padding `44px 40px 88px`.
  - Cabecera: fila flex space-between con hairline inferior `1px solid #ded6c6`. Izquierda
    "La colección" (Playfair 26px). Derecha "{n} vinos" (13px, `#8a8172`).
  - **Grid** (`WineGrid`): `grid-template-columns: repeat(auto-fill, minmax(240px,1fr))`,
    `gap: 36px 28px`.

### 2. Tarjeta de vino (`WineCard`)
- Panel botella: `linear-gradient(160deg,#e7e4de,#f1efea)`, `border-radius:16px`,
  padding `34px 20px 28px`; `foto` centrada con sombra elíptica radial debajo.
- Debajo, centrado: `nombre` (Playfair 23px, `#2a2723`), `bodega · anada` (12.5px, `#8a8172`),
  `denominacionOrigen` (12px, `#b3a894`).
- Chip de tipo: punto 7px + texto uppercase 11px `letter-spacing:.14em`, en el color del
  tipo.
- Hover: `transform: translateY(-8px)`, `.38s cubic-bezier(.2,.7,.2,1)`; toda la tarjeta
  enlaza a `/vinos/[slug]/`.

### 3. Ficha de detalle (`screenshots/02-ficha-detalle.png`) — `vinos/[slug].astro`
- Barra superior burdeos `#6b2c37`, padding `22px 40px`, enlace "← Volver al catálogo"
  (13px, `letter-spacing:.1em`, `#e6cfc9`). *(En Astro es un `<a href>` real a `/`.)*
- Cuerpo `max-width:1080px`, `grid-template-columns: 0.85fr 1.15fr`, gap 72px,
  `align-items:start`.
  - Izquierda (imagen): `position:sticky; top:32px`, panel gris `border-radius:20px`,
    padding `64px 40px 48px`, `foto` grande + sombra. En móvil: apilar arriba, sin sticky.
  - Derecha (datos):
    - Chip de tipo (punto 8px + texto uppercase 12px `letter-spacing:.16em`, color del tipo).
    - `nombre`: Playfair 500, **52px**, line-height 1.02, `#2a2723`.
    - `bodega`: Playfair italic 22px, `#8a8172`.
    - Tabla de datos (filas flex space-between separadas por `1px solid #e6dfd1`, padding
      vertical 13px; etiqueta 12px uppercase `letter-spacing:.12em` `#a49a86`; valor 15px
      `#2a2723` a la derecha). Filas: **Bodega, D.O., Añada**.
    - **Notas de cata**: título "Notas de cata" (Playfair 28px). Texto renderizado del
      cuerpo **Markdoc** `notas`: 16px, line-height 1.72, `#4a453d`, `max-width:560px`.
      *(En el prototipo se maquetó como Vista/Nariz/Boca/Conclusión, pero en el repo `notas`
      es Markdown libre: respeta el HTML que genere Markdoc y estílalo con esa tipografía.)*

### 4. Sin resultados (`screenshots/03-sin-resultados.png`) — dentro de `CatalogueSearch`
- Icono ⌕ 34px `#c9b79b`; "Sin resultados" (Playfair 30px); ayuda 15px `#8a8172`,
  `max-width:380px`, con el término resaltado en `#6b2c37`; enlace "Limpiar búsqueda"
  (uppercase 12px `letter-spacing:.18em`, borde inferior burdeos). Cabecera muestra "0 vinos".

## Interactions & Behavior
- **Buscador (campo único, "casi imperceptible")** — dentro del hero, `max-width:400px`,
  centrado. Sin caja: fondo transparente, icono ⌕ y línea inferior
  `1px solid rgba(240,228,217,.28)`; texto y placeholder en `rgba(240,228,217,.4)`;
  placeholder = "Buscar".
  - Implementación real: **island Preact `CatalogueSearch`** que filtra **en memoria** el
    índice JSON generado en build. Un único campo que busca en todos los campos textuales
    (`nombre`, `bodega`, `denominacionOrigen`, `anada`, `tipo`). Sin storage, sin red.
  - El grid inicial es **HTML/CSS puro** (SSR estático). La island solo re-renderiza/oculta
    tarjetas al escribir. Mantén accesible por teclado (input con label accesible).
  Campos indexados: `nombre`, `bodega`, `denominacionOrigen`, `anada`, `tipo`.
- **Navegación**: rutas estáticas reales — `/` (índice) y `/vinos/[slug]/` (ficha).
- **Estados**: resultados / sin resultados. "Cargando" es mínimo (índice ya presente en
  build); si acaso, un placeholder muy breve mientras hidrata la island.
- **Microinteracciones**: hover de tarjeta (−8px, `.38s`), fade-in de vista (`opacity 0→1`,
  `translateY(8px)→0`, `.4s ease`). Respeta `prefers-reduced-motion`.
- **`anada` = "NV"**: mostrar "NV" literal donde iría el año.

## Design Tokens
Ver `design-tokens.css` (custom properties, listo para fusionar en tu `src/styles/global.css`).

### Color
Fondo `#f5f0e7` · superficie `#faf5ee` · burdeos marca `#6b2c37` · texto sobre burdeos
`#f0e4d9` · overline `#d8a9a3` · subtítulo `#e6cfc9` · tinta `#2a2723` · cuerpo notas
`#4a453d` · secundario `#8a8172` · terciario `#b3a894`/`#a49a86` · oro `#8f7a4a` · hairline
`#ded6c6`/`#e6dfd1` · panel botella `#e7e4de → #f1efea`.
Colores por `tipo` (chip): tinto `#6b2c37`, blanco `#9a7d2e`, rosado `#a86b73`,
espumoso `#7d8a5a`, dulce `#9c5f2a`, generoso `#7a4a2a`.

### Tipografía
Display/nombres: **Playfair Display** (400/500/600/700 + italic). Cuerpo/UI:
**Helvetica Neue, Helvetica, Arial, sans-serif**. Escala: hero 72 · nombre ficha 52 ·
sección 26–30 · nombre tarjeta 23 · subtítulos 22–23 · cuerpo/notas 16 · datos 15 ·
meta 12.5–13 · overline/etiquetas 11–12 (uppercase, `letter-spacing` .12–.34em).

### Espaciado (px)
4 · 5 · 7 · 10 · 12 · 14 · 16 · 18 · 22 · 26 · 28 · 34 · 36 · 40 · 44 · 60 · 64 · 72 · 84 · 88.

### Radios
`6px` botellas · `12px` · `16px` tarjeta · `20px` panel ficha · `100px` pills/chips.

### Sombras
Bajo botella `radial-gradient(ellipse, rgba(40,35,28,.22), transparent 70%)`.
Elevación opcional `0 12px 30px -20px rgba(40,35,28,.4)`.

### Layout / breakpoints
Contenedor índice `1160px`, ficha `1080px`. Grid `repeat(auto-fill, minmax(240px,1fr))`,
gap `36px 28px` (mobile-first, colapsa a 1–2 col.). Ficha desktop dos columnas
`0.85fr / 1.15fr` gap 72px; móvil apilada sin sticky.

## Assets
- **Fotos de botella**: placeholders en el prototipo → usar `foto` real (`astro:assets`,
  `<Image />`), botella vertical fondo neutro, con `fotoAlt`.
- **Fuente**: Playfair Display (Google Fonts o self-host para rendimiento/Lighthouse).
- **Iconos**: solo glifos `⌕` y `←`. Sin librería de iconos.

## Files
- `design_files/Catalogo Vinos.dc.html` — prototipo completo (home + ficha + estados).
  Referencia visual; **no** portar a producción.
- `design_files/support.js` — runtime del prototipo (solo para abrirlo en el navegador).
- `design-tokens.css` — tokens como custom properties (fusionar en `global.css`).
- `screenshots/` — 01 home, 02 ficha, 03 sin resultados.

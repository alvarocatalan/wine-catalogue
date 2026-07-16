# Quickstart: Visual Redesign + Wine "Type" Field

This feature adds one content field (`tipo`) and applies the redesign from
`design/redesign-2026/design_handoff_catalogo_vinos/`. Below is how to develop, verify, and
add/edit a wine with the new field.

## Prerequisites

- Node + npm installed; repo dependencies installed (`npm install`).
- Familiarity with the design handoff (README, `design-tokens.css`, screenshots) — the
  authoritative visual source.

## Develop

```bash
npm run dev            # Astro dev server (Keystatic available at /keystatic, dev-only)
```

- Home: `/` — burgundy hero + search + grid.
- Detail: `/vinos/<slug>/`.
- CMS: `/keystatic` — the `Vinos` collection now has a **Tipo** select.

## Add or edit a wine (with `tipo`)

1. Open `/keystatic` → **Vinos** → create/edit.
2. Set **Tipo** (Tinto / Blanco / Rosado / Espumoso / Dulce / Generoso) — required.
3. Fill the other fields (nombre, bodega, D.O., añada, foto + alt, notas) as before.
4. Save → Keystatic writes/updates the `.mdoc` in `src/content/vinos/` and the image in
   `src/assets/vinos/`. Commit the change (git-based CMS).

Editing a `.mdoc` by hand: add `tipo: <value>` to the frontmatter, e.g.

```yaml
---
nombre: Único
bodega: Vega Sicilia
denominacionOrigen: Ribera del Duero DO
anada: "2018"
tipo: tinto
foto: ../../assets/vinos/unico/foto.png
fotoAlt: Botella de Vega Sicilia Único 2018 sobre fondo neutro
createdAt: 2026-07-15
---
```

## Build (static, must fail on missing `tipo`)

```bash
npm run build          # SKIP_KEYSTATIC=true astro build → dist/ (fully static)
```

- The build **fails** if any `.mdoc` lacks a valid `tipo` (required enum, no silent default).
- `npm run preview` serves the built static site.

## Verify

```bash
npm test               # Vitest: schema, schema-parity, content-validate, search, island
npm run test:island    # just the Preact island component tests
npm run test:e2e       # Playwright + axe over the built site (browse, detail, search-filter, a11y)
npm run perf           # Lighthouse CI — expect 100/100/100/100
npm run lint           # astro check + eslint + prettier
npm run verify:static  # asserts no runtime backend leaked into dist/
```

### What to check manually against the design

- Home: burgundy hero, cream background, section header with wine count, grid
  `repeat(auto-fill, minmax(240px,1fr))` gap `36px 28px`.
- Card: bottle panel, name (Playfair), `bodega · añada`, D.O., **colour-coded type label**;
  hover lift (respecting reduced-motion); whole card links to the detail page.
- Detail: two-column layout (sticky image on desktop, stacked on mobile), type label, data
  table (Bodega / D.O. / Añada), tasting notes; "← Volver al catálogo" returns home.
- Search: single input + **Tipo** facet; no-results state with highlighted term + "Limpiar";
  count reflects filtered results.
- `anada: "NV"` renders literally as "NV".

## Scope reminders

- Only `tipo` is added; no other schema fields change.
- Ordering (`createdAt`, newest-first) and content architecture are unchanged.
- No browser storage; no network at view time; Playfair Display is self-hosted.

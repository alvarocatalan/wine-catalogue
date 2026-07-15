# Quickstart: Wine Catalogue

**Feature**: 001-wine-catalogue

An interactive, offline-capable personal wine catalogue that runs entirely in
the browser. **No backend, no database server** — every wine and image is stored
locally on your device in IndexedDB. An Astro static shell hosts a Preact island
that renders the whole app.

## Prerequisites

- Node 20 LTS+
- A wine image file you have sourced yourself (JPEG/PNG/WebP, ≤ 10 MB), per FR-014.

## Install & run

```bash
npm install
npm run dev        # local dev server (island runs client-side)
npm run build      # static build → ./dist (shell + island + service worker)
npm run preview    # serve the production build locally
```

## Use the app (the v1 workflows — all in-app)

- **Add a wine**: click **Add**, fill wine name, winery, designation of origin,
  and vintage (`NV` or a 4-digit year), write an image description, and upload an
  image. The form blocks saving until every field is valid and refuses images
  that are the wrong format or larger than 10 MB. Save → the wine appears in the
  grid. (FR-001, FR-002, FR-003, FR-014)
- **Browse**: the catalogue is a responsive grid of cards (image, wine name,
  winery, vintage). Empty catalogue shows a friendly empty state. (FR-004, FR-016)
- **Detail**: click a card for the large image + all four fields. (FR-005)
- **Search**: type in the always-visible search box; the grid narrows in place,
  matching wine name, winery, designation of origin, or vintage (case-insensitive,
  partial), and shows which field matched. (FR-006, FR-007)
- **Filter**: pick a vintage, designation of origin, or winery; combine with
  search; **Clear** resets everything. (FR-008, FR-009)
- **Edit**: open a wine → Edit → change fields and/or replace the image → save.
  (FR-010)
- **Delete**: open a wine → Delete → confirm. A short **Undo** toast lets you
  reverse it before it is permanently removed. (FR-011)
- **Offline**: after the first load, the app works offline — browse, search, and
  even add wines; your data is already on the device. (FR-012)

## Verify the critical path (matches the e2e test)

1. `npm run build && npm run preview`, open `/`.
2. Add a wine with all four fields + an image → it appears in the grid. (FR-001/004)
3. Open its detail → large image + four fields. (FR-005)
4. Type a search term → results narrow in place; matched field indicated. (FR-006/007)
5. Apply a vintage filter → grid narrows, active filter shown; **Clear** restores. (FR-008/009)
6. Edit a field → change reflected in grid + detail. (FR-010)
7. Delete a wine → confirm → **Undo** restores it; confirm again → it is gone. (FR-011)
8. **Reload the page** → your wines are still there. (FR-012)
9. Search for nonsense / filter to nothing → "no results" state, not a blank page. (FR-016)

## Tests

```bash
npm run test            # Vitest: vintage, schema, search/compose, image, db repo (fake-indexeddb)
npm run test:e2e        # Playwright: full CRUD + search/filter + reload-persist + axe a11y
npm run lint            # astro check + eslint + prettier
npm run perf            # Lighthouse CI against a ~1,000-entry seeded build (budgets)
```

## Project layout (high level)

```
src/
├── components/island/   # Preact app: App, WineGrid, WineCard, WineDetail,
│                        #   WineForm, ImageUpload, SearchBox, Filters,
│                        #   DeleteToast, EmptyState, Placeholder
├── lib/                 # db (IndexedDB repo), schema (Zod), vintage, image, search
├── layouts/             # BaseLayout.astro (shell + PWA registration)
├── pages/               # index.astro (mounts the island)
└── styles/              # Tailwind entry + design tokens
public/                  # placeholder.svg, manifest.webmanifest
tests/                   # unit + integration + e2e
```

# Contract: UI Surface (public static site + Keystatic authoring)

**Feature**: 001-wine-catalogue | **Type**: routes + search/filter + CMS contracts

> **Re-architected 2026-07-15** for Constitution v1.1.0: the public product is a
> **statically generated site** (catalogue grid + per-wine detail pages) with a
> small client **search/filter island**; authoring is the dev-only **Keystatic**
> panel. Replaces the former device-local Preact SPA contract.

## Public routes (static, prerendered)

| Route | Renders | Requirements |
|---|---|---|
| `/` | `BaseLayout` + `WineGrid` (server-rendered cards) + mounted `CatalogueSearch` island; registers the service worker; empty state when no entries. | FR-004, FR-006, FR-008, FR-015, FR-016, FR-017 |
| `/vinos/[slug]` | Per-wine detail: full optimised `<Image/>` (or placeholder), all four fields, rendered `notas`. Statically generated via `getStaticPaths()` over `vinos`. | FR-005, FR-013, FR-020, FR-022 |

Visitors are **read-only** and unauthenticated (FR-019). There is **no server
runtime** in production (Constitution V).

## Authoring route (dev-only)

| Route | Renders | Requirements |
|---|---|---|
| `/keystatic`, `/api/keystatic` | Keystatic admin UI (React) + local-mode file API. Present **only under `astro dev`** (conditional integration + Node adapter). Absent from the production static build. | FR-018, FR-019 |

## Card contract (`WineCard.astro`)

Each card MUST display, in consistent layout/spacing: optimised `foto` thumbnail
(or placeholder, FR-013), `nombre`, `bodega`, `anada`. Cards carry `data-*`
attributes (`data-nombre`, `data-bodega`, `data-do`, `data-anada`) for in-memory
filtering. Activating a card (click/Enter) navigates to `/vinos/[slug]`.
Future-`anada` entries carry a visible "suspicious" marker (edge case).

## Search island (`CatalogueSearch.tsx`, `@preact/signals`) + `src/lib/search.ts`

- Input: free-text query from the always-visible search box.
- Behaviour: case-insensitive, partial match across `nombre`, `bodega`,
  `denominacionOrigen`, `anada` (FR-007); toggles card visibility **in place**,
  debounced, as the user types (FR-006).
- Output: for each visible result, **which field(s) matched** are surfaced
  (FR-007 / "Rioja matches DO and bodega" edge case).
- **No storage**: the island holds `{ query, activeFilters }` in signals only —
  transient, never persisted (Constitution VI). It filters over the build-time
  text index; it never fetches or writes content.

## Filters

- Facets built at build/in memory: distinct `anada`, `denominacionOrigen`, `bodega`.
- Selecting a facet narrows the grid and **clearly indicates the active filter**
  (FR-008).
- Filters compose with search: **displayed = filterSet ∩ searchResults** (FR-008).
- A single **"Clear"** resets all filters + the search term (FR-009).

## Empty / no-results states (FR-016)

- **Catalogue empty** (no entries at build): friendly empty state; since authoring
  is via `/keystatic` in dev, it points the admin there.
- **Search/filter yields nothing**: explicit "no results" message replacing the
  grid, not a blank area.

## Keystatic authoring contract (dev-only)

- **Create/Edit**: interactive form with the seven fields; **image upload** via
  file picker or drag-and-drop into `fields.image` (writes to `src/assets/vinos/`),
  refusing non-JPEG/PNG/WebP or > 10 MB with a clear message (FR-014). Save writes
  the `.mdoc` + image to the working tree for the admin to commit (FR-018).
- **Delete**: confirmation step; the removal is a commit — recovery via git
  history, no in-session undo (FR-011, Clarification Q3=B).
- **Publish**: committing (and pushing) triggers the static rebuild/redeploy
  (FR-020).

## Accessibility contract (Principle III)

- Keyboard operable: search box, filters, Clear, card links, and detail-page
  content — all reachable with visible focus order.
- `aria-live` announces result/empty/no-results changes as the grid filters.
- **Every image has a non-empty `alt`** from `fotoAlt` (FR-021).
- Colour contrast meets WCAG 2.1 AA against the minimalist palette; verified by
  axe in e2e before merge.

## Performance contract (Principle IV)

- Public island JS ≤ 20 KB gzip (research Decision 11).
- Cards use build-optimised responsive WebP (`astro:assets`), lazy-loaded below
  the fold.
- Search/filter interaction → repainted results ≤ 100 ms over a 1,000-entry index.
- Catalogue LCP ≤ 2.0 s on throttled "Slow 4G" / mid-tier mobile (SC-003).

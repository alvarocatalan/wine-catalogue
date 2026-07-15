# Contract: UI Surface & Interactive Island

**Feature**: 001-wine-catalogue | **Type**: UI / island view contracts

> **Re-architected 2026-07-15**: the app is a **Preact island** on a static
> Astro shell, doing client-side view routing over device-local data. Replaces
> the former static-pages + Pagefind contract.

## Shell & mount

| Route | Renders | Requirements |
|---|---|---|
| `/` | Astro shell (`BaseLayout`) mounts `<App client:only="preact" />`; registers the service worker. | FR-015, offline |

There are **no per-entry server routes** — entries live only in the user's
IndexedDB. The island routes between views client-side (History API for
in-session deep links).

## Island views

| View | Shows | Requirements |
|---|---|---|
| **Grid** (default) | Virtualised responsive grid of cards (lazy `thumb`, `wineName`, `winery`, `vintage`; visible future-vintage marker); always-visible search + filters; empty state when no entries. | FR-004, FR-006, FR-008, FR-015, FR-016, FR-017 |
| **Detail** | `full` image (or placeholder) + all four fields; Edit + Delete actions. | FR-005, FR-013 |
| **Add / Edit form** | Fields for the four attributes + `imageAlt` + image upload; inline validation. | FR-001, FR-002, FR-003, FR-010, FR-014 |

### Card contract

Each card MUST display, in consistent layout/spacing: `thumb` (or placeholder),
`wineName`, `winery`, `vintage`. Activating a card (click/Enter) opens Detail.
Future-vintage entries carry a visible "suspicious" marker.

### Add / Edit form contract (FR-001, FR-002, FR-003, FR-010, FR-014)

- **Blocks save** until all four fields + `imageAlt` are valid; invalid fields
  show an inline message naming what is missing/wrong (FR-002).
- `vintage` accepts `NV` or a 4-digit year (FR-003); future years are accepted
  but flagged.
- **Image upload**: `<input type="file" accept="image/jpeg,image/png,image/webp">`;
  rejects unsupported types or files > 10 MB with a clear message stating the
  accepted formats + limit; shows a resized preview before save (FR-014).
- On **create** an image is required; on **edit** the existing image is retained
  unless replaced (FR-010).
- Saving a record whose `vintage`+`winery`+`wineName` duplicates an existing one
  shows a **non-blocking** warning and still allows the save (duplicate edge case).

### Delete + Undo contract (FR-011)

- Delete opens an accessible **confirm dialog** (focus-trapped, Esc cancels).
- On confirm, the card disappears and a **toast with "Undo"** shows for ~7 s.
- IndexedDB purge commits only when the toast expires; **Undo** restores the
  record + image.

### Empty / no-results states (FR-016)

- **Catalogue empty**: friendly empty state inviting the user to add their first
  wine (button opens the Add form).
- **Search/filter yields nothing**: explicit "no results" message replacing the
  grid, not a blank area.

## Search (in-memory) — `src/lib/search.ts`

- Input: free-text query from the always-visible search box.
- Behaviour: case-insensitive, partial match across `wineName`, `winery`,
  `designationOfOrigin`, `vintage` (FR-007); updates the grid **in place**,
  debounced, as the user types (FR-006).
- Output: matching records **plus which field(s) matched**, surfaced on each
  result (FR-007 / "Rioja matches DO and winery" edge case).

## Filters — `src/components/island/Filters.tsx`

- Facets derived in memory: distinct `vintage`, `designationOfOrigin`, `winery`.
- Selecting a facet narrows the grid and **clearly indicates the active filter**
  (FR-008).
- Filters compose with search: **displayed = filterSet ∩ searchResults** (FR-008).
- A single **"Clear"** resets all filters + the search term (FR-009).

## Composition & state

The island holds `{ query, activeFilters, currentView }` in signals. On any
change it recomputes the visible set (intersection of search + filters) and
re-renders the grid (or the empty/no-results view). View state is transient;
the catalogue data in IndexedDB persists across reloads (FR-012).

## Accessibility contract (Principle III)

- Keyboard operable: search, filters, Clear, card links, form fields, upload,
  confirm dialog, and toast Undo — all reachable with visible focus order.
- Focus is moved and managed on view changes (grid⇄detail⇄form) and when the
  confirm dialog opens/closes.
- All images have non-empty `imageAlt`.
- Result/empty/no-results changes and toasts announced via `aria-live` regions.
- Colour contrast meets WCAG 2.1 AA against the minimalist palette.

## Performance contract (Principle IV)

- App island JS ≤ 60 KB gzip (research Decision 10).
- Grid is windowed with lazy `thumb` Blobs so only visible cards mount (FR-017).
- Search/filter interaction → painted results ≤ 100 ms over a 1,000-entry
  in-memory dataset.
- Catalogue LCP ≤ 2.0 s on throttled "Slow 4G" / mid-tier mobile (SC-003).

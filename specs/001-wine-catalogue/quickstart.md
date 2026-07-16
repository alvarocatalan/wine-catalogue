# Quickstart: Wine Catalogue

**Feature**: 001-wine-catalogue

A minimalist wine catalogue **published as a fully static site**. Content and
images are **version-controlled files in git**; a single administrator authors
wines with the **Keystatic** git-based CMS (`/keystatic`) in local development.
**No backend, no database, no browser storage** (Constitution v1.1.0).

## Prerequisites

- Node 20 LTS+
- Git configured with the administrator's GitHub identity (commits carry it).
- A wine image you have sourced yourself (JPEG/PNG/WebP, ≤ 10 MB), per FR-014.

## Install & run

```bash
npm install
npm run dev        # astro dev — includes the Keystatic panel at /keystatic (dev only)
npm run build      # static build → ./dist  (public site only; NO server output)
npm run preview    # serve the production static build locally
```

## Author content (administrator, in local dev)

1. `npm run dev`, open **`/keystatic`**.
2. **Vinos → Create**. Fill `nombre`, `bodega`, `denominación de origen`, `añada`
   (`NV` or a 4-digit year), upload `foto` (drag-and-drop or file picker; refused
   if not JPEG/PNG/WebP or > 10 MB), write `fotoAlt`, and optionally `notas`.
   (FR-001, FR-002, FR-003, FR-014, FR-021, FR-022)
3. Save → Keystatic writes `src/content/vinos/<slug>.mdoc` and the image under
   `src/assets/vinos/`.
4. **Commit and push** those files — that is the publish step; the static site
   rebuilds/redeploys from the commit. (FR-012, FR-018, FR-020)
5. **Edit**: open the wine in Keystatic, change fields (or replace the image),
   save, then commit and push. The change is reflected on the site after the
   rebuild/redeploy. `createdAt` is preserved (the catalogue order stays stable).
   (FR-010, FR-025)
6. **Delete**: open the wine in Keystatic → delete → confirm. The removal is a
   commit. There is **no in-app undo**. (FR-011)

### Recovering a deleted (or wrongly edited) wine — git procedure (FR-011)

Recovery is via git history, not an in-app undo. The content lives in the repo,
so any past state is restorable:

- **Undo a not-yet-pushed delete/edit** (working tree): restore the files from
  the last commit —
  `git checkout HEAD -- src/content/vinos/<slug>.mdoc src/assets/vinos/<slug>`
- **Undo an already-pushed delete/edit**: revert the offending commit —
  `git revert <sha>` (then push). The wine reappears on the next redeploy.
- Find the commit with `git log -- src/content/vinos/<slug>.mdoc`.

Verified: deleting the fixture and rebuilding removes it from the site (empty
state, no `/vinos/<slug>`); `git checkout HEAD -- …` + rebuild brings it back
(card + detail page).

> **Orphaned images (out of scope for v1, conscious decision):** deleting a wine
> in Keystatic removes its `.mdoc`; the co-located image folder
> `src/assets/vinos/<slug>/` is **removed manually** (`git rm -r` it in the same
> commit). No automatic cleanup in v1. (Assumptions)

## Browse (public, static)

- **Catalogue** (`/`): responsive grid of cards (image, nombre, bodega, añada);
  friendly empty state when there are none. (FR-004, FR-016)
- **Detail** (`/vinos/<slug>`): large optimised image + all fields + notas. (FR-005)
- **Search**: type in the always-visible box; the grid narrows in place across
  nombre/bodega/D.O./añada (case-insensitive, partial), showing which field
  matched. (FR-006, FR-007)
- **Filter**: pick an añada, D.O., or bodega; combine with search; **Clear**
  resets everything. (FR-008, FR-009)
- **Online only**: the catalogue is consulted online; offline viewing is out of
  scope for v1 (no PWA/precache). Authoring requires connectivity. (FR-012)

## Verify the critical path (matches the e2e test — runs against the built site)

1. Author 1–2 wines via `/keystatic`, commit; `npm run build && npm run preview`.
2. Open `/` → each wine appears as a card. (FR-004)
3. Open a card → `/vinos/<slug>` detail with the large image, all fields, notas. (FR-005/022)
4. Type a search term → grid narrows in place; matched field indicated. (FR-006/007)
5. Apply an añada filter → grid narrows, active filter shown; **Clear** restores. (FR-008/009)
6. Search for nonsense → "no results" state, not a blank page. (FR-016)
7. Confirm the built `./dist` is **static only** (no server entry / adapter output). (Constitution V)
8. Grep the build for `indexedDB|localStorage|sessionStorage` → **no matches**. (Constitution VI)

## Tests

```bash
npm run test            # Vitest: vintage, Zod schema, search/compose, schema-parity (Keystatic↔Zod)
npm run test:island     # @testing-library/preact: CatalogueSearch island
npm run test:e2e        # Playwright + axe: browse + search/filter + detail + empty (built site)
npm run lint            # astro check + eslint + prettier
npm run perf            # Lighthouse CI against a ~1,000-entry fixture build (budgets)
```

## Project layout (high level)

```
src/
├── content.config.ts     # `vinos` collection: glob(.mdoc) loader + Zod schema (image())
├── content/vinos/        # .mdoc entries (versioned in git; written by Keystatic)
├── assets/vinos/         # co-located images (versioned in git; optimised by astro:assets)
├── lib/                  # schema (Zod, single source), vintage, search (pure)
├── components/           # WineCard/WineGrid (.astro), CatalogueSearch (Preact island), EmptyState, Placeholder
├── layouts/              # BaseLayout.astro (shell)
├── pages/                # index.astro, vinos/[slug].astro (getStaticPaths)
└── styles/               # global.css — plain CSS design tokens (no Tailwind; discarded for v1)
keystatic.config.ts       # Keystatic schema (mirrors src/lib/schema.ts), storage: local
astro.config.mjs          # output: 'static'; markdoc always; react()+keystatic()+node adapter DEV-ONLY
public/                   # placeholder.svg
tests/                    # unit + island + e2e
```

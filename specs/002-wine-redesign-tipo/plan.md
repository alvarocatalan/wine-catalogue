# Implementation Plan: Visual Redesign + Wine "Type" Field

**Branch**: `002-wine-redesign-tipo` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-wine-redesign-tipo/spec.md`

## Summary

Extend the existing static Astro wine catalogue with a single new mandatory content
field — `tipo` (enum: tinto | blanco | rosado | espumoso | dulce | generoso) — and apply
the high-fidelity redesign from `design/redesign-2026/design_handoff_catalogo_vinos/`.
The `tipo` field drives a colour-coded label on the card and detail page and a new filter
facet in the existing in-memory Preact search island. The visual work merges the handoff's
design tokens into `src/styles/global.css` and restyles `BaseLayout`, `index.astro`,
`vinos/[slug].astro`, `WineCard`, `WineGrid`, and `EmptyState` to match the screenshots,
with Playfair Display self-hosted to protect the performance budget. All existing content
fields, the `createdAt` ordering, and the content architecture are untouched. Output stays
100% static, no browser storage, Lighthouse 100/100/100/100.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict); Astro 5.18 (`output: 'static'`)

**Primary Dependencies**: Astro 5, `astro:content` + `astro:assets` (`<Image />`, `image()`),
`@astrojs/markdoc`, Preact 10 + `@preact/signals` (search island), Zod 3, Keystatic
(`@keystatic/core` + `@keystatic/astro`, `storage: local`, **dev-only** via `SKIP_KEYSTATIC`).

**Storage**: Version-controlled files in git only. Content = `.mdoc` entries in
`src/content/vinos/`; images co-located in `src/assets/vinos/`. **No** database, **no**
IndexedDB / localStorage / sessionStorage (Principle VI). Search runs in-memory over a
build-time JSON index embedded in the page.

**Testing**: Vitest (unit + `@testing-library/preact` component), Playwright + `@axe-core/playwright`
(e2e + a11y), Lighthouse CI (`lhci`). TDD per Principle II.

**Target Platform**: Static site deployed to GitHub Pages via Actions; modern evergreen browsers,
mobile-first responsive.

**Project Type**: Single static web project (Astro). Existing structure reused; no new project.

**Performance Goals**: Lighthouse 100/100/100/100 (perf, a11y, best-practices, SEO). Search
island JS **< 20 KB gzipped**. Fonts self-hosted (WOFF2 subsets) + preloaded; images optimised
at build via `astro:assets`. Interactive filtering feels instantaneous (<100 ms, in-memory).

**Constraints**: 100% static (no runtime backend, no network at view time), no browser storage,
WCAG 2.1 AA (keyboard, contrast, focus, labels), `prefers-reduced-motion` respected. Build MUST
fail if any wine lacks a valid `tipo` (no silent default).

**Scale/Scope**: Personal catalogue — currently 1 wine (`unico.mdoc`), designed for tens of
wines. Scope: 1 new field + backfill, token system + 6 component/page restyles, 1 new search
facet, updated tests. No change to other fields, ordering, or content architecture.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan satisfies it |
|---|-----------|--------|----------------------------|
| I | Code Quality | ✅ PASS | New logic (`tipo` in `search.ts`) stays pure/typed; enum sourced from one canonical constant reused by schema, Keystatic mirror, search, and label component (no duplication). Lint/format/`astro check` gate unchanged. |
| II | Testing (NON-NEGOTIABLE) | ✅ PASS | TDD: update `schema-parity`, `content-validate`, `search`, `catalogue-search` (island), and e2e (`browse`, `detail`, `search-filter`, `a11y`) tests **first** (red), then implement. New tests cover the `tipo` enum, missing-`tipo` build failure, type facet in index, and the redesigned states. |
| III | UX Consistency | ✅ PASS | Single design-token system in `global.css` drives all surfaces; type label + colour-per-type documented as a reusable contract with verified WCAG AA contrast; focus/keyboard/`prefers-reduced-motion` verified by axe + Lighthouse a11y = 100. |
| IV | Performance | ✅ PASS | Declared budget: island < 20 KB gz, Lighthouse 100 perf. Playfair self-hosted WOFF2 subset + preload (no third-party font request); images stay build-optimised; island still re-renders no cards (imperative show/hide) so `<Image/>` output is untouched. |
| V | Static Generation (NON-NEGOTIABLE) | ✅ PASS | `output: 'static'` unchanged; Keystatic stays dev-only (`SKIP_KEYSTATIC`); all routes pre-generated; `tipo` filtering is client-side over an embedded JSON index — no backend. |
| VI | Versioned Content in Git (NON-NEGOTIABLE) | ✅ PASS | `tipo` persisted as a frontmatter field in each `.mdoc`; backfill is a committed content change. No browser storage introduced (guarded by `no-storage` test + `check-no-storage.mjs`). |
| VII | Git-based CMS, No Runtime Backend (NON-NEGOTIABLE) | ✅ PASS | `tipo` added to Keystatic as `fields.select`, edited in `/keystatic` (dev), written as a commit. Keystatic `defaultValue` only pre-fills the authoring form; it never patches existing `.mdoc` at build, so the required-enum build failure stands. |

**Result**: PASS — no violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-wine-redesign-tipo/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── wine-schema.md        # Content field contract (adds `tipo`)
│   ├── type-taxonomy.md      # The 6 types, colours, WCAG AA contrast, labels
│   └── search-index.md       # Build-time index shape + `tipo` facet contract
├── checklists/
│   └── requirements.md   # Created by /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

Existing single-project Astro layout — files touched by this feature:

```text
src/
├── lib/
│   ├── schema.ts             # ADD `tipo` z.enum to wineFrontmatter + WINE_FIELDS; export TIPOS + TipoValue
│   └── search.ts             # ADD `tipo` to WineIndexEntry, text FIELDS, Filters, passesFilters, facets
├── content.config.ts         # (no change — inherits wineFrontmatter; `foto` via image())
├── content/vinos/
│   └── unico.mdoc            # BACKFILL: add `tipo: tinto`
├── components/
│   ├── WineCard.astro         # Redesign: bottle panel + colour-coded type label; add data-tipo
│   ├── WineGrid.astro         # Redesign: auto-fill minmax(240px,1fr), gap 36px 28px
│   ├── CatalogueSearch.tsx    # ADD type facet <select>; keep single-input + no-results
│   ├── EmptyState.astro       # Restyle to token system
│   └── TypeLabel.astro        # NEW: reusable colour-coded type chip (card + detail)
├── layouts/
│   └── BaseLayout.astro       # Self-hosted Playfair @font-face + preload; cream bg; tokens
├── pages/
│   ├── index.astro            # Redesign: burgundy hero + search; ADD `tipo` to searchIndex
│   └── vinos/[slug].astro     # Redesign: two-column layout, type label, data table, notas
└── styles/
    └── global.css             # MERGE design-tokens.css; restyle all surfaces

public/
└── fonts/                     # NEW: self-hosted Playfair Display WOFF2 subsets

tests/
├── unit/schema-parity.test.ts     # `tipo` present in both schemas (already generic — verify)
├── unit/content-validate.test.ts  # missing/invalid `tipo` rejected; valid enum accepted
├── unit/search.test.ts            # `tipo` text match + facet filter + facets()
├── component/catalogue-search.test.tsx  # type facet select behaviour
└── e2e/
    ├── browse.spec.ts          # type label rendered on card
    ├── detail.spec.ts          # type label + data table on detail
    ├── search-filter.spec.ts   # filter by type facet
    └── a11y.spec.ts            # axe over redesigned home + detail + no-results
```

**Structure Decision**: Reuse the existing single-project Astro structure. The only new
source files are `src/components/TypeLabel.astro` (shared type chip) and self-hosted font
assets under `public/fonts/`. Everything else is an in-place edit. `content.config.ts` needs
no change because it spreads `wineFrontmatter`, so adding `tipo` there propagates automatically.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally empty.

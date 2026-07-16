# Implementation Plan: Wine Catalogue

**Branch**: `001-wine-catalogue` | **Date**: 2026-07-15 (re-architected for Constitution v1.1.0) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-wine-catalogue/spec.md`

> **Re-architecture note (2026-07-15)**: This plan **replaces** the earlier
> device-local / IndexedDB "interactive web app" plan. The spec was clarified
> (Session 2026-07-15) and the constitution amended to **v1.1.0**, which makes
> three principles NON-NEGOTIABLE: static generation & deployment, all content
> (including images) as **version-controlled files in git**, and a **git-based
> CMS** with **no runtime backend**. See [research.md](./research.md) for the
> superseding decisions.

## Summary

A minimalist, publicly-readable wine catalogue published as a **fully static
site**. A single **administrator** authors each wine — vintage (añada),
designation of origin, winery (bodega), wine name (nombre), an image with alt
text, and optional notes — through the **Keystatic** git-based CMS panel at
`/keystatic`, used **only in local development**. Keystatic (in **local mode**)
writes each entry as a `.mdoc` file under `src/content/vinos/` and its image
under `src/assets/vinos/`, both **committed to git**. `astro build` produces a
static site: the catalogue grid, per-wine detail pages, and build-optimised
images. Visitors browse, and **search/filter in memory** on the client (no
storage). There is **no runtime backend** and **no browser storage**
(IndexedDB / localStorage / sessionStorage) is used for content.

**Technical approach**: **Astro 5** with default `output: 'static'`. Content is
a **Content Layer** collection (`vinos`) loaded from `.mdoc` files, validated by
a **Zod** schema whose `image()` helper resolves the co-located image so
`astro:assets` `<Image />` optimises it at build. **Keystatic** (`@keystatic/core`
+ `@keystatic/astro`, `storage: { kind: 'local' }`) provides the authoring UI;
its `keystatic.config.ts` schema mirrors the Zod schema field-for-field. Because
Keystatic injects two on-demand routes (`/keystatic`, `/api/keystatic`,
`prerender: false`), it needs `@astrojs/react` and a Node adapter — these are
wired **conditionally, dev-only**, so the production build stays static with no
server output. `@astrojs/markdoc` is always present to render `.mdoc` bodies
(notas). Search/filter is a small client island over a build-time text index.
Styling is **plain CSS with custom-property tokens** (`global.css`) — Tailwind was
evaluated and **discarded for v1** (small UI surface; plain CSS already meets
FR-015 + WCAG AA; integration cost unjustified at this scale). The catalogue is consulted
**online** — no service worker / PWA (offline viewing out of scope for v1).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`); Node 20 LTS for build/test/dev toolchain.

**Primary Dependencies**: Astro 5.x (`output: 'static'`), `@astrojs/markdoc` (always), Content Layer + `astro:assets`; `@keystatic/core` + `@keystatic/astro` (local mode) with `@astrojs/react` + `@astrojs/node` (**dev-only**, for the `/keystatic` panel); `@astrojs/preact` + `@preact/signals` (small public search/filter island); **plain CSS with custom-property tokens** (`src/styles/global.css`) — Tailwind discarded for v1; `zod` (single shared schema). No PWA/service worker (offline out of scope for v1).

**Storage**: **Git repository** — `.mdoc` entries in `src/content/vinos/`, images in `src/assets/vinos/`, versioned as files. **No database, no runtime server, and NO IndexedDB / localStorage / sessionStorage** (Constitution VI). Client search state is ephemeral in-memory only.

**Testing**: Vitest (unit) for pure logic (vintage validator, search/filter/field-match, Zod schema, **schema-parity test** Keystatic↔Zod); `@testing-library/preact` for the search island; Playwright + `axe-core` (e2e + a11y over the built static site); `astro check` + content-collection schema validation (build-time content gate); Lighthouse CI (performance budgets).

**Target Platform**: **GitHub Pages**, deployed via a **GitHub Actions** workflow (`.github/workflows/deploy.yml`) on push to `main` (no server runtime). Modern desktop + mobile browsers; online consultation only — **no PWA / offline in v1**. The `/keystatic` authoring panel runs only under `astro dev` on the administrator's machine.

**Project Type**: Static site (content-driven) with a git-based CMS for authoring — single Astro project at the repo root.

**Performance Goals**: Catalogue first screen LCP ≤ 2.0 s on throttled "Slow 4G" / mid-tier mobile (SC-003); search/filter interaction → results ≤ 100 ms over ~1,000 entries (SC-002); public island JS ≤ 20 KB gzip; per-wine images served as build-optimised, responsive WebP via `<Image />`.

**Version ceiling (HARD CONSTRAINT, not a preference)**: Astro **MUST stay on 5.x**. `@keystatic/astro` only supports Astro **2–5**; **Astro 6 breaks the Keystatic admin panel** with React-hooks errors (Thinkmill/keystatic issue **#1515**, open). Do **NOT** upgrade to Astro 6/7 until Keystatic officially supports it — even though npm's default `astro` is newer. Pinned: `astro@^5` (verified: 5.18.2), `zod@^3` (matches `astro:content`), `@astrojs/markdoc@^0.15`.

**Constraints**: Public site MUST be static, no runtime backend (Constitution V, VII; FR-018/019/020); content + images MUST be versioned files in git, no browser storage as system of record (Constitution VI; FR-012); authoring via Keystatic local mode only, admin authenticated by local environment + GitHub push credentials (FR-019); deployed to GitHub Pages via GitHub Actions on push to `main`, production build gated by `SKIP_KEYSTATIC=true` so `/keystatic` is excluded (FR-020, FR-023); per-image ≤ 10 MB, formats JPEG/PNG/WebP enforced by a **build gate** (Keystatic's `fields.image` cannot validate format/size — only presence) (FR-014); alt text required (FR-021); 1,000-entry scale without visible slowdown (FR-017); authoring requires connectivity; **offline viewing out of scope for v1** — no PWA/precache (Clarifications).

**Scale/Scope**: ~1,000 wine entries (FR-017). Public routes: catalogue grid (`/`), per-wine detail (`/vinos/[slug]`), plus empty/no-results states. Authoring surface: the Keystatic panel (dev-only).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Gates derived from the **seven** principles in `constitution.md` **v1.1.0**.

### I. Code Quality — PASS
- TypeScript `strict`; ESLint + Prettier + `astro check` in CI; no merge bypassing checks.
- **One shared Zod schema** (`src/lib/schema.ts`) is the single data contract, reused by the content collection and asserted (schema-parity test) against `keystatic.config.ts`. Pure logic (vintage, search) isolated in `src/lib/` and single-responsibility.

### II. Testing Standards (NON-NEGOTIABLE) — PASS
- TDD for runtime logic (vintage NV/YYYY validator, search/filter/compose/field-match, schema parity): tests first, red, then green.
- Unit for logic + schema; component tests for the search island; e2e (Playwright) over the **built static site** for browse → search → filter → clear → detail, empty and no-results states; content-schema validation fails the build on bad frontmatter.
- "Data-integrity" 100% branch rule = Zod schema + vintage validator + schema-parity check, exhaustively tested; 80% line gate elsewhere.

### III. User Experience Consistency — PASS
- Single design system via centralised CSS custom-property tokens (`global.css`); consistent card/detail components.
- Documented empty, no-results, and image-failure (placeholder, FR-013) states.
- WCAG 2.1 AA verified pre-merge (axe in e2e): **alt text is a required field** (`fotoAlt`, FR-021), keyboard-operable search/filter, focus order, `aria-live` on the filtered grid.

### IV. Performance Requirements — PASS
- Static prerendered pages + build-optimised responsive images (`astro:assets`) + a ≤ 20 KB island → budgets asserted by Lighthouse CI; >5% regression blocks merge.
- In-memory filter over a text-only index keeps interaction < 100 ms at 1,000 entries; measured under throttled/mid-tier conditions with a ~1,000-entry fixture.

### V. Static Generation & Deployment (NON-NEGOTIABLE) — PASS
- Production `astro build` uses `output: 'static'`; the public catalogue, detail pages, and images are pre-generated files servable by any static host/CDN.
- Keystatic's on-demand routes and the Node adapter are added **only in dev** (see research Decision 2), so the deployed artifact has **no server runtime**. No content is rendered or served on demand in production (FR-020).

### VI. Versioned Content in Git (NON-NEGOTIABLE) — PASS
- Every wine is a `.mdoc` file (`src/content/vinos/`) and every image a file (`src/assets/vinos/`), committed to git — auditable, reviewable, revertible (FR-011 recovery via git history).
- **No IndexedDB / localStorage / sessionStorage** anywhere as the system of record; the client search island keeps only transient filter state in memory (FR-012). A lint/grep guard in CI forbids those APIs.

### VII. Git-Based Content Management, No Runtime Backend (NON-NEGOTIABLE) — PASS
- Authoring is exclusively through the **Keystatic** git-based CMS in local mode; each create/edit/delete becomes a **commit** (FR-018). The administrator authenticates via their GitHub identity (FR-019).
- There is **no always-on service** that owns or mutates content; the `/keystatic` panel is a local development tool, not a deployed backend.

### Additional Constraints
- **Security/dependency hygiene**: dependency scanning in CI; new deps justified; public repo, admin-only authoring, public read-only (FR-019); no secrets committed. **PASS.**
- **Documentation/ADRs**: spec + research + this re-architecture ADR. **PASS.**
- **Observability**: the "service-level operation MUST emit structured logs with a correlation ID" clause is **Not Applicable** — there is no server runtime. See Complexity Tracking.

**Gate result**: PASS (one documented, justified N/A). No unjustified violations. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/001-wine-catalogue/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 — decisions (re-architected 2026-07-15)
├── data-model.md        # Phase 1 — Wine entry (.mdoc + frontmatter) model
├── quickstart.md        # Phase 1 — install, author via /keystatic, build, verify
├── contracts/           # Phase 1 — data + CMS + UI contracts
│   ├── wine-schema.md    #   shared Zod schema + Keystatic config parity contract
│   └── ui-contracts.md   #   public routes + search/filter/detail/state contracts
├── checklists/
│   └── requirements.md   # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks — regenerate; currently stale)
```

### Source Code (repository root)

Single Astro project rooted at the repository:

```text
src/
├── content.config.ts               # Astro 5 Content Layer: `vinos` glob(.mdoc) loader + Zod schema (image())
├── content/
│   └── vinos/                       # .mdoc entries (one per wine) — written by Keystatic, versioned in git
├── assets/
│   └── vinos/                       # co-located wine images — written by Keystatic, versioned in git
├── lib/
│   ├── schema.ts                    # SINGLE shared Zod schema (nombre, bodega, denominacionOrigen, anada, foto, fotoAlt, notas)
│   ├── vintage.ts                   # NV / YYYY validator + future-vintage flag
│   └── search.ts                    # pure in-memory search + filter + compose + field-match
├── components/
│   ├── WineCard.astro               # card: optimised <Image/>, nombre, bodega, anada; data-* for filtering
│   ├── WineGrid.astro               # grid of cards + mounts the search island
│   ├── CatalogueSearch.tsx          # Preact island: search box + facets, filters cards in memory (signals)
│   ├── EmptyState.astro             # empty + no-results states (FR-016)
│   └── Placeholder.astro            # image-failure fallback (FR-013)
├── layouts/
│   └── BaseLayout.astro             # shell: head, tokens
├── pages/
│   ├── index.astro                  # catalogue grid (static)
│   └── vinos/
│       └── [slug].astro             # per-wine detail page (getStaticPaths from `vinos`)
└── styles/
    └── global.css                   # design tokens (CSS custom properties) — plain CSS, no Tailwind

public/
└── placeholder.svg                  # shared image-failure asset

tests/
├── unit/                            # vintage, schema, search/compose, schema-parity (Keystatic↔Zod)
├── component/                       # CatalogueSearch island (@testing-library/preact)
└── e2e/                             # Playwright over built site: browse + search/filter + detail + empty + axe

keystatic.config.ts                  # Keystatic schema (mirrors src/lib/schema.ts) — storage: local
astro.config.mjs                     # output: 'static'; markdoc always; react()+keystatic()+node adapter gated by SKIP_KEYSTATIC (dev-only); site+base for GitHub Pages
vitest.config.ts                     # jsdom for the island; node for lib
playwright.config.ts                 # runs against the built static preview
lighthouserc.json                    # performance budgets

.github/
└── workflows/
    └── deploy.yml                   # GitHub Actions: build (SKIP_KEYSTATIC=true) + deploy to GitHub Pages on push to main (FR-020)
```

**Structure Decision**: Single Astro project at the repo root. Content and its
images live **inside `src/`** as versioned files so `astro:assets` optimises
them at build. The interactive surface shrinks to **one small Preact island**
(search/filter) enhancing server-rendered cards; per-wine detail pages are
**statically generated** via `getStaticPaths`. Keystatic is the authoring tool,
wired dev-only. There is no backend, so no `backend/`+`frontend/` split.

## Complexity Tracking

Only one constitutional clause is not met in full; recorded here per the gate.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Observability clause "service-level operation MUST emit structured logs with a correlation ID" marked **N/A** | The deployed architecture is a **static site with no server runtime** — there are no service-level operations to log. Build/CMS run locally. Performance-metric intent is met via Lighthouse CI. | Adding a backend/logging service solely to satisfy the clause would reintroduce a runtime server, directly violating Constitution V and VII, with no user value — worse than a documented N/A. |

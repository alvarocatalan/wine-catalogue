# Implementation Plan: Wine Catalogue

**Branch**: `001-wine-catalogue` | **Date**: 2026-07-15 (re-architected) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-wine-catalogue/spec.md`

> **Re-architecture note (2026-07-15)**: The spec was refined to lock an
> **interactive web app** with device-local storage (analysis findings I1/I2).
> This plan **replaces** the earlier static-site + Git-authoring plan. See
> [research.md](./research.md) for the superseding decisions.

## Summary

A minimalist, single-user personal wine catalogue that runs entirely in the
browser. The user records each tasted wine's vintage, designation of origin,
winery, and wine name with an uploaded image, then browses, searches, filters,
edits, and deletes — all **inside the running app**, with everything stored
**locally on their own device**.

**Technical approach**: An **Astro 5** static shell hosts one **Preact** island
(`@astrojs/preact`) that renders the whole interactive catalogue (list / detail
/ add / edit) client-side. Data and images persist in **IndexedDB** (via `idb`):
a `wines` store for text records and an `images` store for resized WebP Blobs
(`thumb` + `full`). Image upload is validated (JPEG/PNG/WebP, ≤ 10 MB) and
resized/compressed in the browser via Canvas. **Search and filtering run
in-memory** over the loaded records (case-insensitive, partial, all four fields,
with which-field-matched). A **service worker** (`vite-plugin-pwa`) precaches
the app shell for offline use; IndexedDB keeps the data offline too. Styling is
**Tailwind CSS 4** design tokens shared by shell and island. There is **no
backend and no database server**.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`); Node 20 LTS for the build/test toolchain.

**Primary Dependencies**: Astro 5.x (`output: 'static'`), `@astrojs/preact` + Preact (+ `@preact/signals`), Tailwind CSS 4.x (`@tailwindcss/vite`), `idb` (IndexedDB), `zod` (form + record validation), `vite-plugin-pwa` (Workbox service worker + manifest).

**Storage**: **IndexedDB** on the user's device — `wines` store (text records) + `images` store (WebP `thumb`/`full` Blobs). **No database server, no backend.**

**Testing**: Vitest (unit + integration) with `@testing-library/preact` and `fake-indexeddb`; Playwright + axe (e2e + a11y); `astro check`; Lighthouse CI (performance budgets).

**Target Platform**: Static hosting / any CDN; modern desktop + mobile browsers; installable PWA; fully offline-capable (shell precached, data device-local).

**Project Type**: Client-rendered web application on a static Astro shell, single project.

**Performance Goals**: Catalogue LCP ≤ 2.0 s on throttled "Slow 4G" / mid-tier mobile (SC-003); search/filter interaction → results ≤ 100 ms; app island JS ≤ 60 KB gzip (research Decision 10).

**Constraints**: No backend/server runtime; offline browsing **and** authoring of the device-local catalogue (FR-012, FR-014); per-image limit 10 MB, formats JPEG/PNG/WebP; 1,000-entry scale without visible slowdown (FR-017) via windowed grid + lazy thumbnails; no credentials in `localStorage` (N/A — no auth).

**Scale/Scope**: ~1,000 wine entries (FR-017); one shell route hosting a Preact island with client-side views: catalogue grid, detail, add form, edit form, delete+undo, search, filters.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Gates derived from the four principles in `constitution.md` v1.0.0.

### I. Code Quality — PASS
- TypeScript `strict`; ESLint + Prettier + `astro check` in CI; no merge bypassing checks.
- Zod schema + typed IndexedDB repository document the data contract with intent; island components are single-responsibility (WineCard, WineForm, WineDetail, SearchBox, Filters, DeleteToast, Placeholder).
- Reviews mandatory; Preact + signals avoids ad-hoc state sprawl. **No violation.**

### II. Testing Standards (NON-NEGOTIABLE) — PASS
- TDD for runtime logic (vintage validator, search/filter/compose, image validation, IndexedDB repository): tests first, red, then green.
- Unit for logic/validators/repo (fake-indexeddb); integration for form-blocks-save, add→grid, edit-reflects, delete+undo, empty/no-results; e2e (Playwright) for the full add→browse→search→filter→clear→edit→delete→undo path **plus a reload-persists assertion** (FR-012).
- "Data-integrity" 100% branch rule = Zod schema + vintage validator + IndexedDB repository, exhaustively tested; 80% line gate elsewhere. **No violation.**

### III. User Experience Consistency — PASS
- Single design system via centralised Tailwind tokens shared by shell + island; consistent card/detail/form components.
- Documented empty, no-results, image-failure (placeholder), delete-confirm, and undo states (FR-013, FR-016, FR-011).
- WCAG 2.1 AA verified pre-merge (axe in e2e; required `imageAlt`; keyboard-operable forms/dialogs; focus management on view changes; `aria-live` on grid + toasts). **No violation.**

### IV. Performance Requirements — PASS
- Declared budgets (research Decision 10) asserted by Lighthouse CI; >5% regression blocks merge.
- Windowed grid + lazy thumbnails + in-memory search keep interactions <100 ms; measured under throttled/mid-tier conditions with ~1,000-entry IndexedDB fixtures. **No violation.**
- *Note*: the JS budget is intentionally larger than the previous static plan (≤ 60 KB gz vs ≤ 15 KB) because this is a CRUD app; a declared budget with a regression gate satisfies Principle IV.

### Additional Constraints
- **Security/dependency hygiene**: dependency scanning in CI; new deps justified in PR; minimal dep surface. No secrets, no auth tokens (no auth); no `localStorage` credential storage (N/A). **PASS.**
- **Documentation/ADRs**: spec + research + ADR for the interactive/device-local decision. **PASS.**
- **Observability**: structured-logs-with-correlation-ID clause is **Not Applicable** (no server runtime); performance-metric intent met via Lighthouse CI (+ optional web-vitals RUM). **Justified deviation — see Complexity Tracking + research Decision 11.**

**Gate result**: PASS (one documented, justified N/A). No unjustified violations. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/001-wine-catalogue/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 — decisions (re-architected 2026-07-15)
├── data-model.md        # Phase 1 — Wine Entry model (runtime + IndexedDB)
├── quickstart.md        # Phase 1 — run + use + verify
├── contracts/           # Phase 1 — data + UI contracts
│   ├── wine-schema.md    #   Zod form/record contract + IndexedDB repository API
│   └── ui-contracts.md   #   island views + search/filter/form/delete contracts
└── tasks.md             # Phase 2 (/speckit-tasks — regenerate; currently stale)
```

### Source Code (repository root)

Single Astro project at the repo root; the interactive app is a Preact island:

```text
src/
├── components/
│   ├── island/                     # Preact island (client-rendered app)
│   │   ├── App.tsx                  # island root: view routing + state (signals)
│   │   ├── WineGrid.tsx             # virtualised grid of cards
│   │   ├── WineCard.tsx             # card (thumb, name, winery, vintage; future flag)
│   │   ├── WineDetail.tsx           # detail view (full image + 4 fields)
│   │   ├── WineForm.tsx             # add/edit form (Zod-validated, blocks save)
│   │   ├── ImageUpload.tsx          # file input + validate + resize preview
│   │   ├── SearchBox.tsx            # always-visible search input
│   │   ├── Filters.tsx              # vintage / DO / winery facets + Clear
│   │   ├── DeleteToast.tsx          # confirm + short-lived Undo (FR-011)
│   │   ├── EmptyState.tsx           # empty + no-results states (FR-016)
│   │   └── Placeholder.tsx          # image-failure fallback (FR-013)
├── lib/
│   ├── db.ts                        # IndexedDB repository (idb): CRUD over wines+images
│   ├── schema.ts                    # Zod schema for a wine record (data contract)
│   ├── vintage.ts                   # NV/YYYY validator + future-vintage flag
│   ├── image.ts                     # validate (MIME/size) + Canvas resize → WebP Blobs
│   └── search.ts                    # in-memory search + filter + compose + field-match
├── layouts/
│   └── BaseLayout.astro             # shell: head, tokens, PWA registration
├── pages/
│   └── index.astro                  # mounts <App client:only="preact" />
├── styles/
│   └── global.css                   # Tailwind entry + design tokens
└── pwa.ts                           # service worker registration glue

public/
├── placeholder.svg                  # shared image-failure asset
└── manifest.webmanifest             # PWA manifest

tests/
├── unit/                            # vintage, schema, search/compose, image, db(repo)
├── integration/                     # form-blocks-save, add→grid, edit, delete+undo, empty
└── e2e/                             # Playwright: full CRUD + search/filter + reload-persist + axe

astro.config.mjs                     # static output, Preact, Tailwind, vite-plugin-pwa
vitest.config.ts                     # jsdom + fake-indexeddb setup
playwright.config.ts                 # runs against the built preview
lighthouserc.json                    # performance budgets
```

**Structure Decision**: Single Astro project rooted at the repository. Astro
provides the static shell, Tailwind, and PWA wiring; the entire interactive
surface is one Preact island under `src/components/island/`, with framework-free
logic (db, schema, search, image, vintage) in `src/lib/` so it is unit-testable
in isolation. There is no backend, so no `backend/`+`frontend/` split. Because
entries exist only in the user's IndexedDB, there are **no statically generated
per-entry routes**; the island does client-side view routing.

## Complexity Tracking

Only one constitutional clause is not met in full; recorded here per the gate.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Observability clause "service-level operation MUST emit structured logs with a correlation ID" marked **N/A** | The architecture has **no server runtime** — there are no service-level operations to log. Performance-metric intent is met via Lighthouse CI (+ optional web-vitals RUM). | Adding a backend/logging service solely to satisfy the clause would reintroduce a server, contradict the explicit no-backend/device-local directive, and add cost with no user value — worse than a documented N/A. |

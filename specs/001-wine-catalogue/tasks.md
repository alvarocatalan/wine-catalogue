---
description: "Task list for Wine Catalogue implementation"
---

# Tasks: Wine Catalogue

**Input**: Design documents from `/specs/001-wine-catalogue/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are **included and mandatory** — the project constitution
(Principle II, NON-NEGOTIABLE) requires TDD: logic tests are written first and
MUST fail before implementation.

**Architecture note**: Per `plan.md` / `research.md`, this is a **static Astro 5
site** with **Keystatic** (local mode, dev-only) as the git-based CMS. Content
(`.mdoc`) and images live under `src/` and are **versioned in git**. **No
IndexedDB / localStorage / sessionStorage.** Production `astro build` is static;
`/keystatic` + SSR routes are dev-only (FR-023).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 (from spec.md). Setup/Foundational/Polish have no label.

## Path Conventions

Single Astro project at repository root: `src/`, `tests/`, config files at root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialise the Astro project and toolchain.

- [ ] T001 Initialise Astro 5 project at repo root: `package.json`, `astro.config.mjs` with default `output: 'static'`, `tsconfig.json` (`strict`), and `src/` tree per plan.md.
- [ ] T002 [P] Add Tailwind CSS 4 via `@tailwindcss/vite`; create `src/styles/global.css` with the design tokens (limited palette, spacing, one display + one body font) (FR-015).
- [ ] T003 [P] Configure ESLint + Prettier and an `astro check` script; add all `npm` scripts (dev/build/preview/test/test:island/test:e2e/lint/perf) per quickstart.md.
- [x] T004 [P] Configure Vitest in `vitest.config.ts` (node env for `src/lib`, jsdom for the island).
- [ ] T005 [P] Configure Playwright + `axe-core` in `playwright.config.ts` (runs against the built static preview) and Lighthouse CI in `lighthouserc.json` with the budgets from research Decision 11.
- [ ] T006 Add `@astrojs/markdoc` integration to `astro.config.mjs` (always on — renders `.mdoc` bodies).
- [ ] T007 Wire the **dev-only** CMS stack in `astro.config.mjs`: conditionally include `@astrojs/react`, `@keystatic/astro`, and the `@astrojs/node` adapter **only when `SKIP_KEYSTATIC !== 'true'`** (Keystatic's official "disable admin UI in production" recipe), so a build with `SKIP_KEYSTATIC=true` mounts no `/keystatic` route and emits pure static output. Also set `site: 'https://alvarocatalan.github.io'` and `base: '/wine-catalog/'` (GitHub Pages project pages) (research Decision 2; FR-020, FR-023, Constitution V).
- [ ] T008 [P] Add `@vite-pwa/astro`: `public/manifest.webmanifest` + Workbox precache of the published shell/pages/images (view-only offline) (FR-012, research Decision 9).
- [ ] T009 [P] Add a CI guard script that greps the built `dist/` and `src/` for `indexedDB|localStorage|sessionStorage` and fails on any match (Constitution VI).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The content pipeline and shared contracts every story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T010 [P] Write failing unit test for the vintage validator in `tests/unit/vintage.test.ts` (`NV`, valid `YYYY`, invalid strings, future-year flag) (FR-003).
- [ ] T011 [P] Write failing unit test for the Zod schema in `tests/unit/schema.test.ts` (required fields reject empty — including `foto` and `fotoAlt`; `anada` regex) (FR-002, FR-003, FR-021).
- [ ] T012 Create the shared Zod schema in `src/lib/schema.ts`: `wineFrontmatter`, `VINTAGE` regex, and `WINE_FIELDS` (nombre, bodega, denominacionOrigen, anada, foto, fotoAlt, notas) — makes T011 pass (contracts/wine-schema.md).
- [ ] T013 Implement the vintage validator in `src/lib/vintage.ts` (`NV`/`YYYY` + `anadaIsFuture`) — makes T010 pass.
- [ ] T014 Create the `vinos` Content Layer collection in `src/content.config.ts` (glob `**/*.mdoc` over `src/content/vinos`, schema `({ image }) => …` using `wineFrontmatter` + `foto: image()`) (data-model.md).
- [ ] T015 Create `keystatic.config.ts` (local mode) mirroring the schema: seven fields, `slugField: 'nombre'`, `format: { contentField: 'notas' }`, `fields.image` with `directory: 'src/assets/vinos'` + `publicPath`, `isRequired` flags (contracts/wine-schema.md; FR-014, FR-018).
- [ ] T016 Create content dirs `src/content/vinos/` and `src/assets/vinos/` (with `.gitkeep`) versioned in git (FR-012).
- [ ] T017 Create `src/layouts/BaseLayout.astro` (head, tokens, service-worker registration) and `src/components/Placeholder.astro` + `public/placeholder.svg` (image-failure fallback) (FR-013, FR-015).
- [x] T018 **De-risk the image seam (research Decision 4)**: add one fixture wine (`.mdoc` + image), run `astro build`, and assert it produces an optimised `<img>` with a hashed `src` and the correct `alt`; fix `publicPath`/`directory` until the `image()` helper resolves.

**Checkpoint**: Content pipeline proven end-to-end (author → validate → build → optimised image). User stories can begin.

---

## Phase 3: User Story 1 - Capture a wine I have tasted (Priority: P1) 🎯 MVP

**Goal**: The administrator can add a wine (seven fields + validated image upload) in the Keystatic panel, producing a versioned `.mdoc` + image.

**Independent Test**: In `astro dev`, open `/keystatic`, create a wine with all required fields and an image; confirm `src/content/vinos/<slug>.mdoc` and `src/assets/vinos/<slug>/…` are created with valid frontmatter and the build succeeds.

### Tests for User Story 1 ⚠️ (write first, must fail)

- [x] T019 [P] [US1] Write failing schema-parity test in `tests/unit/schema-parity.test.ts` asserting the Keystatic `vinos` field set equals `WINE_FIELDS` (contracts/wine-schema.md).
- [x] T020 [P] [US1] Write failing content-validation test in `tests/unit/content-validate.test.ts` that a valid fixture `.mdoc` passes the collection schema and an invalid one (missing `bodega`, bad `anada`) fails (FR-001, FR-002, FR-003).

### Implementation for User Story 1

- [x] T021 [US1] Finalise the Keystatic `vinos` collection fields, labels, and validation (required fields, `anada` pattern surfaced where supported) in `keystatic.config.ts` — makes T019 pass (FR-001, FR-002, FR-003).
- [ ] T022 [US1] Confirm the Keystatic image upload contract in `keystatic.config.ts` `fields.image`: `isRequired`, file-picker **and** drag-and-drop both available, image co-located per slug (verified). NOTE (spike): Keystatic does **not** validate image format/size — that is the FR-014 build gate (T055/T056), not the panel (FR-014, FR-024).
- [ ] T023 [US1] Add `createdAt` (`fields.date`, default today) and ensure `notas` is the optional Markdoc body (FR-022).
- [ ] T024 [US1] Add a committed fixture wine under `src/content/vinos/` + image (used by T018/T020 and later browse tests) — makes T020 pass.
- [ ] T055 [US1] Write failing test `tests/unit/image-gate.test.ts` for the image build gate: a valid JPEG/PNG/WebP ≤ 10 MB passes; an unsupported format fails; a file > 10 MB fails; the failure message names the file + reason (FR-014).
- [ ] T056 [US1] Implement the image build gate `scripts/validate-images.mjs` (scan `src/assets/vinos/**`; fail with a clear message naming file + reason on unsupported format or > 10 MB) and wire it into the build (`prebuild`/`build` script) so it also runs in CI via `withastro/action` (T051) — makes T055 pass; enforces FR-014 so no invalid image reaches production.

**Checkpoint**: A wine can be authored, validated, and committed; the build gate blocks any invalid image; MVP authoring works.

---

## Phase 4: User Story 2 - Browse my catalogue (Priority: P1)

**Goal**: Visitors see all wines as a static grid and open a static detail page per wine.

**Independent Test**: With ≥10 committed wines, `astro build && preview`; `/` shows a card grid (image, nombre, bodega, anada); each card opens `/vinos/<slug>` with the large image, all fields, and notas.

### Tests for User Story 2 ⚠️ (write first, must fail)

- [ ] T025 [P] [US2] Write failing e2e test `tests/e2e/browse.spec.ts` (Playwright): grid renders one card per fixture wine; card fields present (FR-004).
- [ ] T026 [P] [US2] Write failing e2e test `tests/e2e/detail.spec.ts`: `/vinos/<slug>` shows large image, four fields, rendered notas; placeholder shown when image missing (FR-005, FR-013, FR-022).
- [ ] T027 [P] [US2] Write failing e2e test `tests/e2e/empty-a11y.spec.ts`: empty catalogue shows the empty state; axe reports no WCAG 2.1 AA violations (FR-016, FR-021, Principle III).

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create `src/components/WineCard.astro` (optimised `<Image/>` thumbnail or placeholder, nombre, bodega, anada; `data-*` for filtering; future-vintage marker via `vintage.ts`) (FR-004, FR-013).
- [ ] T029 [P] [US2] Create `src/components/EmptyState.astro` (empty + no-results states) (FR-016).
- [ ] T030 [US2] Create `src/components/WineGrid.astro` (queries the `vinos` collection, renders the card grid) (FR-004).
- [ ] T031 [US2] Create `src/pages/index.astro` (BaseLayout + WineGrid + empty state) — makes T025/T027 pass (FR-004, FR-016).
- [ ] T032 [US2] Create `src/pages/vinos/[slug].astro` with `getStaticPaths()` over `vinos`: full `<Image/>`, all fields, rendered `notas` — makes T026 pass (FR-005, FR-020, FR-022).

**Checkpoint**: The static catalogue is browsable end-to-end (grid + detail), independent of search.

---

## Phase 5: User Story 3 - Search and filter the catalogue (Priority: P2)

**Goal**: Visitors search and filter in place, in memory, over the published catalogue (no storage).

**Independent Test**: With ≥30 varied wines, type a term → grid narrows in place with which-field-matched; apply an añada/DO/bodega filter → narrows; Clear → restores; no-match → "no results".

### Tests for User Story 3 ⚠️ (write first, must fail)

- [ ] T033 [P] [US3] Write failing unit tests `tests/unit/search.test.ts`: case-insensitive partial match across nombre/bodega/denominacionOrigen/anada; which-field-matched; `displayed = filterSet ∩ searchResults` (FR-006, FR-007, FR-008, FR-009).
- [ ] T034 [P] [US3] Write failing component test `tests/component/catalogue-search.test.tsx` (`@testing-library/preact`): typing filters visible cards; Clear resets; `aria-live` announces changes (FR-006, FR-009, Principle III).
- [ ] T035 [P] [US3] Write failing e2e test `tests/e2e/search-filter.spec.ts`: search + filter + clear + no-results over the built site (FR-006–FR-009, FR-016).

### Implementation for User Story 3

- [ ] T036 [US3] Implement pure search/filter logic in `src/lib/search.ts` (match, field-match, facet derivation, compose) — makes T033 pass (FR-006, FR-007, FR-008).
- [ ] T037 [US3] Emit a build-time text index (`{ slug, nombre, bodega, denominacionOrigen, anada }`) from `index.astro` for the island (research Decision 7).
- [ ] T038 [US3] Create the Preact island `src/components/CatalogueSearch.tsx` (`@preact/signals`): search box + facets + Clear; filters cards in memory (visibility toggle); `aria-live`; **no storage** — makes T034 pass (FR-006, FR-008, FR-009, Constitution VI).
- [ ] T039 [US3] Mount the island in `WineGrid.astro`/`index.astro` and wire `data-*` attributes + no-results state — makes T035 pass (FR-007, FR-016).

**Checkpoint**: Search + filter work in memory over the static grid; US1/US2 still pass.

---

## Phase 6: User Story 4 - Maintain my entries (Priority: P3)

**Goal**: The administrator edits and deletes wines via Keystatic; recovery is via git history.

**Independent Test**: Edit a wine in `/keystatic` → rebuild → change reflected in grid + detail. Delete a wine → confirmation → after rebuild it is gone; reverting the commit restores it.

### Tests for User Story 4 ⚠️ (write first, must fail)

- [ ] T040 [P] [US4] Write failing integration test `tests/e2e/edit-reflects.spec.ts`: editing a fixture `.mdoc` field is reflected on grid + detail after build (FR-010).
- [ ] T041 [P] [US4] Write failing test `tests/unit/created-at.test.ts`: editing preserves `createdAt` (ordering stable) (Key Entities).

### Implementation for User Story 4

- [ ] T042 [US4] Confirm Keystatic edit flow updates the `.mdoc`/image in place and preserves `createdAt` — makes T040/T041 pass (FR-010).
- [ ] T043 [US4] Confirm the Keystatic delete flow has a confirmation step; document git-history/revert as the recovery path (no in-session undo) in `quickstart.md` (FR-011; Clarifications 2026-07-15).
- [ ] T044 [US4] Document the manual orphaned-image cleanup on delete (out of scope for v1, conscious decision) in `quickstart.md` (Assumptions).

**Checkpoint**: Full authoring lifecycle (create/edit/delete + recovery) works; all stories independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T045 [P] Run Lighthouse CI against a ~1,000-entry fixture build; confirm LCP ≤ 2.0 s, island JS ≤ 20 KB gz, interaction ≤ 100 ms (SC-002, SC-003, research Decision 11).
- [ ] T046 [P] Full axe/keyboard a11y sweep across grid, detail, and search (WCAG 2.1 AA) (Principle III).
- [ ] T047 [P] Verify production `dist/` is static-only (no server entry/adapter output) and the CI storage-API guard (T009) passes (Constitution V, VI; FR-020, FR-023).
- [ ] T048 [P] Add a `README.md` (author→commit→push→publish flow) and confirm `CLAUDE.md`/`quickstart.md` are current.
- [ ] T049 Run the `quickstart.md` verification checklist end-to-end.

---

## Phase 8: Deployment (GitHub Pages via GitHub Actions)

**Purpose**: Publish the static site on push to `main` (FR-020), with the admin panel excluded (FR-023). Deploy is **in scope for v1**.

- [ ] T050 Define the production build to run with `SKIP_KEYSTATIC=true` in `package.json` (pure static, no `/keystatic`); the `@astrojs/node` adapter stays reserved for the local-dev panel only (FR-020, FR-023).
- [ ] T051 Create `.github/workflows/deploy.yml`: triggers `push` to `main` + `workflow_dispatch`; `permissions: { contents: read, pages: write, id-token: write }`; build job = `actions/checkout@v7` → `withastro/action@v6` (with env `SKIP_KEYSTATIC=true`); deploy job = `actions/deploy-pages@v5` (versions verified against Astro docs, 2026) (FR-020).
- [ ] T052 Ensure the client search index (build-time JSON embedded by `index.astro`, research Decision 7 — **in-memory island, not Pagefind**) is produced by the CI build and included in the deployed `dist/` artifact (FR-006, FR-007).
- [ ] T053 [P] Document the one-time manual step to enable GitHub Pages (repo **Settings → Pages → Source: GitHub Actions**) in `README.md`/`quickstart.md` (FR-020).
- [ ] T054 Add a deployment smoke test `tests/e2e/deploy-static.spec.ts` (or a CI shell check): a local `SKIP_KEYSTATIC=true` build asserts `dist/` is static, the `/keystatic` route is **absent**, and the client search index is **present** in the output (FR-020, FR-023, Constitution V/VI).

**Checkpoint**: Push to `main` publishes the static catalogue to GitHub Pages with no admin panel and no server runtime.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; **blocks all user stories**. T018 (image seam) is the key de-risking gate.
- **User Stories (Phase 3–6)**: depend on Foundational.
  - US1 (P1) → US2 (P1) recommended order (US2 browse consumes wines US1 authors), though both are independently testable with fixtures.
  - US3 (P2) depends on US2's grid being present to enhance.
  - US4 (P3) depends on US1's Keystatic config.
- **Polish (Phase 7)**: after the desired stories are complete.
- **Deployment (Phase 8)**: after US1/US2 exist (there is content to publish); T050/T051 build on T007's `astro.config`. May run alongside Polish.

### Within Each User Story

- Tests written first and FAIL before implementation (Constitution II).
- Schema/logic before components; components before pages; core before integration.

### Parallel Opportunities

- Setup: T002–T005, T008, T009 in parallel.
- Foundational: T010/T011 (tests) in parallel; T012/T013 in parallel after their tests.
- Each story's `[P]` test tasks run in parallel; `[P]` components (e.g., T028/T029) in parallel.

---

## Parallel Example: User Story 2

```bash
# Tests first (parallel):
Task: "e2e browse in tests/e2e/browse.spec.ts"
Task: "e2e detail in tests/e2e/detail.spec.ts"
Task: "e2e empty + a11y in tests/e2e/empty-a11y.spec.ts"

# Then independent components (parallel):
Task: "WineCard.astro"
Task: "EmptyState.astro"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → 2. Phase 2 Foundational (incl. T018 image-seam gate) → 3. Phase 3 US1 (author a wine) → **STOP & VALIDATE**.
2. Add US2 (browse) → the site is genuinely usable (author + publish + browse) → deploy/demo.

### Incremental Delivery

Setup + Foundational → US1 (author) → US2 (browse, MVP public site) → US3 (search/filter) → US4 (maintain). Each story adds value without breaking the previous ones.

---

## Notes

- `[P]` = different files, no dependencies. `[Story]` maps to spec.md user stories.
- No IndexedDB/localStorage/sessionStorage anywhere (Constitution VI; guarded by T009/T047).
- Production build must be static; `/keystatic` is dev-only (FR-023).
- Publication = **push to main** triggers the GitHub Actions build + deploy to GitHub Pages (Phase 8; FR-020).
- Commit after each task or logical group; verify tests fail before implementing.

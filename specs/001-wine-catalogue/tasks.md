---
description: "Task list for Wine Catalogue implementation"
---

# Tasks: Wine Catalogue

**Input**: Design documents from `/specs/001-wine-catalogue/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are **included and mandatory** — the project constitution
(Principle II, NON-NEGOTIABLE) requires TDD. Tests are written first and MUST
fail before implementation.

**Architecture note**: Per `research.md` Decision 1, this is a static Astro site
with no runtime write path. "Capture/edit/delete" (US1, US4) are realised as a
**Git-based authoring workflow** (author/edit/remove Markdown + image, then
rebuild) with build-time Zod validation standing in for runtime "block the
save". The genuine runtime app surface is browse (US2) and search/filter (US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 maps to the user stories in spec.md
- All paths are repo-root relative (single static Astro project)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and toolchain

- [ ] T001 Initialize Astro project with static output at repository root (`astro.config.mjs`, `package.json`, `src/`, `public/`)
- [ ] T002 Install and pin dependencies in `package.json`: runtime `astro@^5`, `tailwindcss@^4`, `@tailwindcss/vite`, `pagefind`, `sharp`; dev `vitest`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `prettier`, `@lhci/cli`
- [ ] T003 [P] Configure `astro.config.mjs`: `output: 'static'`, Tailwind Vite plugin, and Pagefind index build on `astro build`
- [ ] T004 [P] Configure TypeScript `strict` in `tsconfig.json` (extend `astro/tsconfigs/strict`)
- [ ] T005 [P] Configure ESLint + Prettier + `astro check` scripts in `package.json` / `.eslintrc`, `.prettierrc`
- [ ] T006 [P] Configure Vitest for unit + integration in `vitest.config.ts` with `tests/` roots and coverage threshold ≥80% (gate per Principle II)
- [ ] T007 [P] Configure Playwright + axe in `playwright.config.ts` against the built `dist/` preview
- [ ] T008 [P] Configure Lighthouse CI budgets in `lighthouserc.json` (LCP ≤ 2.0s, CLS ≤ 0.05, initial JS ≤ 15KB gz) per research Decision 8

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Define the `wines` content collection + Zod schema (the data contract) in `src/content/config.ts` per `contracts/wine-schema.md` (fields: wineName, winery, designationOfOrigin, vintage, image, imageAlt, createdAt)
- [ ] T010 [P] Create `BaseLayout.astro` in `src/layouts/` and Tailwind design tokens (limited palette, spacing, type scale) in `src/styles/global.css` (FR-015, Principle III)
- [ ] T011 [P] Create shared `Placeholder.astro` in `src/components/` and a neutral placeholder asset in `public/` for image-load failure (FR-013)
- [ ] T012 [P] Implement vintage helper in `src/lib/vintage.ts`: validate `NV`/`YYYY` and compute `vintageIsFuture` (FR-003, future-vintage edge case)
- [ ] T013 [P] Create test fixtures (small set of valid wine entries + images, plus invalid samples) in `tests/fixtures/`
- [ ] T014 [P] Create the content image directory convention `src/content/wines/images/` with a documented README

**Checkpoint**: Foundation ready — user stories can begin

---

## Phase 3: User Story 1 - Capture a wine I have tasted (Priority: P1) 🎯 MVP

**Goal**: A valid wine entry can be authored (Markdown + image) and shows up in
the catalogue with correct details and image; invalid entries are rejected at
build time (the static-site equivalent of "block the save").

**Independent Test**: From an empty collection, author one entry with all four
fields + image, build, and confirm it renders with correct details and image;
then confirm an entry missing a required field fails the build naming the field,
and that `vintage: "NV"` is accepted.

### Tests for User Story 1 (write first, MUST fail) ⚠️

- [ ] T015 [P] [US1] Unit test for vintage validator (accepts `NV` + 4-digit year, rejects others) in `tests/unit/vintage.test.ts` (FR-003)
- [ ] T016 [P] [US1] Integration test: a valid fixture entry passes the Zod schema and loads via the content collection in `tests/integration/schema-valid.test.ts` (FR-001)
- [ ] T017 [P] [US1] Integration test: an entry missing a required field is rejected by the schema, with the offending field surfaced, in `tests/integration/schema-invalid.test.ts` (FR-002)

### Implementation for User Story 1

- [ ] T018 [US1] Author the first real wine entry (Markdown frontmatter + committed image) in `src/content/wines/` per the schema (FR-001)
- [ ] T019 [US1] Wire `image()` schema field to `astro:assets` so entry images are optimised at build (responsive `srcset`, WebP/AVIF) in `src/content/config.ts` + entry rendering (FR-014)
- [ ] T020 [US1] Render entries on the catalogue page `src/pages/index.astro` showing image + wineName + winery + vintage, proving a captured wine appears (FR-001, FR-004 baseline)
- [ ] T021 [US1] Document the "add a wine" authoring workflow (file + image + rebuild) in `specs/001-wine-catalogue/quickstart.md` and project docs

**Checkpoint**: A wine can be captured and seen — MVP is functional

---

## Phase 4: User Story 2 - Browse my catalogue (Priority: P1)

**Goal**: All wines display as a clean, consistent, minimalist responsive grid;
each card opens a detail view with the large image and all four fields; empty
state shown when there are no entries.

**Independent Test**: With ≥10 entries, open the catalogue and confirm a
consistent grid of cards; click a card and confirm the detail view shows the
larger image + all four fields; empty the collection and confirm a friendly
empty state.

### Tests for User Story 2 (write first, MUST fail) ⚠️

- [ ] T022 [P] [US2] Integration test: catalogue renders one card per fixture entry with image, wineName, winery, vintage in `tests/integration/catalogue-grid.test.ts` (FR-004)
- [ ] T023 [P] [US2] Integration test: empty collection renders the empty state (not a blank page) in `tests/integration/empty-state.test.ts` (FR-016)
- [ ] T024 [P] [US2] E2E test: clicking a card opens the detail view with the larger image + all four fields in `tests/e2e/detail.spec.ts` (FR-005)
- [ ] T025 [P] [US2] E2E accessibility test (axe): catalogue and detail pass WCAG 2.1 AA in `tests/e2e/a11y.spec.ts` (Principle III)

### Implementation for User Story 2

- [ ] T026 [P] [US2] Create `WineCard.astro` in `src/components/` (image/placeholder, wineName, winery, vintage; future-vintage marker via `vintageIsFuture`) (FR-004, FR-013)
- [ ] T027 [US2] Build the responsive minimalist grid layout in `src/pages/index.astro` using `WineCard` with consistent spacing (FR-004, FR-015)
- [ ] T028 [P] [US2] Create `EmptyState.astro` in `src/components/` and wire it into the catalogue when no entries exist (FR-016)
- [ ] T029 [US2] Create the detail route `src/pages/wines/[slug].astro` rendering large image + all four fields with placeholder fallback (FR-005, FR-013)
- [ ] T030 [US2] Wire card → detail navigation by slug in `WineCard.astro` / `index.astro`
- [ ] T031 [US2] Add `imageAlt` rendering and keyboard-focusable card links with visible focus order (Principle III)

**Checkpoint**: Browsing + detail + empty state work independently

---

## Phase 5: User Story 3 - Search and filter the catalogue (Priority: P2)

**Goal**: An always-visible search box filters in place (case-insensitive,
partial, across all four fields), facet filters narrow by vintage / designation
of origin / winery, search and filters compose, a single Clear restores
everything, and no-matches shows a clear message.

**Independent Test**: With ≥30 entries spanning varied attributes, type a term
and confirm matches surface; apply a vintage filter and confirm the result
narrows and shows the active filter; clear and confirm the full catalogue
returns; search for nonsense and confirm a "no results" message.

### Tests for User Story 3 (write first, MUST fail) ⚠️

- [ ] T032 [P] [US3] Unit test: build-time facet index produces distinct sorted vintage/DO/winery values in `tests/unit/facets.test.ts` (FR-008)
- [ ] T033 [P] [US3] Unit test: search∩filter intersection + Clear-reset logic in `tests/unit/compose.test.ts` (FR-008, FR-009)
- [ ] T034 [P] [US3] E2E test: typing a term narrows results in place; case-insensitive partial match across all four fields; "which field matched" indicated in `tests/e2e/search.spec.ts` (FR-006, FR-007)
- [ ] T035 [P] [US3] E2E test: apply a vintage/DO/winery filter narrows + shows active filter; Clear restores full catalogue in `tests/e2e/filter.spec.ts` (FR-008, FR-009)
- [ ] T036 [P] [US3] E2E test: empty search/filter result shows the no-results message in `tests/e2e/no-results.spec.ts` (FR-016)

### Implementation for User Story 3

- [ ] T037 [US3] Implement build-time facet index generation in `src/lib/facets.ts` (distinct vintage/DO/winery → JSON consumed by filters) (FR-008)
- [ ] T038 [P] [US3] Create `SearchBox.astro` in `src/components/` and the lazy Pagefind search island in `src/scripts/search.ts` (loads on first interaction) (FR-006, FR-007)
- [ ] T039 [P] [US3] Create `Filters.astro` in `src/components/` and the facet filter island in `src/scripts/filters.ts` (FR-008)
- [ ] T040 [US3] Implement compose logic (displayed = filter set ∩ search results), re-render grid, and surface which field matched in `src/scripts/filters.ts` / `search.ts` (FR-007, FR-008)
- [ ] T041 [US3] Implement the single Clear control resetting search + all filters in `src/components/Filters.astro` (FR-009)
- [ ] T042 [US3] Add an `aria-live` region on the grid container announcing result/empty changes (Principle III)

**Checkpoint**: Search + filter compose and reset; all of US1–US3 work independently

---

## Phase 6: User Story 4 - Maintain my entries (Priority: P3)

**Goal**: Existing entries can be corrected or removed through the Git-based
authoring workflow, with Git review/diff as the confirmation step and
`git revert` as durable undo; legitimate duplicates are allowed but flagged with
a non-blocking warning.

**Independent Test**: Edit one field of an existing entry, rebuild, and confirm
the change appears in both grid and detail; remove an entry's files, rebuild,
and confirm it no longer appears; introduce a duplicate vintage+winery+wineName
and confirm a non-blocking build warning.

### Tests for User Story 4 (write first, MUST fail) ⚠️

- [ ] T043 [P] [US4] Integration test: changing a fixture entry's field is reflected in rendered card + detail after reload in `tests/integration/edit-reflects.test.ts` (FR-010)
- [ ] T044 [P] [US4] Integration test: removing an entry from the collection removes it from the catalogue in `tests/integration/delete-removes.test.ts` (FR-011)
- [ ] T045 [P] [US4] Unit test: duplicate (vintage+winery+wineName) detection emits a warning without failing the build in `tests/unit/duplicates.test.ts` (duplicate edge case)

### Implementation for User Story 4

- [ ] T046 [US4] Implement non-blocking duplicate-detection check (vintage+winery+wineName) emitting a build-log warning in `src/lib/duplicates.ts` and invoke it during build
- [ ] T047 [P] [US4] Document the edit workflow (edit Markdown → rebuild) in `specs/001-wine-catalogue/quickstart.md` and project docs (FR-010)
- [ ] T048 [P] [US4] Document the delete + `git revert` undo workflow as the confirmation/undo mechanism in `specs/001-wine-catalogue/quickstart.md` and project docs (FR-011)

**Checkpoint**: All four user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance, scale, accessibility, and release readiness

- [ ] T049 [P] Generate a ~1,000-entry fixture catalogue for scale/perf testing in `tests/fixtures/scale/` (FR-017)
- [ ] T050 Run Lighthouse CI against the ~1,000-entry build and confirm performance budgets (LCP ≤ 2.0s, JS ≤ 15KB gz, CLS ≤ 0.05) in CI (SC-003, Principle IV)
- [ ] T051 Verify search locates a wine in a 500-entry catalogue within budget (SC-002) via an E2E timing assertion in `tests/e2e/search-perf.spec.ts`
- [ ] T052 [P] Confirm unit/integration coverage ≥80% and validators/schema near-100% (Principle II) in CI report
- [ ] T053 [P] Add dependency vulnerability scan to CI (security baseline) and document in `package.json` scripts
- [ ] T054 [P] Record an ADR for the static-site + Git-authoring decision in `docs/adr/` (research Decision 1 & 9)
- [ ] T055 [P] Final WCAG 2.1 AA sweep (keyboard, contrast, focus order, screen-reader labels) across all routes
- [ ] T056 Run full `quickstart.md` validation end-to-end (author → build → browse → search → filter → clear)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational
  - US1 (P1) is the MVP and should land first
  - US2 (P1) depends on Foundational; reuses the catalogue page US1 created but is independently testable
  - US3 (P2) depends on Foundational; consumes the grid/cards but is independently testable
  - US4 (P3) depends on Foundational; independent
- **Polish (Phase 7)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories.
- **US2 (P1)**: After Foundational. Builds on the catalogue page from US1 but verifiable on its own.
- **US3 (P2)**: After Foundational. Operates over rendered entries (US1/US2) but independently testable with fixtures.
- **US4 (P3)**: After Foundational. Independent.

### Within Each User Story

- Tests written first and MUST fail before implementation (Principle II)
- Schema/models (Foundational T009) before rendering
- Components before pages that compose them
- Islands (search/filters) after the grid they enhance

### Parallel Opportunities

- Setup: T003–T008 in parallel
- Foundational: T010–T014 in parallel (after T009)
- Within each story, all `[P]` tests run together, then `[P]` components
- With capacity, US1–US4 can proceed in parallel once Foundational is done

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests first (they must fail):
Task: "Unit test for vintage validator in tests/unit/vintage.test.ts"
Task: "Integration test valid entry loads in tests/integration/schema-valid.test.ts"
Task: "Integration test missing field rejected in tests/integration/schema-invalid.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1
4. **STOP and VALIDATE**: author a wine, build, confirm it appears; confirm
   invalid entries fail and `NV` is accepted.
5. Deploy/demo the static site.

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → capture + see a wine → MVP
3. US2 → polished browse + detail + empty state
4. US3 → search + filter
5. US4 → maintenance workflow + duplicate warning
6. Polish → scale/perf/a11y/release

---

## Notes

- `[P]` = different files, no incomplete dependencies
- `[Story]` labels give traceability to spec.md user stories
- Every story is independently completable and testable
- Verify tests fail before implementing (TDD, NON-NEGOTIABLE)
- Commit after each task or logical group

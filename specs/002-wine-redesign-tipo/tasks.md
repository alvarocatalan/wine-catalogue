---
description: "Task list for feature 002-wine-redesign-tipo"
---

# Tasks: Visual Redesign + Wine "Type" Field

**Input**: Design documents from `/specs/002-wine-redesign-tipo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUDED — the spec (FR-022) and Constitution Principle II (NON-NEGOTIABLE TDD)
require tests. Test tasks are written FIRST and must FAIL before implementation.

**Organization**: Grouped by user story. Story phases are ordered by dependency within
priority: **US3 (data model)** ships before **US1/US2** (which render the type label) and
**US4** (which filters by type). All of US1–US3 are P1; US4 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 / US4 (Setup, Foundational, Polish have no story label)
- Exact file paths are included in every task.

## Path Conventions

Single Astro project at repo root: `src/`, `tests/`, `public/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared assets used across the redesign.

- [X] T001 Añadir Playfair Display autohospedada vía @fontsource/playfair-display, subset latin, en WOFF2, SOLO los pesos que usan los tokens del diseño (confirmar en design/redesign-2026/.../design-tokens.css; típicamente 400 y 700). No cargar pesos ni subsets extra (respeta el presupuesto de rendimiento; Playfair es OFL, autohospedaje permitido).

**Checkpoint**: Font assets available for the foundational styling.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared visual system every redesigned surface depends on.

**⚠️ CRITICAL**: No visual story (US1, US2, US4) can be styled until this phase is complete.

- [X] T002 Merge the custom properties from `design/redesign-2026/design_handoff_catalogo_vinos/design-tokens.css` into `:root` in `src/styles/global.css` (palette, typography, spacing scale, radii, shadows, per-type `--tipo-*` colours)
- [X] T003 Add `@font-face` declarations (`font-display: swap`) for the self-hosted Playfair Display faces in `src/styles/global.css`
- [X] T004 In `src/layouts/BaseLayout.astro`, preload the primary Playfair weight (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) and set the cream background + base body typography (`--font-body`) tokens

**Checkpoint**: Token system + self-hosted fonts wired; base layout renders on the cream background.

---

## Phase 3: User Story 3 - Classify wines by type (data model) (Priority: P1) 🎯 MVP prerequisite

**Goal**: Add the mandatory `tipo` enum to the content model, mirror it in Keystatic, backfill
existing content, and provide the reusable colour-coded label component.

**Independent Test**: The model requires a valid `tipo` on every wine; the Keystatic form offers
exactly the six options; every existing wine has a type; `npm run build` fails if any wine lacks one.

### Tests for User Story 3 (write first, must FAIL) ⚠️

- [X] T005 [P] [US3] Verificar el guard de paridad SIN editarlo: en tests/unit/schema-parity.test.ts (sin cambios), confirmar que la suite está VERDE antes de tocar el schema, pasa a ROJA tras T007 (WINE_FIELDS incluye 'tipo' pero el espejo de Keystatic aún no) y vuelve a VERDE tras T008 (se añade el campo tipo a keystatic.config.ts). El test genérico compara el conjunto de claves, así que no requiere edición del código de prueba.
- [X] T006 [P] [US3] Extend `tests/unit/content-validate.test.ts`: a valid `tipo` is accepted and a missing / out-of-set `tipo` is rejected by the content schema

### Implementation for User Story 3

- [X] T007 [US3] In `src/lib/schema.ts`, add `export const TIPOS = [...] as const` + `export type TipoValue`, add `tipo: z.enum(TIPOS)` to `wineFrontmatter`, and insert `'tipo'` into `WINE_FIELDS`
- [X] T008 [US3] Mirror the field in `keystatic.config.ts` as `fields.select` with the six options (labels capitalised) and `defaultValue: 'tinto'` (form convenience only)
- [X] T009 [US3] Backfill `src/content/vinos/unico.mdoc` frontmatter with `tipo: tinto`
- [X] T010 [P] [US3] Create `src/components/TypeLabel.astro` (input `tipo: TipoValue`; renders coloured dot + uppercase text label in the type colour) per `contracts/type-taxonomy.md`
- [X] T011 [US3] Verify no silent default: confirm `npm run build` fails when a `.mdoc` omits `tipo` and succeeds after backfill (FR-005/FR-006)

**Checkpoint**: Every wine is typed; schema-parity and content-validate tests are green.

---

## Phase 4: User Story 1 - Browse a redesigned, editorial catalogue (Priority: P1)

**Goal**: Redesigned home — burgundy hero, cream grid, redesigned cards with the colour-coded
type label; whole card links to the detail page.

**Independent Test**: Load `/` and confirm the hero, grid, card layout, per-card type label,
and wine count render per the screenshots, and each card links to `/vinos/[slug]/`.

**Depends on**: Phase 2 (tokens/fonts) + US3 (`TypeLabel`, `tipo` field).

### Tests for User Story 1 (write first, must FAIL) ⚠️

- [X] T012 [P] [US1] Update `tests/e2e/browse.spec.ts` to assert the hero, grid, card layout, wine count, and a colour-coded type label on each card (NV vintage renders literally)

### Implementation for User Story 1

- [X] T013 [US1] Redesign `src/components/WineCard.astro`: bottle panel + `<Image/>`, name (Playfair), `bodega · añada`, D.O., render `<TypeLabel tipo={wine.data.tipo} />`, add `data-tipo`, keep NV literal
- [X] T014 [P] [US1] Redesign `src/components/WineGrid.astro`: `grid-template-columns: repeat(auto-fill, minmax(240px,1fr))`, `gap: 36px 28px`
- [X] T015 [US1] Redesign the hero + section header ("La colección" title, "{n} vinos", hairline) in `src/pages/index.astro`
- [X] T016 [US1] Add hero / grid / card styles (incl. hover lift + type-chip styles) to `src/styles/global.css`, honoring `prefers-reduced-motion`
- [X] T017 [P] [US1] Restyle `src/components/EmptyState.astro` to the token system

**Checkpoint**: Home renders per the design with colour-coded type labels; cards link to detail.

---

## Phase 5: User Story 2 - Read a redesigned wine detail page (Priority: P1)

**Goal**: Two-column editorial detail page with type label, data table, and tasting notes, plus
a burgundy top bar and back link.

**Independent Test**: Open a wine's detail page and confirm the two-column layout (sticky image
on desktop, stacked on mobile), type label with the correct colour, data table (Bodega / D.O. /
Añada), rendered notes, and a working "← Volver al catálogo" link.

**Depends on**: Phase 2 (tokens/fonts) + US3 (`TypeLabel`, `tipo` field).

### Tests for User Story 2 (write first, must FAIL) ⚠️

- [X] T018 [P] [US2] Update `tests/e2e/detail.spec.ts` to assert the two-column layout, type label, data table (Bodega / D.O. / Añada), rendered notes, and the back link

### Implementation for User Story 2

- [X] T019 [US2] Redesign `src/pages/vinos/[slug].astro`: burgundy top bar + back link, two-column body, `<TypeLabel/>`, name (Playfair) + `bodega` (italic), data table rows, `<Content/>` notes column
- [X] T020 [US2] Add detail-page styles (sticky image desktop / stacked mobile, data table hairlines, notes typography) to `src/styles/global.css`, honoring `prefers-reduced-motion`

**Checkpoint**: Detail page matches the screenshots; home and detail both independently functional.

---

## Phase 6: User Story 4 - Filter the catalogue by type (Priority: P2)

**Goal**: Add a `tipo` filter facet to the search island and index, combinable with the text
search, preserving the redesigned no-results state.

**Independent Test**: On `/`, type a query and confirm the grid narrows; apply the Tipo facet and
confirm only wines of that type remain; enter a no-match query and confirm the no-results state
(highlighted term + "Limpiar búsqueda"); confirm the count updates.

**Depends on**: US3 (`tipo` field) + US1 (redesigned index/cards expose `data-tipo`).

### Tests for User Story 4 (write first, must FAIL) ⚠️

- [X] T021 [P] [US4] Extend `tests/unit/search.test.ts`: `matchedFields` matches `tipo`; `passesFilters` exact-matches `tipo`; `facets().tipo` lists the present types
- [X] T022 [P] [US4] Extend `tests/component/catalogue-search.test.tsx`: selecting a type narrows the visible entries and "Limpiar" resets it
- [X] T023 [P] [US4] Update `tests/e2e/search-filter.spec.ts`: filtering by the Tipo facet narrows the grid over the built site; no-results state still works

### Implementation for User Story 4

- [X] T024 [US4] Extend `src/lib/search.ts`: add `tipo` to `WineIndexEntry` and the text `FIELDS`, add `tipo?: TipoValue` to `Filters` with an exact-match branch in `passesFilters`, and add a `tipo` array (ordered by `TIPOS`) to `facets()`
- [X] T025 [US4] Add `tipo: w.data.tipo` to the `searchIndex` projection in `src/pages/index.astro`
- [X] T026 [US4] Add the "Tipo" `<select>` facet to `src/components/CatalogueSearch.tsx` (combined with the text query + existing facets; clear resets; live count + `#no-results` reflect it) and style the "casi imperceptible" search input
- [X] T027 [US4] Redesign the no-results state (`#no-results`: ⌕ glyph, "Sin resultados", highlighted term, "Limpiar búsqueda") in `src/pages/index.astro` and `src/styles/global.css`

**Checkpoint**: All user stories independently functional; search + type facet + no-results per design.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting verification against the constitution and quality bar.

- [X] T028 [P] Update `tests/e2e/a11y.spec.ts` to run axe over the redesigned home, detail, and no-results states (WCAG AA; type-label contrast)
- [X] T029 Run `npm run perf` (Lighthouse CI) and confirm 100/100/100/100; confirm the search island stays < 20 KB gzipped
- [X] T030 [P] Run `npm run verify:static` and the no-storage guard (`tests/unit/no-storage-guard.test.ts` / `scripts/check-no-storage.mjs`) to confirm fully static output and no browser storage
- [X] T031 Run `npm run lint` (`astro check` + eslint + prettier) and resolve any issues
- [X] T032 Validate `quickstart.md` end-to-end (dev, add-a-wine via `/keystatic`, build fails on missing `tipo`, preview)
- [X] T033 [US1][US2][US4] E2E responsive (SC-007): en tests/e2e (spec nuevo responsive.spec.ts o dentro de los specs de browse/detail), fijar viewport móvil (p. ej. 390×844) y afirmar (a) el grid de la home colapsa a una columna, (b) en la ficha las dos columnas se apilan verticalmente y la imagen no es sticky, y (c) el estado "sin resultados" se renderiza dentro del layout móvil. El ancho desktop ya queda cubierto por T029 (Lighthouse desktop) y los e2e existentes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup (font files) — BLOCKS the visual stories.
- **US3 (Phase 3)**: depends on Setup; independent of Phase 2. It is the data-model prerequisite for US1/US2 (label) and US4 (facet).
- **US1 (Phase 4)**: depends on Phase 2 + US3.
- **US2 (Phase 5)**: depends on Phase 2 + US3. Independent of US1.
- **US4 (Phase 6)**: depends on US3 + US1 (uses the redesigned index/cards).
- **Polish (Phase 7)**: depends on all desired stories being complete.

### Within Each User Story

- Tests are written FIRST and MUST FAIL before implementation.
- Schema/constant before component; component before page wiring; core (search.ts) before UI (island).

### Parallel Opportunities

- T005 & T006 (US3 tests) run in parallel (different files).
- T010 (`TypeLabel.astro`) is [P] with the US3 schema edits (different file).
- T014 & T017 (WineGrid, EmptyState) run in parallel with each other (different files); both distinct from T013.
- T021, T022, T023 (US4 tests) run in parallel (different files).
- T028 & T030 (a11y, static/no-storage) run in parallel.

---

## Parallel Example: User Story 4 tests

```bash
# Launch the US4 tests together (all must fail first):
Task: "Extend tests/unit/search.test.ts for tipo match/filter/facets"
Task: "Extend tests/component/catalogue-search.test.tsx for the type facet"
Task: "Update tests/e2e/search-filter.spec.ts for the Tipo facet"
```

---

## Implementation Strategy

### MVP scope

The demonstrable MVP is **Foundational + US3 + US1**: a typed content model and a redesigned home
grid with colour-coded type labels. That alone delivers the visible redesign value and validates
the new field end-to-end.

### Incremental delivery

1. Setup + Foundational → shared token/font system ready.
2. US3 → `tipo` field + backfill + `TypeLabel` (schema/validation green).
3. US1 → redesigned home with type labels → **MVP demo**.
4. US2 → redesigned detail page.
5. US4 → type filter facet + redesigned search/no-results.
6. Polish → Lighthouse 100/100/100/100, axe, static + no-storage guards, lint, quickstart.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- [Story] label maps each task to a spec user story for traceability.
- Verify each test fails before implementing (Principle II).
- Commit after each task or logical group.
- Do not touch the other content fields, `createdAt` ordering, or the content architecture.

# Phase 0 Research: Visual Redesign + Wine "Type" Field

All Technical Context items were resolvable from the existing codebase and the design
handoff; there were **no open NEEDS CLARIFICATION** markers. This document records the
design decisions that shape Phase 1.

## Decision 1 — `tipo` as a single canonical enum reused everywhere

**Decision**: Define the six values once in `src/lib/schema.ts` as
`export const TIPOS = ['tinto','blanco','rosado','espumoso','dulce','generoso'] as const`
with `export type TipoValue = (typeof TIPOS)[number]`, and build the Zod field as
`tipo: z.enum(TIPOS)`. `keystatic.config.ts` maps the same array to `fields.select` options,
and the `TypeLabel` component + search facet import `TIPOS` / `TipoValue`.

**Rationale**: One source of truth prevents drift across the four places `tipo` appears
(Zod schema, Keystatic mirror, search index/facet, label component). Supports Principle I
(no duplication) and keeps the schema-parity test meaningful.

**Alternatives considered**: Inline string literals in each file (rejected — drift risk);
a separate `types.ts` module (rejected — `schema.ts` is already the canonical content-model
home and both Zod and `WINE_FIELDS` live there).

## Decision 2 — Required enum, no default → build fails on missing `tipo`

**Decision**: `tipo` is a required `z.enum(...)` with **no** `.default()`. The production
build (`SKIP_KEYSTATIC=true astro build`) validates every `.mdoc` through
`content.config.ts` (which spreads `wineFrontmatter`), so an entry missing `tipo` or with an
out-of-set value fails `astro build` with a content-collection error.

**Rationale**: Satisfies FR-005/FR-006 and the explicit "sin default silencioso" constraint.
Keystatic's `defaultValue: 'tinto'` only pre-fills the **authoring form** for new entries; it
does not rewrite existing files at build time, so it cannot mask a missing value on the static
build path.

**Alternatives considered**: `z.enum(...).default('tinto')` (rejected — silently hides
un-typed content, violating the constraint); a custom prebuild validation script (rejected —
the Zod schema already enforces this at build; a separate script would be redundant, though
`content-validate.test.ts` asserts the behaviour).

## Decision 3 — `content.config.ts` needs no edit

**Decision**: Leave `content.config.ts` unchanged. It already does
`z.object({ ...wineFrontmatter, foto: image() })`, so adding `tipo` to `wineFrontmatter`
propagates to the collection automatically.

**Rationale**: Minimises surface area; keeps the `image()` wiring intact.

**Alternatives considered**: Declaring `tipo` directly in `content.config.ts` (rejected —
would bypass the canonical `wineFrontmatter` / `WINE_FIELDS` used by the parity test).

## Decision 4 — Backfill `unico.mdoc` → `tipo: tinto`

**Decision**: Add `tipo: tinto` to the single existing entry (`src/content/vinos/unico.mdoc`,
Vega Sicilia "Único" — a red Ribera del Duero). Any future legacy entries get their real type.

**Rationale**: Único is unambiguously a red wine; `tinto` is correct, not a placeholder.
Committing the change is the git-based content edit required by Principle VI.

**Alternatives considered**: Editing via `/keystatic` (equivalent result; a direct file edit
is simpler for a one-line backfill and is what the fixture generator will also produce).

## Decision 5 — Type facet layered onto the existing in-memory search

**Decision**: Extend `src/lib/search.ts`: add `tipo` to `WineIndexEntry`, include it in the
free-text `FIELDS` list (so typing "tinto" matches), and add `tipo?: TipoValue` to `Filters`
with an exact-match branch in `passesFilters` and a `tipo` array in `facets()`. `index.astro`
adds `tipo` to each `searchIndex` entry. `CatalogueSearch.tsx` gains one more `<select>`
(labelled "Tipo"), combined with the text query and existing facets, preserving the
no-results state and `compose()` intersection semantics.

**Rationale**: Reuses the proven pure-function search core (Decision 7 of feature 001) and its
imperative show/hide over server-rendered cards, so `<Image/>` output is never re-rendered
(protects the performance budget). `tipo` in the index is required by FR-016.

**Alternatives considered**: A separate segmented-control filter component (rejected — the
existing `<select>` facet pattern is consistent and already accessible); a client-side fetch of
the index (rejected — violates static/no-network; index stays embedded in the page).

## Decision 6 — Self-hosted Playfair Display (WOFF2 subsets)

**Decision**: Self-host Playfair Display under `public/fonts/` as WOFF2, subsetted to the
weights/styles the design uses (Regular 400, Medium 500, and Italic 400 for the subtitle /
winery line). Declare `@font-face` with `font-display: swap` in `global.css`, and `<link
rel="preload" as="font" type="font/woff2" crossorigin>` the primary weight in `BaseLayout`.
Body/UI text keeps the system `Helvetica Neue, Helvetica, Arial, sans-serif` stack (no download).

**Rationale**: Avoids a third-party (Google Fonts) request — better for Lighthouse
performance/best-practices and privacy, and keeps the site fully self-contained. Subsetting +
preload keeps the font payload small and prevents layout-shift regressions (CLS) that would cost
the 100 performance score.

**Alternatives considered**: Google Fonts `<link>` (rejected — external request, worse perf +
privacy); `@fontsource/playfair-display` npm package (viable, but hand-subsetted WOFF2 gives a
smaller, controlled payload); variable font (rejected for now — full axis is larger than the two
static weights actually used).

## Decision 7 — Merge `design-tokens.css` into `global.css` (keep plain CSS)

**Decision**: Copy the custom properties from
`design/redesign-2026/design_handoff_catalogo_vinos/design-tokens.css` into `:root` in
`src/styles/global.css` and restyle all surfaces against them. No CSS framework is introduced
(consistent with the v1 decision to keep plain CSS).

**Rationale**: The handoff tokens are already authored as custom properties precisely to be
merged; plain CSS already meets the UI surface + WCAG AA needs (CLAUDE.md). Adding Tailwind was
evaluated and discarded for v1 and nothing here changes that trade-off.

**Alternatives considered**: Introducing Tailwind/UnoCSS (rejected — integration cost
unjustified for this small surface); CSS Modules per component (rejected — the site already uses
global class-based styling and the redesign is cohesive/global by nature).

## Decision 8 — Type label colours & WCAG AA contrast

**Decision**: Use the handoff's per-type colours (`--tipo-*`). Render the chip as a coloured
7–8 px dot + uppercase letter-spaced text in the type colour on the cream/panel background.
Verify each type-colour-on-background pair meets WCAG AA (≥ 4.5:1 for the small-caps label
text; the dot is decorative and paired with the always-present text label, so colour is never
the sole information channel). Where a colour is borderline against a surface, darken the text
token (not the dot) to reach AA while keeping the dot on-brand.

**Rationale**: Principle III requires AA and forbids colour-only signalling; the text label
("TINTO", "BLANCO", …) carries the meaning, the colour is reinforcement. This is captured as a
verifiable contract in `contracts/type-taxonomy.md`.

**Alternatives considered**: Solid coloured pill with white text (rejected — several type
colours are mid-tone and would need per-type text-colour tuning; the design specifies dot + tinted
text, which is more editorial and easier to keep AA).

## Decision 9 — Preserve ordering, other fields, and content architecture

**Decision**: Do not touch `createdAt` ordering (`orderByNewest`), the other seven fields,
`image()` wiring, or the glob loader. The redesign is presentational plus one additive field.

**Rationale**: Explicit "no tocar" constraint from the plan input; keeps the diff auditable and
the blast radius minimal.

**Alternatives considered**: None — this is a hard constraint.

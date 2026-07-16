# Contract: Build-time Search Index & Single-field Search

**Applies to**: `src/lib/search.ts`, `src/pages/index.astro` (index projection),
`src/components/CatalogueSearch.tsx`.

> **Scope decision (post-implementation)**: to match the design handoff, the catalogue
> uses a **single free-text search field with no facet dropdowns**. The earlier
> añada / D.O. / bodega facet selects (from feature 001) were removed, and the `tipo`
> filter from FR-016 is satisfied by the single field searching the `tipo` field as
> free text (typing "tinto" filters to red wines). There is no discrete facet control.

## Index entry shape (`WineIndexEntry`)

Embedded as JSON in `#wine-search-index` at build (no network, no storage). Includes
`tipo` so the single field can match on it:

```ts
interface WineIndexEntry {
  slug: string;
  nombre: string;
  bodega: string;
  denominacionOrigen: string;
  anada: string;
  tipo: TipoValue; // searchable as free text
}
```

`index.astro` MUST include `tipo: w.data.tipo` in every projected entry.

## Free-text search

A single query matches (case-insensitive, partial) across ALL fields —
`nombre`, `bodega`, `denominacionOrigen`, `anada`, `tipo` — via `matchedFields` /
`FIELDS` in `search.ts`. `compose(entries, query)` returns the visible slug → matched
fields; an empty query shows every wine; no match yields an empty set (no-results).

## Island UI (`CatalogueSearch.tsx`)

- A single `<input type="search">` labelled for all searchable fields, plus a "Limpiar"
  control that appears while a query is active, and an sr-only `aria-live` status.
- No `<select>` facets.
- Imperatively shows/hides the server-rendered cards by `data-slug` (no card
  re-render → `<Image/>` output preserved), updates the `#wine-count` header, and
  toggles `#no-results` with the highlighted term.
- Keyboard operable with an accessible label; island stays < 20 KB gz.

## Invariants

- No browser storage; no network at view time. Index embedded, filtering in-memory.
- Initial grid is server-rendered HTML and usable without the island.

## Test obligations

| Test | Assertion |
|------|-----------|
| `search.test.ts` (unit) | `matchedFields` matches every field incl. `tipo`; `compose` returns matches / empty on no match |
| `catalogue-search.test.tsx` (component) | typing filters visible cards (incl. by type as text); clear resets; aria-live present |
| `search-filter.spec.ts` (e2e) | single field filters by text, by type ("tinto"), and by D.O.; no-results + clear over the built site |

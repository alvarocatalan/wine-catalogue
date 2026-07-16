# Contract: Build-time Search Index & `tipo` Facet

**Applies to**: `src/lib/search.ts`, `src/pages/index.astro` (index projection),
`src/components/CatalogueSearch.tsx`.

## Index entry shape (`WineIndexEntry`)

Embedded as JSON in `#wine-search-index` at build (no network, no storage). This feature adds
`tipo`:

```ts
interface WineIndexEntry {
  slug: string;
  nombre: string;
  bodega: string;
  denominacionOrigen: string;
  anada: string;
  tipo: TipoValue;   // ← new, required
}
```

`index.astro` MUST include `tipo: w.data.tipo` in every projected entry.

## Free-text search

`tipo` is added to the text `FIELDS` list, so a query like "tinto" matches on the type. Matching
stays case-insensitive and partial (`matchedFields`). The matched-field badge may report "tipo".

## Type facet

- `Filters` gains `tipo?: TipoValue`.
- `passesFilters` adds an exact-match branch: `(!filters.tipo || entry.tipo === filters.tipo)`.
- `facets(entries)` returns a `tipo` array of the distinct types present (ordered by `TIPOS`
  canonical order, not alphabetical, so the control reads tinto→generoso).
- `compose()` semantics unchanged: displayed = filters ∩ text-results.

## Island UI (`CatalogueSearch.tsx`)

- Add one `<select>` labelled **"Tipo"** with an empty "Tipo (todos)" option + one option per
  present type (label = capitalised).
- The type facet combines with the single text input and the existing añada / D.O. / bodega
  facets; the "clear" control resets it; the live count and `#no-results` state reflect it.
- Cards expose `data-tipo` so the imperative show/hide keeps operating on server-rendered cards
  (no card re-render → `<Image/>` output preserved).
- Keyboard operable with an accessible label (Principle III); island stays < 20 KB gz.

## Invariants

- No browser storage; no network at view time. Index is embedded, filtering is in-memory.
- Initial grid is server-rendered HTML and usable without the island (island only refines it).

## Test obligations

| Test | Assertion |
|------|-----------|
| `search.test.ts` (unit) | `tipo` matched by `matchedFields`; `passesFilters` exact-matches `tipo`; `facets().tipo` lists present types |
| `catalogue-search.test.tsx` (component) | selecting a type narrows visible entries; clear resets |
| `search-filter.spec.ts` (e2e) | filtering by the Tipo facet narrows the grid over the built site |

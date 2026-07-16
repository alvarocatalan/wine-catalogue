// Pure, framework-free search/filter logic for the in-memory catalogue island
// (research Decision 7). No storage, no DOM — unit-testable in isolation.

export interface WineIndexEntry {
  slug: string;
  nombre: string;
  bodega: string;
  denominacionOrigen: string;
  anada: string;
}

export type Field = 'nombre' | 'bodega' | 'denominacionOrigen' | 'anada';
const FIELDS: Field[] = ['nombre', 'bodega', 'denominacionOrigen', 'anada'];

// FR-007: which field(s) contain the term (case-insensitive, partial).
export function matchedFields(entry: WineIndexEntry, query: string): Field[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FIELDS.filter((f) => entry[f].toLowerCase().includes(q));
}

export interface Filters {
  anada?: string;
  denominacionOrigen?: string;
  bodega?: string;
}

// FR-008: exact-match facet filtering.
export function passesFilters(entry: WineIndexEntry, filters: Filters): boolean {
  return (
    (!filters.anada || entry.anada === filters.anada) &&
    (!filters.denominacionOrigen || entry.denominacionOrigen === filters.denominacionOrigen) &&
    (!filters.bodega || entry.bodega === filters.bodega)
  );
}

export function facets(entries: WineIndexEntry[]) {
  const uniq = (vals: string[]) => [...new Set(vals)].sort((a, b) => a.localeCompare(b, 'es'));
  return {
    anada: uniq(entries.map((e) => e.anada)),
    denominacionOrigen: uniq(entries.map((e) => e.denominacionOrigen)),
    bodega: uniq(entries.map((e) => e.bodega)),
  };
}

// displayed = filterSet ∩ searchResults (FR-008/FR-009). Returns slug → matched
// fields (empty array when there is no active query).
export function compose(
  entries: WineIndexEntry[],
  query: string,
  filters: Filters,
): Map<string, Field[]> {
  const hasQuery = query.trim().length > 0;
  const out = new Map<string, Field[]>();
  for (const e of entries) {
    if (!passesFilters(e, filters)) continue;
    if (hasQuery) {
      const mf = matchedFields(e, query);
      if (mf.length === 0) continue;
      out.set(e.slug, mf);
    } else {
      out.set(e.slug, []);
    }
  }
  return out;
}

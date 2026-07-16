// Pure, framework-free search/filter logic for the in-memory catalogue island
// (research Decision 7). No storage, no DOM — unit-testable in isolation.
// `TipoValue` is a type-only import (erased at build → no Zod in the island bundle).
import { TIPOS, type TipoValue } from './tipos';

export interface WineIndexEntry {
  slug: string;
  nombre: string;
  bodega: string;
  denominacionOrigen: string;
  anada: string;
  tipo: TipoValue;
}

export type Field = 'nombre' | 'bodega' | 'denominacionOrigen' | 'anada' | 'tipo';
const FIELDS: Field[] = ['nombre', 'bodega', 'denominacionOrigen', 'anada', 'tipo'];

// FR-015: which field(s) contain the term (case-insensitive, partial).
export function matchedFields(entry: WineIndexEntry, query: string): Field[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FIELDS.filter((f) => entry[f].toLowerCase().includes(q));
}

export interface Filters {
  anada?: string;
  denominacionOrigen?: string;
  bodega?: string;
  tipo?: string;
}

// FR-008/FR-016: exact-match facet filtering.
export function passesFilters(entry: WineIndexEntry, filters: Filters): boolean {
  return (
    (!filters.anada || entry.anada === filters.anada) &&
    (!filters.denominacionOrigen || entry.denominacionOrigen === filters.denominacionOrigen) &&
    (!filters.bodega || entry.bodega === filters.bodega) &&
    (!filters.tipo || entry.tipo === filters.tipo)
  );
}

export function facets(entries: WineIndexEntry[]) {
  const uniq = (vals: string[]) => [...new Set(vals)].sort((a, b) => a.localeCompare(b, 'es'));
  const presentTipos = new Set(entries.map((e) => e.tipo));
  return {
    anada: uniq(entries.map((e) => e.anada)),
    denominacionOrigen: uniq(entries.map((e) => e.denominacionOrigen)),
    bodega: uniq(entries.map((e) => e.bodega)),
    // Ordered by the canonical TIPOS order (tinto→generoso), not alphabetically.
    tipo: TIPOS.filter((t) => presentTipos.has(t)),
  };
}

// displayed = filterSet ∩ searchResults (FR-008/FR-016). Returns slug → matched
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

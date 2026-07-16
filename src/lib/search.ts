// Pure, framework-free search logic for the in-memory catalogue island
// (research Decision 7). No storage, no DOM — unit-testable in isolation.
// A single free-text query matches across ALL fields (incl. `tipo`), so there
// are no separate filter facets. `TipoValue` is a type-only import (erased at
// build → no Zod in the island bundle).
import { type TipoValue } from './tipos';

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

// FR-015: which field(s) contain the term (case-insensitive, partial). Typing
// "tinto" matches on `tipo`, "rioja" on the D.O., etc.
export function matchedFields(entry: WineIndexEntry, query: string): Field[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FIELDS.filter((f) => entry[f].toLowerCase().includes(q));
}

// Returns slug → matched fields (empty array when there is no active query, i.e.
// every wine is shown). No-match wines are omitted, which drives the no-results
// state (FR-017).
export function compose(entries: WineIndexEntry[], query: string): Map<string, Field[]> {
  const hasQuery = query.trim().length > 0;
  const out = new Map<string, Field[]>();
  for (const e of entries) {
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

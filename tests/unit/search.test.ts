import { describe, it, expect } from 'vitest';
import {
  matchedFields,
  facets,
  passesFilters,
  compose,
  type WineIndexEntry,
} from '../../src/lib/search';

const entries: WineIndexEntry[] = [
  { slug: 'unico', nombre: 'Único', bodega: 'Vega Sicilia', denominacionOrigen: 'Ribera del Duero DO', anada: '2018' },
  { slug: 'reserva', nombre: 'Reserva', bodega: 'Marqués de Riscal', denominacionOrigen: 'Rioja DOCa', anada: '2019' },
  { slug: 'tondonia', nombre: 'Tondonia', bodega: 'R. López de Heredia', denominacionOrigen: 'Rioja DOCa', anada: 'NV' },
];

describe('matchedFields (FR-006 / FR-007)', () => {
  it('matches case-insensitively and partially across the four text fields', () => {
    expect(matchedFields(entries[0], 'ÚNIC')).toEqual(['nombre']);
    expect(matchedFields(entries[1], 'riscal')).toEqual(['bodega']);
    expect(matchedFields(entries[1], 'rioja')).toEqual(['denominacionOrigen']);
    expect(matchedFields(entries[0], '2018')).toEqual(['anada']);
  });

  it('reports MULTIPLE matched fields for one term', () => {
    const e: WineIndexEntry = { slug: 'x', nombre: 'de la Rosa', bodega: 'Bodega de Prueba', denominacionOrigen: 'DO de Prueba', anada: '2020' };
    expect(matchedFields(e, 'de').sort()).toEqual(['bodega', 'denominacionOrigen', 'nombre']);
  });

  it('an empty/blank query matches no field (no active search)', () => {
    expect(matchedFields(entries[0], '')).toEqual([]);
    expect(matchedFields(entries[0], '   ')).toEqual([]);
  });
});

describe('facets', () => {
  it('returns distinct, sorted values per facet field', () => {
    const f = facets(entries);
    expect(f.anada).toEqual(['2018', '2019', 'NV']);
    expect(f.denominacionOrigen).toEqual(['Ribera del Duero DO', 'Rioja DOCa']);
    expect(f.bodega).toHaveLength(3);
  });
});

describe('passesFilters + compose (FR-008 / FR-009)', () => {
  it('passesFilters narrows by exact facet value', () => {
    expect(passesFilters(entries[1], { denominacionOrigen: 'Rioja DOCa' })).toBe(true);
    expect(passesFilters(entries[0], { denominacionOrigen: 'Rioja DOCa' })).toBe(false);
  });

  it('compose = filterSet ∩ searchResults', () => {
    const res = compose(entries, 'reserva', { denominacionOrigen: 'Rioja DOCa' });
    expect([...res.keys()]).toEqual(['reserva']);
  });

  it('no query and no filter → all entries with empty matched fields', () => {
    const res = compose(entries, '', {});
    expect(res.size).toBe(3);
    expect(res.get('unico')).toEqual([]);
  });

  it('no match → empty set (drives the no-results state)', () => {
    expect(compose(entries, 'zzz', {}).size).toBe(0);
  });
});

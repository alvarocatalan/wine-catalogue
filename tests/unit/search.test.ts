import { describe, it, expect } from 'vitest';
import { matchedFields, compose, type WineIndexEntry } from '../../src/lib/search';

const entries: WineIndexEntry[] = [
  {
    slug: 'unico',
    nombre: 'Único',
    bodega: 'Vega Sicilia',
    denominacionOrigen: 'Ribera del Duero DO',
    anada: '2018',
    tipo: 'tinto',
  },
  {
    slug: 'reserva',
    nombre: 'Reserva',
    bodega: 'Marqués de Riscal',
    denominacionOrigen: 'Rioja DOCa',
    anada: '2019',
    tipo: 'blanco',
  },
  {
    slug: 'tondonia',
    nombre: 'Tondonia',
    bodega: 'R. López de Heredia',
    denominacionOrigen: 'Rioja DOCa',
    anada: 'NV',
    tipo: 'rosado',
  },
];

describe('matchedFields (FR-015)', () => {
  it('matches case-insensitively and partially across the five fields', () => {
    expect(matchedFields(entries[0], 'ÚNIC')).toEqual(['nombre']);
    expect(matchedFields(entries[1], 'riscal')).toEqual(['bodega']);
    expect(matchedFields(entries[1], 'rioja')).toEqual(['denominacionOrigen']);
    expect(matchedFields(entries[0], '2018')).toEqual(['anada']);
  });

  it('reports MULTIPLE matched fields for one term', () => {
    const e: WineIndexEntry = {
      slug: 'x',
      nombre: 'de la Rosa',
      bodega: 'Bodega de Prueba',
      denominacionOrigen: 'DO de Prueba',
      anada: '2020',
      tipo: 'tinto',
    };
    expect(matchedFields(e, 'de').sort()).toEqual(['bodega', 'denominacionOrigen', 'nombre']);
  });

  it('matches the tipo field as free text (FR-015)', () => {
    expect(matchedFields(entries[0], 'tinto')).toEqual(['tipo']);
    expect(matchedFields(entries[1], 'BLANC')).toEqual(['tipo']);
  });

  it('an empty/blank query matches no field (no active search)', () => {
    expect(matchedFields(entries[0], '')).toEqual([]);
    expect(matchedFields(entries[0], '   ')).toEqual([]);
  });
});

describe('compose — single-field free-text search (FR-015 / FR-017)', () => {
  it('filtering by a type term keeps only wines of that type', () => {
    // "tinto" matches only unico via its `tipo` field
    expect([...compose(entries, 'tinto').keys()]).toEqual(['unico']);
    expect([...compose(entries, 'blanco').keys()]).toEqual(['reserva']);
  });

  it('a text term matches across any field (e.g. D.O.)', () => {
    // "rioja" matches reserva + tondonia by D.O.
    expect([...compose(entries, 'rioja').keys()].sort()).toEqual(['reserva', 'tondonia']);
  });

  it('no query → all entries with empty matched fields', () => {
    const res = compose(entries, '');
    expect(res.size).toBe(3);
    expect(res.get('unico')).toEqual([]);
  });

  it('no match → empty set (drives the no-results state)', () => {
    expect(compose(entries, 'zzz').size).toBe(0);
  });
});

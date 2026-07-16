import { describe, it, expect } from 'vitest';
import { anadaIsFuture } from '../../src/lib/vintage';

describe('anadaIsFuture (FR-003 edge: future vintage)', () => {
  it('never flags NV', () => {
    expect(anadaIsFuture('NV', 2026)).toBe(false);
  });
  it('does not flag past or current years', () => {
    expect(anadaIsFuture('2018', 2026)).toBe(false);
    expect(anadaIsFuture('2026', 2026)).toBe(false);
  });
  it('flags a later year as future', () => {
    expect(anadaIsFuture('2030', 2026)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import keystaticConfig from '../../keystatic.config';
import { WINE_FIELDS } from '../../src/lib/schema';

// FR-026: the Keystatic schema and the content-collection schema MUST declare
// the same field set. WINE_FIELDS is the canonical list; this test locks it to
// the Keystatic `vinos` collection so the two cannot silently diverge.
describe('schema parity (FR-026)', () => {
  it('Keystatic vinos field set equals WINE_FIELDS', () => {
    const keystaticKeys = Object.keys(keystaticConfig.collections.vinos.schema).sort();
    expect(keystaticKeys).toEqual([...WINE_FIELDS].sort());
  });
});

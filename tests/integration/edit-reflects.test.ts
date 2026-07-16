import { describe, it, expect, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// MY pipeline contract (not Keystatic's panel): a content edit committed to a
// `.mdoc` is reflected on the static site after a rebuild, and createdAt is
// untouched so ordering/route stay stable. This drives a real production build.
const MDOC = 'src/content/vinos/unico.mdoc';
const original = readFileSync(MDOC, 'utf8');
const EDITED_BODEGA = 'Vega Sicilia (EDITADO US4)';

afterAll(() => {
  writeFileSync(MDOC, original); // restore the committed fixture
});

describe('edit → rebuild → reflected on the static site (FR-010)', () => {
  it('a bodega edit appears on the grid and the detail page after a rebuild', () => {
    // Simulate an edit: change bodega, keep everything else (incl. createdAt).
    writeFileSync(MDOC, original.replace(/^bodega: .*$/m, `bodega: ${EDITED_BODEGA}`));
    execSync('npm run build', { stdio: 'pipe' });

    const grid = readFileSync('dist/index.html', 'utf8');
    const detail = readFileSync('dist/vinos/unico/index.html', 'utf8');

    expect(grid).toContain(EDITED_BODEGA); // reflected on the grid card
    expect(detail).toContain(EDITED_BODEGA); // reflected on the detail page
    expect(detail).toContain('Único'); // createdAt/slug untouched → same route + name
  }, 60_000);
});

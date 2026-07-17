import { test, expect } from '@playwright/test';
import { TIPOS } from '../../src/lib/tipos';
import { expectWineCount, expectedMatchCount, readSearchIndex } from './helpers';

// US4 / FR-015, FR-017, FR-018: a single in-memory search field matches across all
// fields (incl. type). Expected counts are computed with the app's own search logic
// over the page's index rather than hardcoded, so the suite stays green as the
// catalogue grows. The committed fixture used for the presence checks is
// les-terrasses (tinto, Priorat, Álvaro Palacios, 2022). No facet dropdowns.
test('the single field filters by text and drives the no-results state', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="les-terrasses"]');
  const search = page.locator('input[type="search"]');
  const total = (await readSearchIndex(page)).length;

  await expect(card).toBeVisible();

  await search.fill('palacios'); // matches bodega Álvaro Palacios → at least les-terrasses
  await expect(card).toBeVisible();
  // The header count matches the number of wines the search logic says should match.
  await expectWineCount(page, await expectedMatchCount(page, 'palacios'));

  await search.fill('zzzzzz'); // gibberish → nothing matches
  await expect(card).toBeHidden();
  await expect(page.locator('#no-results')).toBeVisible();
  await expect(page.locator('.no-results__term')).toContainText('zzzzzz');
  await expectWineCount(page, 0);

  // "Limpiar búsqueda" inside the no-results panel resets everything.
  await page.locator('#no-results-clear').click();
  await expect(card).toBeVisible();
  await expect(page.locator('#no-results')).toBeHidden();
  await expectWineCount(page, total);
});

test('the single field filters by type as free text (FR-015)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="les-terrasses"]');
  const search = page.locator('input[type="search"]');

  await search.fill('tinto'); // les-terrasses is tinto → matches on the type field
  await expect(card).toBeVisible();
  // Reflects however many wines are tinto, per the app's own search logic.
  await expectWineCount(page, await expectedMatchCount(page, 'tinto'));

  // Filtering by a type no wine currently has drives the no-results state. Pick such
  // a type dynamically so the assertion stays valid as new wines are added.
  const index = await readSearchIndex(page);
  const absentTipo = TIPOS.find((t) => !index.some((w) => w.tipo === t));
  if (absentTipo) {
    await search.fill(absentTipo);
    await expect(card).toBeHidden();
    await expect(page.locator('#no-results')).toBeVisible();
    await expectWineCount(page, 0);
  }
});

test('the single field also matches the Denominación de Origen (FR-015)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="les-terrasses"]');
  await page.locator('input[type="search"]').fill('priorat');
  await expect(card).toBeVisible();
});

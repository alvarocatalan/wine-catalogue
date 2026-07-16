import { test, expect } from '@playwright/test';

// US4 / FR-015, FR-017, FR-018: a single in-memory search field matches across all
// fields (incl. type), over the built static site (single committed fixture:
// unico = tinto, Ribera del Duero DO, Vega Sicilia, 2018). No facet dropdowns.
test('the single field filters by text and drives the no-results state', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  const search = page.locator('input[type="search"]');

  await expect(card).toBeVisible();

  await search.fill('vega'); // matches bodega
  await expect(card).toBeVisible();

  await search.fill('zzzzzz'); // no match
  await expect(card).toBeHidden();
  await expect(page.locator('#no-results')).toBeVisible();
  await expect(page.locator('.no-results__term')).toContainText('zzzzzz');
  await expect(page.locator('#wine-count')).toContainText('0');

  // "Limpiar búsqueda" inside the no-results panel resets everything.
  await page.locator('#no-results-clear').click();
  await expect(card).toBeVisible();
  await expect(page.locator('#no-results')).toBeHidden();
  await expect(page.locator('#wine-count')).toContainText('1');
});

test('the single field filters by type as free text (FR-015)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  const search = page.locator('input[type="search"]');

  await search.fill('tinto'); // unico is tinto → matches on the type field
  await expect(card).toBeVisible();
  await expect(page.locator('#wine-count')).toContainText('1');

  await search.fill('blanco'); // no blanco wine → no results
  await expect(card).toBeHidden();
  await expect(page.locator('#no-results')).toBeVisible();
});

test('the single field also matches the Denominación de Origen (FR-015)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  await page.locator('input[type="search"]').fill('ribera');
  await expect(card).toBeVisible();
});

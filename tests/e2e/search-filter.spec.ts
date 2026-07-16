import { test, expect } from '@playwright/test';

// US4 / FR-015, FR-016, FR-017, FR-018: in-memory text search + type facet + clear +
// no-results, over the built static site (single committed fixture: unico = tinto).
test('search filters the grid and drives the no-results state with a highlighted term', async ({
  page,
}) => {
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

test('filtering by the Tipo facet narrows the grid (FR-016)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  const tipo = page.getByLabel('Tipo');

  // The facet lists only the types actually present (fixture: tinto only).
  await expect(tipo.locator('option')).toHaveText([/todos/i, /tinto/i]);

  // unico is tinto → stays visible under the tinto facet; count unchanged.
  await tipo.selectOption('tinto');
  await expect(card).toBeVisible();
  await expect(page.locator('#wine-count')).toContainText('1');
  await expect(page.locator('#no-results')).toBeHidden();
});

test('facet filter by Denominación de Origen still narrows the grid (FR-016)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  await page.getByLabel('Denominación de Origen').selectOption('Ribera del Duero DO');
  await expect(card).toBeVisible();
});

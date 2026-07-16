import { test, expect } from '@playwright/test';

// US3 / FR-006, FR-009, FR-016: in-memory search + filter + clear + no-results,
// over the built static site (single committed fixture: unico).
test('search filters the grid and drives the no-results state', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  const search = page.locator('input[type="search"]');

  await expect(card).toBeVisible();

  await search.fill('vega'); // matches bodega
  await expect(card).toBeVisible();

  await search.fill('zzzzzz'); // no match
  await expect(card).toBeHidden();
  await expect(page.locator('#no-results')).toBeVisible();

  await page.getByRole('button', { name: /limpiar/i }).click();
  await expect(card).toBeVisible();
  await expect(page.locator('#no-results')).toBeHidden();
});

test('facet filter by Denominación de Origen narrows the grid (FR-008)', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.card[data-slug="unico"]');
  await page.getByLabel('Denominación de Origen').selectOption('Ribera del Duero DO');
  await expect(card).toBeVisible();
});

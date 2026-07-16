import { test, expect } from '@playwright/test';

// US2 / FR-004: the catalogue is a grid of cards, one per wine, showing image +
// wine name + winery + vintage.
test('grid renders a card per wine with its key fields', async ({ page }) => {
  await page.goto('./');

  const cards = page.locator('ul.grid > li.card');
  await expect(cards).toHaveCount(1); // fixture: unico

  const card = cards.first();
  await expect(card).toHaveAttribute('data-nombre', 'Único');
  await expect(card.locator('.card__name')).toHaveText('Único');
  await expect(card.locator('.card__meta')).toContainText('Vega Sicilia');
  await expect(card.locator('.card__meta')).toContainText('2018');
  await expect(card.locator('img')).toBeVisible();

  // card links to its detail page
  await expect(card.locator('a')).toHaveAttribute('href', /\/wine-catalog\/vinos\/unico\/$/);
});

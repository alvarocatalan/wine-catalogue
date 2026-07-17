import { test, expect } from '@playwright/test';
import { expectWineCount, readSearchIndex } from './helpers';

// US1 (redesign) / FR-009, FR-010, FR-012, FR-013: the home shows a hero, a grid of
// redesigned cards (image + name + winery·vintage + D.O. + colour-coded type label),
// a section header with the wine count, and each card links to its detail page.
test('home renders the hero, section header count, and a redesigned card per wine', async ({
  page,
}) => {
  await page.goto('./');

  // Hero (burgundy) with the collection title.
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('.hero h1')).toContainText('Catálogo de vinos');

  // Section header count reflects the number of wines actually shipped. Derived
  // from the page's own index so adding or removing a wine never breaks this.
  const total = (await readSearchIndex(page)).length;
  expect(total).toBeGreaterThan(0);
  await expect(page.locator('ul.grid > li.card')).toHaveCount(total);
  await expectWineCount(page, total);
  await expect(page.locator('#wine-count')).toHaveAttribute('data-total', String(total));

  // The committed fixture is always present — assert its card by slug regardless of
  // how many other wines sit alongside it (order is newest-first, so don't assume
  // it is the first card).
  const card = page.locator('li.card[data-slug="les-terrasses"]');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-nombre', 'Les Terrasses');
  await expect(card).toHaveAttribute('data-tipo', 'tinto');
  await expect(card.locator('.card__name')).toHaveText('Les Terrasses');
  await expect(card.locator('.card__meta')).toContainText('Álvaro Palacios');
  await expect(card.locator('.card__meta')).toContainText('2022');
  await expect(card.locator('.card__do')).toContainText('Priorat');
  await expect(card.locator('img')).toBeVisible();

  // Colour-coded type label (text carries the meaning; colour reinforces it).
  await expect(card.locator('.type-label__text')).toHaveText(/tinto/i);

  // Whole card links to its detail page.
  await expect(card.locator('a')).toHaveAttribute(
    'href',
    /\/wine-catalogue\/vinos\/les-terrasses\/$/,
  );
});

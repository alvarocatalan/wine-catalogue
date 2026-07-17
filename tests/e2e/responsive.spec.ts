import { test, expect } from '@playwright/test';

// T033 / SC-007: the redesigned views render correctly at a mobile width — the home
// grid collapses to a single column, the detail two-column layout stacks vertically
// with a non-sticky image, and the no-results state renders within the mobile layout.
test.use({ viewport: { width: 390, height: 844 } });

const trackCount = (tpl: string) => tpl.trim().split(/\s+/).filter(Boolean).length;

test('home grid collapses to a single column on mobile', async ({ page }) => {
  await page.goto('./');
  const cols = await page
    .locator('ul.grid')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(trackCount(cols)).toBe(1);
});

test('detail columns stack and the image is not sticky on mobile', async ({ page }) => {
  await page.goto('./vinos/les-terrasses/');

  const cols = await page
    .locator('.detail__grid')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(trackCount(cols)).toBe(1);

  const position = await page
    .locator('.detail__media')
    .evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe('static');
});

test('no-results state renders within the mobile layout', async ({ page }) => {
  await page.goto('./');
  const search = page.locator('input[type="search"]');
  await expect(async () => {
    await search.fill('');
    await search.fill('zzzzzz');
    await expect(page.locator('#no-results')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  // The panel fits within the viewport width (no horizontal overflow).
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows).toBe(false);
});

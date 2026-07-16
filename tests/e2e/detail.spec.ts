import { test, expect } from '@playwright/test';

// US2 / FR-005 + FR-022: the detail page shows the large optimised image, all four
// fields, and the rendered notas body.
test('detail page shows the image, all fields, and rendered notas', async ({ page }) => {
  await page.goto('./vinos/unico/');

  await expect(page.locator('h1')).toHaveText('Único');

  const img = page.locator('.detail img');
  await expect(img).toHaveAttribute('src', /_astro\/foto\..*\.webp/); // build-optimised
  await expect(img).toHaveAttribute('alt', /Vega Sicilia/);

  const dl = page.locator('.detail dl');
  await expect(dl).toContainText('Vega Sicilia');
  await expect(dl).toContainText('Ribera del Duero DO');
  await expect(dl).toContainText('2018');

  await expect(page.locator('.notas')).toContainText('roble fino'); // Markdoc body rendered
});

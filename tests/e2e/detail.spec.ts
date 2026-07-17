import { test, expect } from '@playwright/test';

// US2 (redesign) / FR-011 + FR-012: the detail page shows a burgundy top bar with a
// back link, a two-column layout (image + data/notes), a colour-coded type label,
// the name + winery, a data table (Bodega / D.O. / Añada), and the rendered notas.
test('detail page shows the redesigned two-column layout, type label, data table, and notas', async ({
  page,
}) => {
  await page.goto('./vinos/les-terrasses/');

  // Back link in the burgundy top bar → home.
  const back = page.locator('.detail-topbar .back');
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute('href', /\/wine-catalogue\/$/);

  // Name + colour-coded type label.
  await expect(page.locator('.detail__name')).toHaveText('Les Terrasses');
  await expect(page.locator('.type-label--detail .type-label__text')).toHaveText(/tinto/i);
  await expect(page.locator('.detail__bodega')).toContainText('Álvaro Palacios');

  // Build-optimised image inside the media panel.
  const img = page.locator('.detail__media img');
  await expect(img).toHaveAttribute('src', /_astro\/les-terrasses\..*\.webp/);
  await expect(img).toHaveAttribute('alt', /Les Terrasses/);

  // Data table rows: Bodega / D.O. / Añada.
  const table = page.locator('.datatable');
  await expect(table).toContainText('Álvaro Palacios');
  await expect(table).toContainText('Priorat');
  await expect(table).toContainText('2022');

  // Notas section renders (this fixture has no tasting notes committed).
  await expect(page.locator('.notas')).toBeAttached();
});

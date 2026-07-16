import { test, expect } from '@playwright/test';

// US2 (redesign) / FR-011 + FR-012: the detail page shows a burgundy top bar with a
// back link, a two-column layout (image + data/notes), a colour-coded type label,
// the name + winery, a data table (Bodega / D.O. / Añada), and the rendered notas.
test('detail page shows the redesigned two-column layout, type label, data table, and notas', async ({
  page,
}) => {
  await page.goto('./vinos/unico/');

  // Back link in the burgundy top bar → home.
  const back = page.locator('.detail-topbar .back');
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute('href', /\/wine-catalogue\/$/);

  // Name + colour-coded type label.
  await expect(page.locator('.detail__name')).toHaveText('Único');
  await expect(page.locator('.type-label--detail .type-label__text')).toHaveText(/tinto/i);
  await expect(page.locator('.detail__bodega')).toContainText('Vega Sicilia');

  // Build-optimised image inside the media panel.
  const img = page.locator('.detail__media img');
  await expect(img).toHaveAttribute('src', /_astro\/foto\..*\.webp/);
  await expect(img).toHaveAttribute('alt', /Vega Sicilia/);

  // Data table rows: Bodega / D.O. / Añada.
  const table = page.locator('.datatable');
  await expect(table).toContainText('Vega Sicilia');
  await expect(table).toContainText('Ribera del Duero DO');
  await expect(table).toContainText('2018');

  // Rendered Markdoc notes.
  await expect(page.locator('.notas')).toContainText('roble fino');
});

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// US2 / FR-021 + Principle III: no WCAG 2.1 AA violations on the public pages.
test('catalogue grid has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('./');
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(results.violations).toEqual([]);
});

test('wine detail page has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('./vinos/unico/');
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(results.violations).toEqual([]);
});

// T046 sweep: empty/no-results state (FR-016) — reachable by searching for a term
// that matches nothing. The empty-catalogue EmptyState reuses the same .empty
// markup/role, so this also exercises that styling.
test('no-results (empty) state has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('./');
  const search = page.locator('input[type="search"]');
  // Robust against the island hydration race (see deploy-smoke).
  await expect(async () => {
    await search.fill('');
    await search.fill('zzzzz');
    await expect(page.locator('#no-results')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(results.violations).toEqual([]);
});

// T028: every search/facet control is labelled (server-rendered, so present pre-hydration).
test('search and facet controls all have accessible names (FR-015/FR-016)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByLabel('Buscar vinos')).toBeVisible();
  await expect(page.getByLabel('Tipo')).toBeVisible();
  await expect(page.getByLabel('Añada')).toBeVisible();
  await expect(page.getByLabel('Denominación de Origen')).toBeVisible();
  await expect(page.getByLabel('Bodega')).toBeVisible();
});

// T046: keyboard focus reaches the controls AND shows a visible ring (WCAG 2.4.7).
test('keyboard focus is reachable and visibly ringed', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab'); // first focusable is the search input
  const firstRinged = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { ok: false, tag: null };
    const cs = getComputedStyle(el);
    return {
      ok:
        el.matches(':focus-visible') &&
        cs.outlineStyle !== 'none' &&
        parseFloat(cs.outlineWidth) > 0,
      tag: el.tagName.toLowerCase(),
      type: (el as HTMLInputElement).type ?? null,
    };
  });
  expect(firstRinged.ok, `focused <${firstRinged.tag}> lacks a visible ring`).toBe(true);

  // Tabbing continues to reach interactive controls (selects/links/buttons).
  const reached = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    reached.add(await page.evaluate(() => document.activeElement?.tagName.toLowerCase() ?? ''));
  }
  expect([...reached].some((t) => ['select', 'a', 'button', 'input'].includes(t))).toBe(true);
});

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
  await page.goto('./vinos/les-terrasses/');
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

// T028: the single search field is labelled (server-rendered, present pre-hydration).
test('the search field has an accessible name (FR-015)', async ({ page }) => {
  await page.goto('./');
  await expect(
    page.getByLabel('Buscar vinos por nombre, bodega, D.O., añada o tipo'),
  ).toBeVisible();
});

// T028/T046: keyboard focus reaches the controls AND shows a visible indicator
// (WCAG 2.4.7). The search field indicates focus by brightening its underline
// (no box outline, per the design); other controls use the global focus ring.
test('keyboard focus is reachable and visibly indicated', async ({ page }) => {
  await page.goto('./');

  // The unfocused search underline colour.
  const before = await page
    .locator('.search')
    .evaluate((el) => getComputedStyle(el).borderBottomColor);

  await page.keyboard.press('Tab'); // first focusable is the search input
  const focus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const search = el?.closest('.search') as HTMLElement | null;
    return {
      isSearchInput: !!el && el.matches('input[type="search"]'),
      underline: search ? getComputedStyle(search).borderBottomColor : null,
    };
  });
  expect(focus.isSearchInput).toBe(true);
  // Focus brightens the underline → a visible focus indicator without a box.
  expect(focus.underline).not.toBe(before);

  // Tabbing continues to reach interactive controls, which carry the global ring.
  const reached = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    reached.add(await page.evaluate(() => document.activeElement?.tagName.toLowerCase() ?? ''));
  }
  expect([...reached].some((t) => ['a', 'button', 'input'].includes(t))).toBe(true);
});

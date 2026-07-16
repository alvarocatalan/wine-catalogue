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

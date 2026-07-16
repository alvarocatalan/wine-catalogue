import { test, expect } from '@playwright/test';

// Regression guard (dev-only): the Preact search island MUST hydrate under
// `astro dev`, where the React integration (Keystatic) is also active. A React
// Fast-Refresh preamble collision ("Identifier 'prevRefreshReg' has already been
// declared") previously broke hydration in dev only — invisible to the production
// preview suite. If the island hydrates, typing filters the grid; if it doesn't,
// the card never hides. We also assert no hydration console error leaks.
test('the search island hydrates and filters in dev (React + Preact coexist)', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/', { waitUntil: 'networkidle' });

  const card = page.locator('.card[data-slug="unico"]');
  const search = page.locator('input[type="search"]');
  await expect(card).toBeVisible();

  // Behavioural proof of hydration: a non-matching query hides the card and shows
  // the no-results state. Without hydration the island never runs and the card stays.
  // Retry the fill to ride out the cold-start dep-optimisation reload (the island
  // may hydrate a beat after the first paint — same race the a11y suite guards).
  await expect(async () => {
    await search.fill('');
    await search.fill('zzzzzz');
    await expect(card).toBeHidden({ timeout: 1000 });
    await expect(page.locator('#no-results')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });

  // Clearing restores the grid.
  await search.fill('');
  await expect(card).toBeVisible();
  await expect(page.locator('#no-results')).toBeHidden();

  // And no hydration/Fast-Refresh error was emitted.
  expect(consoleErrors.join('\n')).not.toMatch(/prevRefreshReg|Error hydrating/);
});

import { test, expect } from '@playwright/test';

// T054 — Published-site smoke. Runs AFTER a deploy, against the LIVE GitHub Pages
// URL (NOT the local build):
//   DEPLOY_URL=https://alvarocatalan.github.io/wine-catalogue/ \
//     npx playwright test tests/e2e/deploy-smoke.spec.ts
// Skipped in the normal local e2e run (no DEPLOY_URL).
test.skip(!process.env.DEPLOY_URL, 'Set DEPLOY_URL to run the published-site smoke');

test('published home loads', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1.site-title')).toBeVisible();
});

test('published detail loads with an optimised image under the correct base', async ({ page }) => {
  await page.goto('./vinos/les-terrasses/');
  await expect(page.locator('h1')).toHaveText('Les Terrasses');
  await expect(page.locator('.detail img')).toHaveAttribute(
    'src',
    /\/wine-catalogue\/_astro\/les-terrasses\..*\.webp/,
  );
});

test('published search island hydrates and filters to no-results', async ({ page }) => {
  await page.goto('./');
  const search = page.locator('input[type="search"]');
  // The Preact island hydrates after load; over the live network that lag can
  // land AFTER the first fill(), so the initial `input` event is lost. Retry the
  // interaction until the island is interactive (proves hydration, not just SSR).
  await expect(async () => {
    await search.fill('');
    await search.fill('zzzzz');
    await expect(page.locator('#no-results')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
});

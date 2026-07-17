import { expect, type Page } from '@playwright/test';
import { compose, type WineIndexEntry } from '../../src/lib/search';

// Read the wines the page actually shipped, straight from the build-time JSON index
// embedded at #wine-search-index (see src/pages/index.astro). Tests derive expected
// counts from this instead of hardcoding how many wines the catalogue holds.
export async function readSearchIndex(page: Page): Promise<WineIndexEntry[]> {
  const json = await page.locator('#wine-search-index').textContent();
  return JSON.parse(json ?? '[]') as WineIndexEntry[];
}

// How many wines a free-text query should match, computed with the SAME logic the
// island runs (src/lib/search.ts) over the page's own index — deterministic and
// race-free, unlike reading the visible-card count while the island is still
// applying the filter.
export async function expectedMatchCount(page: Page, query: string): Promise<number> {
  const index = await readSearchIndex(page);
  return compose(index, query).size;
}

// Assert the header count label reads exactly `n` ("N vino" / "N vinos"), matching
// the app's own singular/plural rule. Dynamic on purpose — pass the number derived
// from the DOM/index so the assertion survives new wines being added.
export async function expectWineCount(page: Page, n: number) {
  await expect(page.locator('#wine-count')).toHaveText(new RegExp(`^${n} vinos?$`));
}

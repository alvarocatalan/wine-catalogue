import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import preact from '@astrojs/preact';

// Keystatic + its React admin UI + Node adapter are wired ONLY in dev.
// A production build sets SKIP_KEYSTATIC=true → pure static output, no /keystatic.
const SKIP_KEYSTATIC = process.env.SKIP_KEYSTATIC === 'true';

// Preact renders the public search/filter island. Scoped to src/components so it
// never collides with Keystatic's React renderer (dev-only) over .tsx files.
const integrations = [markdoc(), preact({ include: ['**/components/**'] })];
let adapter;

if (!SKIP_KEYSTATIC) {
  const [{ default: react }, { default: keystatic }, { default: node }] = await Promise.all([
    import('@astrojs/react'),
    import('@keystatic/astro'),
    import('@astrojs/node'),
  ]);
  // React powers only Keystatic's admin UI. It MUST NOT touch our Preact island
  // (src/components) — otherwise its dev-only Fast Refresh preamble is injected
  // into the .tsx island and collides ("prevRefreshReg has already been declared"),
  // breaking hydration in `astro dev`. Mirror preact's include as react's exclude.
  integrations.push(react({ exclude: ['**/components/**'] }), keystatic());
  adapter = node({ mode: 'standalone' });
}

export default defineConfig({
  // GitHub Pages project pages (repo: wine-catalogue)
  site: 'https://alvarocatalan.github.io',
  // The production static site is served from /wine-catalogue/ (GitHub Pages project
  // page). Keystatic's admin UI + API do NOT work under a non-root `base`, so during
  // dev authoring (SKIP_KEYSTATIC unset) we serve from root. Same flag that toggles
  // the Keystatic integration above, so the two stay in sync.
  base: SKIP_KEYSTATIC ? '/wine-catalogue/' : '/',
  integrations,
  ...(adapter ? { adapter } : {}),
});

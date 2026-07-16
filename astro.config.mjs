import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// Keystatic + its React admin UI + Node adapter are wired ONLY in dev.
// A production build sets SKIP_KEYSTATIC=true → pure static output, no /keystatic.
const SKIP_KEYSTATIC = process.env.SKIP_KEYSTATIC === 'true';

const integrations = [markdoc()];
let adapter;

if (!SKIP_KEYSTATIC) {
  const [{ default: react }, { default: keystatic }, { default: node }] = await Promise.all([
    import('@astrojs/react'),
    import('@keystatic/astro'),
    import('@astrojs/node'),
  ]);
  integrations.push(react(), keystatic());
  adapter = node({ mode: 'standalone' });
}

export default defineConfig({
  // GitHub Pages project pages (repo: wine-catalog)
  site: 'https://alvarocatalan.github.io',
  // The production static site is served from /wine-catalog/ (GitHub Pages project
  // page). Keystatic's admin UI + API do NOT work under a non-root `base`, so during
  // dev authoring (SKIP_KEYSTATIC unset) we serve from root. Same flag that toggles
  // the Keystatic integration above, so the two stay in sync.
  base: SKIP_KEYSTATIC ? '/wine-catalog/' : '/',
  integrations,
  ...(adapter ? { adapter } : {}),
});

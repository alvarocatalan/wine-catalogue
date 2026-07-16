# Wine Catalogue

A minimalist, **fully static** wine catalogue. Browse a grid of wines, open a
detail page, and search/filter in-page. Content and images are **version-controlled
files in git** — there is no backend, no database, and no browser storage.

**Live site:** https://alvarocatalan.github.io/wine-catalogue/

## Stack

- **[Astro 5](https://astro.build)** (`output: 'static'`) + TypeScript (strict)
- **Plain CSS** with custom-property design tokens (`src/styles/global.css`)
- **[Preact](https://preactjs.com)** island for in-memory search/filter (hydrates
  over a build-time JSON index — no storage, no network)
- **[Keystatic](https://keystatic.com)** as a git-based CMS (`storage: local`),
  available only in local development
- Images optimised at build via `astro:assets` (`<Image />` + the `image()` helper)
- Deployed to **GitHub Pages** via GitHub Actions

A single **Zod** schema (`src/lib/schema.ts`) drives the `vinos` collection and is
mirrored by `keystatic.config.ts` (a schema-parity test keeps them in sync).

## Develop

```bash
npm install
npm run dev      # Astro dev server + the Keystatic admin panel at /keystatic
npm run build    # static build → ./dist (public site only, no server output)
npm run preview  # serve the production build locally (under /wine-catalogue/)
```

Requires Node 20 LTS+.

## Add or edit a wine

Authoring happens locally through Keystatic; publishing is a git commit.

1. `npm run dev`, then open **`/keystatic`**.
2. **Vinos → Create**. Fill `nombre`, `bodega`, `denominación de origen`, `añada`
   (`NV` or a 4-digit year), upload a `foto` (JPEG/PNG/WebP, ≤ 10 MB — refused
   otherwise), write `fotoAlt`, and optionally `notas`.
3. **Save.** Keystatic writes `src/content/vinos/<slug>.mdoc` and the image under
   `src/assets/vinos/<slug>/`.
4. **Commit and push** those files. That is the publish step — the site rebuilds
   and redeploys from the commit.

To **edit** or **delete**, open the wine in Keystatic and save/delete, then commit
and push. There is no in-app undo; recovery is via git history (see
`specs/001-wine-catalogue/quickstart.md`).

## Deploy

Pushing to **`main`** triggers `.github/workflows/deploy.yml`, which runs the
storage guard, builds with `SKIP_KEYSTATIC=true` (pure static, no `/keystatic`
route), and publishes to GitHub Pages. One-time setup: **Settings → Pages →
Source: GitHub Actions**.

## Scripts

```bash
npm run test            # Vitest: schema, vintage, search, schema-parity, guards
npm run test:island     # @testing-library/preact: the search island
npm run test:e2e        # Playwright + axe: browse, search/filter, detail, a11y, static-output
npm run lint            # astro check + ESLint + Prettier (check)
npm run format          # Prettier (write)
npm run perf            # Lighthouse CI against the local build (budgets)
npm run verify:static   # assert dist/ is pure static (no server / no /keystatic / no storage)
```

Lighthouse (desktop) scores **100 / 100 / 100 / 100** (performance, accessibility,
best-practices, SEO); the hydrated search island ships ~12 KB gz (budget 20 KB).

## Project layout

```
src/
├── content.config.ts   # vinos collection: glob(.mdoc) loader + Zod schema
├── content/vinos/      # .mdoc entries (git-versioned; written by Keystatic)
├── assets/vinos/       # co-located images (git-versioned; optimised at build)
├── lib/                # schema (Zod), vintage, search, order (pure)
├── components/         # WineCard/WineGrid (.astro), CatalogueSearch (Preact island)
├── layouts/            # BaseLayout.astro
├── pages/              # index.astro, vinos/[slug].astro
└── styles/             # global.css — plain CSS design tokens
keystatic.config.ts     # Keystatic schema (mirrors src/lib/schema.ts), storage: local
astro.config.mjs        # output: 'static'; Keystatic/react/node wired DEV-ONLY
```

See `specs/001-wine-catalogue/` for the full spec, plan, and quickstart.

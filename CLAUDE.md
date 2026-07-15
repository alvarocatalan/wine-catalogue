<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-wine-catalogue/plan.md`

Active feature: **Wine Catalogue** (`001-wine-catalogue`). Stack: Astro 5.x
static shell + a **Preact** island (`@astrojs/preact` + signals) + Tailwind CSS
4.x + TypeScript strict. Interactive, offline-capable app with **no backend**:
all wine entries and images are stored **device-locally in IndexedDB** (via
`idb`); Zod validates form input on save; image upload is validated
(JPEG/PNG/WebP, ≤ 10 MB) and resized/compressed in-browser via Canvas to WebP
Blobs; search/filter run **in-memory** (no Pagefind); a service worker
(`vite-plugin-pwa`) precaches the shell for offline. Tests: Vitest +
`@testing-library/preact` + `fake-indexeddb`, Playwright + axe, Lighthouse CI.
See also `research.md`, `data-model.md`, `contracts/`, and `quickstart.md` in
the same folder.
<!-- SPECKIT END -->

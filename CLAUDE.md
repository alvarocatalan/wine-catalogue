<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-wine-redesign-tipo/plan.md`

Active feature: **Visual Redesign + Wine Type Field** (`002-wine-redesign-tipo`) —
applies the redesign in `design/redesign-2026/` and adds a single new **required
enum** content field **`tipo`** (`tinto` | `blanco` | `rosado` | `espumoso` |
`dulce` | `generoso`), canonical in `src/lib/schema.ts` (`TIPOS`/`TipoValue`),
mirrored in `keystatic.config.ts`, added to the build-time search index as a filter
facet, and shown as a colour-coded label (`--tipo-*`) on the card and detail page;
missing `tipo` **fails the build** (no silent default). Design tokens from
`design-tokens.css` are merged into `global.css`; Playfair Display is **self-hosted**.
Previous feature: **Wine Catalogue** (`001-wine-catalogue`). Stack: **Astro 5.x**
(`output: 'static'`) + **plain CSS with custom-property tokens** (`src/styles/global.css`)
+ TypeScript strict. (**Tailwind was evaluated and discarded for v1**: small UI
surface, plain CSS already meets FR-015 + WCAG AA, integration cost not justified.)
Aligned with
**Constitution v1.1.0**: the public site is **fully static**, all content and
images are **version-controlled files in git**, and authoring is a **git-based
CMS** with **no runtime backend**. Content management uses **Keystatic**
(`@keystatic/core` + `@keystatic/astro`, `storage: { kind: 'local' }`): the admin
edits each wine at **`/keystatic`** (dev only), which writes a `.mdoc` entry to
`src/content/vinos/` and its image to `src/assets/vinos/`, both committed to git.
Images are processed at build via the Content Collections `image()` helper +
`<Image />` (`astro:assets`). A single **Zod** schema (`src/lib/schema.ts`) drives
the `vinos` collection and is mirrored by `keystatic.config.ts` (enforced by a
schema-parity test). Fields: `nombre`, `bodega`, `denominacionOrigen`, `anada`
(`NV`/`YYYY`), `tipo` (enum, feature 002), `foto`, `fotoAlt`, `notas`. Search/filter
run **in-memory** in a
small **Preact** island over a build-time text index (no storage). **Offline
viewing is out of scope for v1** (no service worker / PWA / precache).
**Prohibited**: IndexedDB / localStorage / sessionStorage. Astro note:
`output: 'hybrid'` no longer exists in Astro 5 — Keystatic's on-demand routes
(`/keystatic`, `/api/keystatic`) + `@astrojs/react` + `@astrojs/node` adapter are
wired **dev-only** so production stays static. Tests: Vitest +
`@testing-library/preact`, Playwright + axe, Lighthouse CI. See also
`research.md`, `data-model.md`, `contracts/`, and `quickstart.md` in the same
folder.
<!-- SPECKIT END -->

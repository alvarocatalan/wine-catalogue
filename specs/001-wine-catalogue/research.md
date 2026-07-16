# Phase 0 Research: Wine Catalogue (Keystatic + static Astro)

**Feature**: 001-wine-catalogue | **Date**: 2026-07-15 (re-architected for Constitution v1.1.0)

> **Direction change (2026-07-15)**: The spec was clarified (Session 2026-07-15)
> and the constitution amended to **v1.1.0** making three principles
> NON-NEGOTIABLE: static generation & deployment, all content (incl. images) as
> **version-controlled files in git**, and a **git-based CMS** with **no runtime
> backend**. This research **supersedes** the prior device-local / IndexedDB
> decisions; every "IndexedDB / device-local" decision below is **reversed**.

Each decision: **Decision** · **Rationale** · **Alternatives considered**.

---

## Decision 1 — Content management: Keystatic in local mode

- **Decision**: Use **Keystatic** (`@keystatic/core` + `@keystatic/astro`) with
  `storage: { kind: 'local' }`. The admin panel is at `/keystatic`, used **only
  in local development**. Each save is a file change the admin commits to git.
- **Rationale**: First-party Astro integration; in local mode it reads/writes the
  working tree, so create/edit/delete are ordinary git changes — exactly
  Constitution VI/VII (versioned files, git-based CMS, no runtime backend).
  Commits carry the admin's GitHub identity (FR-019).
- **Alternatives considered**: Decap/Netlify CMS (needs git-gateway/OAuth service
  → runtime backend, violates VII); TinaCMS (cloud/backend by default); Pages CMS
  (hosted GitHub-app flow, more moving parts); hand-editing `.mdoc` (no
  interactive upload UI required by FR-014).

## Decision 2 — Astro output: `static` + dev-only on-demand routes (NO `hybrid`)

- **Decision**: Keep Astro's default **`output: 'static'`**. Keystatic injects two
  `prerender: false` routes (`/keystatic`, `/api/keystatic`); add `@astrojs/react`
  and the **`@astrojs/node`** adapter **conditionally, dev-only** (env flag in
  `astro.config.mjs`). Production `astro build` emits a **pure static** artifact.
- **Rationale**: **Verified against current Astro 5 docs (2026)**: `output:
  'hybrid'` was **removed** and folded into `static`; a route opts into on-demand
  rendering with `export const prerender = false`, which needs an adapter. Gating
  Keystatic + React + adapter to dev keeps the public site static (Constitution V)
  while the admin still gets a live panel under `astro dev`.
- **Alternatives considered**: `output: 'hybrid'` (**no longer exists in Astro 5**
  — the exact trap flagged in the input); `output: 'server'` (whole site on-demand
  — violates V); always-on adapter (ships a server entry into production — needless,
  violates the static-deploy intent).
- **Version ceiling — HARD CONSTRAINT (not a preference)**: Astro **MUST stay on
  5.x**. `@keystatic/astro` supports Astro **2–5** only; **Astro 6 breaks the
  Keystatic admin panel** with React-hooks errors (Thinkmill/keystatic issue
  **#1515**, open). Do **NOT** upgrade to Astro 6/7 while Keystatic lacks support,
  regardless of npm's default `astro` being newer. Pinned baseline verified:
  `astro@5.18.2`, `zod@3` (matches `astro:content`), `@astrojs/markdoc@0.15`.

## Decision 3 — Content model: Content Layer `vinos` collection of `.mdoc`

- **Decision**: Define `vinos` in `src/content.config.ts` with the **glob loader**
  over `src/content/vinos/**/*.mdoc` and the shared Zod schema. `notas` is the
  Markdoc **body** (`format: { contentField: 'notas' }` in Keystatic); the other
  fields are frontmatter. `@astrojs/markdoc` is always installed to render bodies.
- **Rationale**: Content Layer is the Astro 5 way to load typed, schema-validated
  local files; schema validation runs at build so invalid entries **fail the
  build** (a content quality gate, Constitution I/II).
- **Alternatives considered**: plain `.md` (Keystatic favours Markdoc; safer,
  structured); JSON/YAML data entries (lose the rich notes body); a database
  (violates VI).

## Decision 4 — Images: co-located files processed by `astro:assets`

- **Decision**: Keystatic `fields.image` writes each image under **`src/assets/vinos/`**;
  frontmatter stores a path resolved by the collection schema's **`image()`**
  helper; pages render it with **`<Image />`** (`astro:assets`) as responsive,
  build-optimised WebP.
- **Rationale**: Images inside `src/` (not `public/`) are fingerprinted, resized
  and re-encoded at build → meets the image perf budget (Constitution IV) and
  stays versioned in git (VI). Matches FR-014.
- **VERIFIED against Keystatic 0.5.51 (2026-07-15)**: the `fields.image` field
  **auto-namespaces by the entry slug**. `getSrcPrefix(publicPath, slug)` =
  `` `${publicPath.replace(/\/*$/,'')}/${slug}/` `` + filename, and the file is
  written under `<directory>/<slug>/<filename>`. The filename defaults to the
  **original upload name** (`transformFilename` is identity unless overridden).
  So with `directory: 'src/assets/vinos'` + `publicPath: '../../assets/vinos/'`,
  a wine with slug `unico` (from `slugField: 'nombre'`) yields file
  `src/assets/vinos/unico/foto.png` and frontmatter `foto:
  ../../assets/vinos/unico/foto.png`, which `image()` resolves from
  `src/content/vinos/unico.mdoc`. **Smoke test green** (optimised
  `/_astro/foto.*.webp` emitted, correct `alt`). Collision-avoidance (CHK005) is
  therefore achieved by the **per-slug subfolder**, not by renaming the file.
  Note: the notas body field is **`fields.markdoc`** (not `fields.mdoc` — the
  latter throws at runtime; caught by running the real panel).
- **Alternatives considered**: images in `public/` (no optimisation — fails perf
  budget); external URLs (violates FR-014 + VI); base64 in frontmatter (bloats
  git, no optimisation).

## Decision 5 — Single source-of-truth schema + Keystatic parity

- **Decision**: One **Zod** schema (`src/lib/schema.ts`) — fields `nombre`,
  `bodega`, `denominacionOrigen`, `anada`, `foto`, `fotoAlt`, `notas` — drives the
  collection. `keystatic.config.ts` declares the **same** fields; a unit
  **schema-parity test** asserts the Keystatic field set equals the Zod keys so
  they cannot drift.
- **Rationale**: The CMS schema and collection schema must agree; a test makes
  the invariant enforceable (Constitution I/II), not aspirational.
- **Alternatives considered**: generating Keystatic fields from Zod (field APIs
  aren't 1:1 — brittle); manual sync without a test (drifts silently).

## Decision 6 — Vintage (`anada`): `YYYY` or `NV`

- **Decision**: `anada` is a string validated by `src/lib/vintage.ts`: a 4-digit
  year or the literal `"NV"`. Future years accepted but flagged suspicious in UI.
- **Rationale**: FR-003; a pure validator is trivially unit-tested (TDD).
- **Alternatives considered**: numeric-only (can't express NV); free text (loses
  validation/filterability).

## Decision 7 — Search & filter: client island over a build-time index (no storage)

- **Decision**: Server-render all cards (optimised images + `data-*` for text
  fields), embed a lightweight **JSON text index** at build, and hydrate a small
  **Preact island** (`CatalogueSearch`, `@preact/signals`) that filters **in
  memory** by toggling card visibility. Case-insensitive, partial, across
  nombre/bodega/denominacionOrigen/anada, with which-field-matched (FR-006/007);
  facets by añada / DO / bodega (FR-008/009).
- **Rationale**: Delivers as-you-type in-place search with **no backend and no
  storage** — filter state is ephemeral in memory (Constitution VI) — while
  images stay build-optimised (already in the DOM).
- **Alternatives considered**: Pagefind (extra build + fetches; overkill at
  ≤1,000 entries; prior plan already excluded it); server search (needs backend —
  violates V/VII); storing the index in localStorage/IndexedDB (violates VI).

## Decision 8 — Per-wine detail pages: statically generated

- **Decision**: `src/pages/vinos/[slug].astro` uses `getStaticPaths()` over `vinos`
  to prerender one page per wine (full `<Image />`, all fields, rendered `notas`).
- **Rationale**: Delivers "visible en el sitio publicado para cualquiera" as real
  static, shareable URLs (FR-005, FR-020).
- **Alternatives considered**: client-side detail routing (old model — needs data
  in the browser, no shareable URL); modal-only detail (no deep link).

## Decision 9 — Offline viewing: DESCOPED for v1

- **Decision (2026-07-16, product)**: Offline viewing is **out of scope for v1**.
  The catalogue is consulted **online**; there is **no service worker / PWA /
  precache** (`@vite-pwa/astro` is not used). Supersedes the earlier "precache the
  published shell" plan.
- **Rationale**: A small static catalogue on GitHub Pages; a service-worker/
  precache layer adds little v1 value. **Persistence and the no-browser-storage
  rule (Constitution VI) are unaffected** — content stays versioned in git.
- **Alternatives considered**: PWA precache of the published shell (previously
  planned; descoped); full offline authoring (violates VI — needs a client store).

## Decision 10 — Deletion & edit recovery via git history

- **Decision**: Edit/delete happen in Keystatic (commits). Deletion keeps a
  confirmation step; recovery is via **git revert/history** — no ephemeral undo
  (Clarification 2026-07-15, Q3=B).
- **Rationale**: Uses the versioning Constitution VI already guarantees; removes
  bespoke undo logic.
- **Alternatives considered**: in-app soft-delete/trash (reintroduces state git
  already provides).

## Decision 11 — Performance budgets

- **Decision**: LCP ≤ 2.0 s (Slow 4G / mid-tier); search/filter interaction ≤
  100 ms at 1,000 entries; **public island JS ≤ 20 KB gzip**; responsive WebP
  images. Asserted by Lighthouse CI; >5% regression blocks merge.
- **Rationale**: Static pages + optimised images + a tiny island reach these
  comfortably; the gate keeps them honest (Constitution IV). The budget is far
  smaller than the old CRUD-island plan (≤ 60 KB) because the public surface is
  now mostly static.
- **Alternatives considered**: no budget (unenforceable); shipping a full SPA
  framework (needless JS).

## Decision 12 — Testing strategy

- **Decision**: Vitest unit (vintage, search/compose, Zod schema, **schema-parity**
  Keystatic↔Zod); `@testing-library/preact` for the island; Playwright + axe over
  the **built** static site; `astro check` + content-schema validation as a build
  gate; Lighthouse CI. TDD: logic tests first (red) before implementation.
- **Rationale**: Mirrors the runtime surfaces; content validation at build catches
  bad `.mdoc` before deploy (Constitution II). "Data-integrity" 100% branch rule =
  schema + vintage + parity; 80% line gate elsewhere.
- **Alternatives considered**: `fake-indexeddb` (irrelevant now — no IndexedDB);
  e2e-only (poor logic coverage).

## Decision 13 — Observability: N/A (justified)

- **Decision**: The structured-logging clause is **Not Applicable** — no server
  runtime exists (deployed artifact is static files).
- **Rationale/Alternatives**: See plan.md Complexity Tracking; adding a backend to
  log would violate Constitution V/VII — worse than a documented N/A.

## Decision 14 — Identity & slug: nombre-derived slug + Keystatic dedup (frozen for v1)

- **Decision (FROZEN for v1)**: The wine data model is **final**: `nombre`,
  `bodega`, `denominacionOrigen`, `anada`, `foto`, `fotoAlt`, `notas`. Identity is
  the **slug derived from `nombre`** (`slugField: 'nombre'`), with Keystatic's
  native **`-1`, `-2`… suffix de-duplication** as the collision safety net. There
  is **no `id`/UUID field** and **no composite slug**.
- **Evaluated and rejected (spikes, 2026-07-15)** — recorded here so they are not
  revisited or mistaken for planned work:
  - **UUID-as-slug** — rejected. `fields.slug` derives the slug reactively from a
    single `name` field, the slug stays user-editable, and there is no
    "generate-once" or immutability primitive; a random UUID flickers per
    keystroke and a name-derived UUID collides → `-1` suffix. Against the grain.
  - **Separate autogenerated UUID `id` field** — rejected. Keystatic **rejects
    any non-schema frontmatter key** (verified: `Key on object value "id" is not
    allowed`), so `id` would have to be a **schema field**; Keystatic has **no
    `readOnly`/`hidden`** option (it would be an editable box) and **no function
    `defaultValue`** (cannot auto-generate), forcing an out-of-band script with a
    build-ordering coupling and only soft immutability. Not idiomatic; not worth
    it for v1.
  - **Composite slug (bodega+nombre+añada)** — rejected. `fields.slug.generate`
    only sees the single `name` field, so a composite slug requires denormalising
    the name or an out-of-band rename that fights Keystatic's slug ownership. The
    native `nombre` slug + dedup is sufficient for v1.
- **Rationale**: keeps authoring fully idiomatic in Keystatic (no fighting the
  slug field, no editable system fields, no out-of-band mutation), while dedup
  covers same-name collisions. Readable URLs (`/vinos/unico`) are a bonus.

---

## Resolved unknowns summary

All Technical Context items are resolved; **no NEEDS CLARIFICATION remain**. Lines
pinned: Astro 5.x (`output: 'static'`), `@astrojs/markdoc`, `@keystatic/core` +
`@keystatic/astro` (local, dev-only routes) with `@astrojs/react` + `@astrojs/node`
dev-only, `@astrojs/preact` + `@preact/signals`, plain CSS (`global.css`; Tailwind discarded for v1), `zod`.
No PWA/service worker (offline descoped for v1). Exact versions locked in `package.json` at implementation time.
The one integration seam to validate first is Keystatic image field ↔
`astro:assets` `image()` (Decision 4).

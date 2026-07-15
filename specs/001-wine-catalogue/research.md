# Phase 0 Research: Wine Catalogue

**Feature**: 001-wine-catalogue | **Date**: 2026-07-15 (re-architected)

> **Direction change (2026-07-15)**: The spec was refined to lock an
> **interactive web app** in which create/edit/delete/upload happen inside the
> running app and all data + images are stored **locally on the user's own
> device** (analysis findings I1/I2). This research **supersedes** the earlier
> static-site + Git-authoring decisions. The prior Decision 1 (Git authoring)
> is explicitly **reversed** below.

This document resolves the technical unknowns for a client-side, offline-capable
interactive catalogue with **no backend**.

---

## Decision 1: Data & authoring model — runtime CRUD with device-local storage

**Reverses the previous Git-authoring decision.** FR-001 (create), FR-002
(block save), FR-010 (edit), FR-011 (delete + undo), FR-012 (device-local
persistence), and FR-014 (in-app image upload) are delivered as **genuine
runtime actions inside the app**. There is still **no server and no remote
database** — persistence is the user's own browser storage.

**Decision**: All wine entries and their images live in **IndexedDB** on the
user's device. The app reads/writes them at runtime. Zod validates form input
before a write, which is the runtime equivalent of "block the save and name the
missing field" (FR-002).

**Rationale**:
- The refined spec's persona is a **non-technical wine enthusiast** who adds a
  wine "in under 90 seconds without external guidance" (SC-001). Only an in-app
  form satisfies this; a Git commit workflow does not.
- IndexedDB is the only standard browser store that holds **structured records
  + binary image Blobs** at the ~1,000-entry scale (FR-017), works **offline**
  (FR-012), and needs no backend.
- Persistence is device-local and private; the user owns backup (Assumptions).

**How requirements map under this model**:

| Requirement | Realisation |
|---|---|
| FR-001 create, FR-002 required fields, FR-003 vintage rules | In-app "Add wine" form; Zod validates on submit and blocks the save naming any missing/invalid field. |
| FR-010 edit, FR-011 delete + undo | In-app edit form; delete shows a confirm dialog then a short-lived "Undo" toast before the record is purged from IndexedDB. |
| FR-012 persistence + offline | Records + image Blobs in IndexedDB; a service worker precaches the app shell so the app itself loads offline. |
| FR-014 upload + formats + 10 MB limit + offline | `<input type="file">`, client-side MIME + size validation, Canvas resize/compress, Blobs stored in IndexedDB (no external URL). |
| FR-004/005 grid + detail, FR-006–009 search/filter, FR-013 placeholder, FR-015 minimalist, FR-016 empty states | Rendered by the interactive island over the in-memory copy of the catalogue. |

**Alternatives considered**:
- *Git-authored static content* (previous v1 plan) — **rejected**: unusable by
  the non-technical persona; contradicts SC-001/SC-005 and the refined FRs.
- *`localStorage`* — rejected: ~5 MB cap, synchronous, cannot hold image Blobs.
- *File System Access API* — rejected for v1: no Firefox/Safari support; adds
  friction (folder picker) that hurts SC-001. Possible future export/import.
- *Backend + database + accounts* — rejected: contradicts the single-user,
  no-account, no-server Assumptions and adds cost/auth surface.

---

## Decision 2: Framework & rendering — Astro shell + Preact island

**Decision**: Keep **Astro 5.x** (static output) as the **app shell** — base
layout, Tailwind styling, the single route, PWA wiring — and mount one
**Preact** island (`@astrojs/preact`) that renders the entire interactive
catalogue (list / detail / add / edit) client-side. TypeScript `strict`,
Node 20 LTS toolchain.

**Rationale**:
- Chosen by the user: reuses the existing Astro + Tailwind investment while the
  dynamic, device-local data is handled by a client island.
- Preact is the lightest first-class Astro UI integration (~4 KB + signals),
  keeping the JS budget defensible for a full CRUD app (Principle IV).
- Because entries exist only on the user's device, routes like `/wines/[slug]`
  **cannot** be statically generated. The island therefore does **client-side
  view routing** (list ⇄ detail ⇄ form) with the History API for in-session
  deep links; Astro serves a single shell page.

**Alternatives considered**: Svelte island (also excellent; Preact chosen for
smallest footprint + signals ergonomics); React SPA (larger bundle, harder
budget); Astro-only with no framework (hand-rolled reactivity for a full CRUD
app is more error-prone than Preact + signals).

---

## Decision 3: Styling — Tailwind CSS 4 (unchanged)

**Decision**: **Tailwind CSS 4.x** via `@tailwindcss/vite`, with centralised
design tokens (limited palette, spacing scale, one display + one body font).

**Rationale**: Utility-first CSS enforces the single design system (Principle
III) and the minimalist look (FR-015) without a component kit, and purges to a
tiny payload. Tokens are shared by the Astro shell and the Preact island so the
two render as one system.

**Alternatives considered**: vanilla CSS (more drift); a component kit (weight +
visual opinion fighting the bespoke minimalist look).

---

## Decision 4: Device-local persistence — IndexedDB via `idb`

**Decision**: **IndexedDB**, wrapped by the tiny **`idb`** library, behind a
typed repository module (`src/lib/db.ts`). See `contracts/wine-schema.md`.

- Object store **`wines`** (keyPath `id`, a UUID) holds the text record; index
  `by-createdAt` for default newest-first ordering.
- Object store **`images`** (key = wine `id`) holds `{ thumb: Blob, full: Blob,
  mime, width, height }`. Kept separate so the grid can load text + thumbnails
  without pulling every full-size Blob.
- Images render via `URL.createObjectURL(blob)`; object URLs are **revoked** on
  unmount to avoid leaks.
- A monotonic **schema version** on the IndexedDB database drives `upgrade`
  migrations.

**Rationale**: Separate stores keep list rendering light at 1,000 entries;
Blobs are the natural IndexedDB type for images; `idb` gives promises + types
with ~3 KB overhead.

**Alternatives considered**: single store with embedded Blobs (forces loading
all image bytes to list the catalogue); a heavier wrapper like Dexie (more
features than needed at this scale).

---

## Decision 5: Client-side image handling

**Decision**: On upload, validate then transform **in the browser**:
1. Accept only `image/jpeg`, `image/png`, `image/webp`; reject anything else
   **and any file > 10 MB** with a clear message stating formats + limit
   (FR-014, oversized/unsupported edge case).
2. Decode via `createImageBitmap`, draw to a `canvas`, and export **two** WebP
   Blobs: a `full` (max 1600 px longest edge) and a `thumb` (max 400 px) for the
   grid.
3. Store both Blobs in the `images` store.
4. On any decode/load failure at render time, fall back to a shared
   **placeholder** asset (FR-013).

**Rationale**: Client-side resize/compress caps stored size and keeps grid LCP
within budget (SC-003) with no backend. WebP gives the best size/quality. The
placeholder covers the corrupt/missing-image edge case.

**Alternatives considered**: store the original untouched (large, blows the
perf budget); a server/CDN image pipeline (adds a backend, breaks offline).

---

## Decision 6: In-memory search & filtering (replaces Pagefind)

**Decision**: Load the catalogue's **text records** (not full Blobs) into memory
on startup and search/filter in plain JS.

- Search: case-insensitive, partial match across `wineName`, `winery`,
  `designationOfOrigin`, `vintage` (FR-006, FR-007), debounced, in place.
- **Which field matched**: computed directly during matching and surfaced per
  result — trivial because we own the match logic (resolves analysis U1 and the
  "Rioja matches DO and winery" edge case).
- Facets (distinct `vintage` / `designationOfOrigin` / `winery`) derived in
  memory for the filter controls (FR-008).
- Composition: `displayed = filterSet ∩ searchResults`; one **Clear** resets
  both (FR-009).

**Rationale**: At ≤1,000 entries an in-memory scan over 4 short fields is well
under the 100 ms interaction budget (Principle IV), needs no build-time index,
and — unlike Pagefind — has full structured knowledge of which field matched.
Pagefind indexed static build output and no longer fits a device-local dataset.

**Alternatives considered**: Pagefind (build-time index over static pages —
incompatible with runtime device-local data); Fuse.js (fuzzy ranking not
required; extra weight); a DB-level index (unnecessary at this scale).

---

## Decision 7: Offline & installability — service worker (PWA)

**Decision**: A **service worker** (via `vite-plugin-pwa` / Workbox) precaches
the app shell (HTML, JS, CSS, placeholder). Add a **Web App Manifest** for
optional install. Data is already offline in IndexedDB.

**Rationale**: FR-012 and the offline edge case require browsing existing
entries (and images) offline; precaching the shell + IndexedDB data delivers a
fully offline experience, including **creating entries offline** (all writes are
local), matching the spec's offline Assumptions.

**Alternatives considered**: no service worker (app fails to load with no
network, violating the offline requirement); full runtime caching of everything
(unnecessary — user data is already local).

---

## Decision 8: Delete confirmation & undo (FR-011)

**Decision**: Delete opens an accessible **confirm dialog**; on confirm the row
disappears and a **toast with "Undo"** stays ~7 s. The record + its Blobs are
held in memory during that window and only **purged from IndexedDB when the
toast expires**; "Undo" restores them.

**Rationale**: Delivers both the confirmation step and the "brief opportunity to
undo" from US4/ FR-011 without any server, and avoids an irreversible write
until the user's grace window closes.

**Alternatives considered**: immediate hard delete (loses undo); a trash/archive
store (more than v1 needs).

---

## Decision 9: Testing strategy (Constitution Principle II)

**Decision**:
- **Unit (Vitest)**: vintage `NV`/`YYYY` validator + future-vintage flag; Zod
  form schema; search/filter/compose logic + which-field-matched; duplicate
  detection; the IndexedDB repository (via **`fake-indexeddb`**); image
  validation (MIME/size) and resize helper (mocked canvas).
- **Integration (Vitest + @testing-library/preact + fake-indexeddb)**: add form
  blocks save on missing field and persists a valid entry; grid renders one card
  per entry; edit reflects in grid + detail; delete removes (and Undo restores);
  empty and no-results states.
- **E2E (Playwright + axe)**: critical path — add a wine → see it in the grid →
  open detail → search → filter → clear → edit → delete → undo; **reload and
  confirm entries persist** (FR-012); WCAG 2.1 AA pass.
- **TDD**: logic tests written first (red) before implementation (Principle II,
  NON-NEGOTIABLE).

**"Data-integrity" 100% rule**: the Zod schema, vintage validator, and the
IndexedDB repository are exhaustively tested to **100% branch coverage**;
80% line coverage gate on the rest of shipped JS.

**Alternatives considered**: e2e-only (slow, poor logic coverage); skipping
persistence reload assertion (would leave FR-012 unverified).

---

## Decision 10: Performance budget (Constitution Principle IV)

**Decision** — budgets asserted in CI via **Lighthouse CI** against a build
seeded with **~1,000 fixture entries** in IndexedDB:

| Metric | Budget | Source |
|---|---|---|
| LCP (catalogue, throttled "Slow 4G", mid-tier mobile) | ≤ 2.0 s | SC-003 |
| App island JS (Preact + idb + app logic, gzip) | ≤ 60 KB | Principle IV (declared) |
| Search/filter interaction → results painted | ≤ 100 ms | Principle IV (<100 ms) |
| Time to find a wine in a 500-entry catalogue | ≤ 10 s | SC-002 |
| CLS | ≤ 0.05 | UX quality |

- **Budget change vs. the previous static plan**: the old ≤ 15 KB JS budget
  assumed an almost-JS-free static site. An interactive CRUD app legitimately
  ships more; **≤ 60 KB gz** is the new declared budget. Principle IV requires a
  *declared* budget with a <5% regression gate — not a specific number — so this
  is a documented budget, not a violation.
- **1,000-card rendering**: the grid uses lazy-loaded thumbnails and
  **virtualised/windowed rendering** so only visible cards mount, keeping
  browse/search/filter smooth at scale (FR-017).

**Rationale**: Formalises the interactive app's cost and guards regressions.
Measured under throttled/mid-tier conditions per Principle IV.

**Alternatives considered**: keeping the ≤ 15 KB budget (unrealistic for a CRUD
island and would force omitting required features); no budget (violates
Principle IV).

---

## Decision 11: Observability — justified constitutional deviation (unchanged)

The Additional-Constraints **Observability** clause ("every service-level
operation MUST emit structured logs with a correlation ID; every performance
budget MUST have a corresponding production metric") presupposes a backend.

**Decision**: **Partial compliance, justified.** There is still **no server
runtime**, so "structured logs + correlation ID" is **Not Applicable** (recorded
in the plan's Complexity Tracking). The performance-metric intent is met via
**Lighthouse CI**, optionally backed by a privacy-respecting **web-vitals**
beacon if a host is later added. Client-side errors are surfaced to the user via
UI states, not shipped to a server in v1.

**Rationale**: Inventing a logging backend purely to satisfy the clause would
contradict the no-server directive — a worse outcome than a documented N/A.

---

## Resolved unknowns summary

All Technical Context items are resolved; **no NEEDS CLARIFICATION remain**.
Major lines pinned (Astro 5.x, Preact via `@astrojs/preact`, Tailwind 4.x,
`idb`, `vite-plugin-pwa`); exact versions locked in `package.json` at
implementation time.

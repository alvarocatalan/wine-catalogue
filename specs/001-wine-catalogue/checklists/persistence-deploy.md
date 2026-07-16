# Requirements Quality Checklist: Image Persistence, Interactive Upload & Static Deployment

**Purpose**: Validate that the requirements covering (a) image persistence, (b) interactive image upload, and (c) static deployment are complete, clear, measurable, and mutually consistent — before implementation.
**Created**: 2026-07-15
**Feature**: [spec.md](../spec.md)
**Focus areas**: Image persistence · Interactive upload · Static deployment · Cross-area consistency
**Depth**: Standard · **Audience**: Reviewer (PR)
**Re-evaluated**: 2026-07-15 against the corrected spec — each tick cites the concrete FR/section that satisfies it; unticked items have no concrete spec source (open or consciously deferred).

> Each item tests the *requirements*, not the implementation. `[Gap]` = likely missing; `[Ambiguity]`/`[Conflict]`/`[Assumption]` flag quality issues.

## Image Persistence — Completeness

- [x] CHK001 - Are the requirements for storing images as version-controlled files in the repository stated independently of any specific tool (Keystatic) or path? [Completeness, Spec §FR-012, §FR-014] ✓ — FR-012 + FR-014 state versioned-files persistence tool-independently.
- [x] CHK002 - Is the prohibition on IndexedDB / localStorage / sessionStorage for content and images stated as a testable requirement? [Completeness, Spec §FR-012] ✓ — FR-012 ("MUST NOT use browser-only storage … as the system of record").
- [x] CHK003 - Are requirements defined for the fallback image when a wine image is missing or fails to load? [Completeness, Spec §FR-013] ✓ — FR-013 + Edge Cases (placeholder).
- [x] CHK004 - Is a requirement defined for what happens to a wine's image file when the wine entry is deleted (orphaned-asset handling)? [Gap] ✓ — Assumptions "Out of scope for v1": manual cleanup (conscious decision).
- [x] CHK005 - Are requirements defined for how image files are named/located to avoid collisions between entries (e.g., duplicate wines)? [Gap] ✓ — Assumptions + VERIFIED: Keystatic namespaces images in a per-slug subfolder (`src/assets/vinos/<slug>/`).
- [x] CHK006 - Is it specified whether images must be included in the offline precache alongside published pages? [Coverage] → **N/A for v1**: offline viewing descoped (2026-07-16) — no precache, so this no longer applies.

## Image Persistence — Clarity & Measurability

- [x] CHK007 - Is "durable persistence" for images quantified in verifiable terms (a committed file exists in git history)? [Measurability, Spec §FR-012, §FR-014] ✓ — FR-012/FR-014 (committed versioned file → checkable in git history).
- [x] CHK008 - Is the boundary between "content/images" (must be in git) and "ephemeral UI state" (allowed in memory) defined precisely enough to be unambiguous? [Clarity, Spec §FR-012] ✓ — FR-012 distinguishes system-of-record (git) from ephemeral in-memory client state.
- [x] CHK009 - Are the accepted image formats and the 10 MB size limit stated as exact, testable thresholds? [Measurability, Spec §FR-014] ✓ — FR-014 + Assumptions (JPEG/PNG/WebP, ≤ 10 MB).
- [x] CHK010 - Are output requirements for the published image (optimisation, responsive sizes, format) specified, or left entirely to implementation? [Gap] ✓ — Assumptions "Out of scope for v1": rely on Astro `<Image />` default optimisation (conscious decision).
- [x] CHK011 - Is a requirement defined for alt text presence on every wine image? [Completeness, Spec §FR-021] ✓ — FR-021 + FR-002 (fotoAlt required).

## Interactive Upload — Completeness & Clarity

- [x] CHK012 - Is the interactive upload mechanism specified unambiguously — is drag-and-drop required, or is file-picker-only acceptable? [Ambiguity, Spec §FR-014] ✓ — FR-014: both available, neither mandatory.
- [x] CHK013 - Are the requirements for the rejection message (must state accepted formats + size limit) specified precisely enough to be verifiable? [Clarity, Spec §FR-014] ✓ — FR-014 ("clear message stating the accepted formats and size limit").
- [x] CHK014 - Are requirements defined for replacing an existing image during edit (vs. keeping the current one)? [Coverage, Spec §FR-010, §FR-025] ✓ — FR-025 (new): editing retains the existing image unless the administrator explicitly replaces it (documents native Keystatic behaviour).
- [x] CHK015 - Is it specified that only the authenticated administrator may upload, and that public visitors cannot? [Completeness, Spec §FR-019] ✓ — FR-019 (admin-only authoring; public read-only).
- [x] CHK016 - Are requirements defined for the administrator's authentication (stated at the requirement level, not only in the plan)? [Completeness, Spec §FR-019] ✓ — FR-019 now states it at spec level (local environment + GitHub push credentials).
- [x] CHK017 - Are requirements defined for upload validation/failure behaviour (invalid image or missing required field)? [Gap, Exception Flow] ✓ — FR-024 (new): Keystatic surfaces a validation error and does not save when a required field is missing or the image violates format/size; no networked-upload feedback (out of scope by design).

## Static Deployment — Completeness & Measurability

- [x] CHK018 - Is "static artifact" defined with objectively verifiable criteria (e.g., no server runtime / no on-demand content routes in the deployed output)? [Measurability, Spec §FR-020, Constitution §V] ✓ — FR-020 + FR-023 + Constitution V (static output, no `/keystatic`, no server runtime).
- [x] CHK019 - Is there an explicit requirement that the authoring surface (`/keystatic` and any SSR routes) is excluded from the production deployment? [Gap, Consistency, Spec §FR-023, Constitution §V/VII] ✓ — FR-023.
- [x] CHK020 - Is the publish trigger stated unambiguously — does "a commit" alone update the published site, or is a push/CI step also required? [Ambiguity, Spec §FR-020] ✓ — FR-020: push to `main` publishes; a local commit does not.
- [x] CHK021 - Are the deployment pipeline requirements (what rebuilds and redeploys) documented, or assumed? [Assumption, Spec §FR-020] ✓ — FR-020: GitHub Pages via a GitHub Actions workflow on push to `main`.
- [x] CHK022 - Is it specified that a saved-but-uncommitted (local) edit is NOT visible on the published site? [Clarity, Spec §FR-012, §FR-020] ✓ — FR-020 ("a local commit that is not pushed MUST NOT publish").

## Cross-Area Consistency

- [x] CHK023 - Do the image-persistence (§FR-014), no-browser-storage (§FR-012), and static-deploy (§FR-020) requirements form a consistent chain (upload → committed file → built static asset → deployed) with no contradictions? [Consistency] ✓ — FR-012/FR-014/FR-020 are cross-referenced and consistent.
- [x] CHK024 - Is the "independent of any external URL" image requirement (§FR-014) consistent with serving images as static assets from a CDN/host? [Consistency, Spec §FR-014] ✓ — FR-014 (committed static asset served by the site; no external URL).
- [x] CHK025 - Is the PWA precache (HTTP cache) clearly distinguished from the prohibited browser storage so the two requirements do not appear to conflict? [Conflict] → **N/A for v1**: no PWA/precache (offline descoped). The browser-storage prohibition (FR-012 / Constitution VI) stands on its own.
- [x] CHK026 - Are the offline-viewing requirement and the git-persistence requirement consistent about what is cached vs. what is the source of record? [Consistency] → **N/A for v1**: offline viewing descoped; git remains the single source of record (FR-012 / Constitution VI), no caching layer.
- [x] CHK027 - Do the spec's field-level requirements and the plan's Keystatic/Zod schema agree on which fields exist (including the image and its alt text)? [Consistency, Spec §Key Entities] ✓ — FR-001/FR-002 + Key Entities + FR-021/FR-022 match the plan/contracts field set.

## Acceptance Criteria & Traceability

- [ ] CHK028 - Is there a measurable acceptance criterion tying published image weight/loading to the performance target (LCP)? [Measurability, Spec §SC-003, Gap] — DEFERRED (conscious, v1): no numeric image budget by decision (Assumptions); relies on Astro `<Image />` defaults. SC-003 (grid LCP) still applies.
- [x] CHK029 - Can each of the three areas (persistence, upload, static deploy) be traced to at least one explicit FR and one verification/success criterion? [Traceability] ✓ — persistence FR-012/014 (verify T009/T047), upload FR-014/018/019 (tests T019-T022), deploy FR-020/023 (smoke T054).
- [x] CHK030 - Is a requirement present that the CMS schema and the content-collection schema must not diverge (single source of truth)? [Completeness, Consistency, Spec §FR-026] ✓ — FR-026 (new): both schemas MUST declare the same field set; divergence is a defect, enforced by the schema-parity test (T019).

# Feature Specification: Wine Catalogue

**Feature Branch**: `001-wine-catalogue`

**Created**: 2026-05-29

**Status**: Draft — clarified 2026-07-15 to align with Constitution v1.1.0 (static site, git-versioned content, git-based CMS). This supersedes the earlier device-local / in-browser storage direction and resolves the spec/plan divergence (analysis findings I1/I2)

**Input**: User description: "Create an app to help me organise all the wine details I've tasted, categorising them by vintage, designation of origin, winery and wine name. The app will be a catalogue featuring an image of the wine downloaded from the internet, along with the aforementioned information; it should have a minimalist, simple design and an easy-to-use search function."

## Clarifications

### Session 2026-07-15

- Q: Offline scope under the git-versioned / static-published model? → A: Public
  site viewing works offline (PWA precache of published pages and images);
  authoring (add/edit/delete) requires connectivity to commit to git.
- Q: How does the administrator authenticate for authoring? → A: Authoring is
  local-only (Keystatic local mode); the administrator is authenticated by their
  local environment and their GitHub push credentials — there is no CMS login.
  No bespoke content backend is operated.
- Q: Deletion recovery mechanism with versioned content? → A: Deletion keeps a
  confirmation step; recovery is via git history/revert (removal is a revertible
  commit), replacing the ephemeral in-session undo.
- Q: What exactly triggers publication (FR-020)? → A: A **push to the main
  branch** triggers a **GitHub Actions** workflow that rebuilds and redeploys the
  static site to **GitHub Pages**; a local commit alone does not publish.
- Q: Is the `/keystatic` admin panel part of the published site? → A: No — it is
  available only in local development and is excluded from the production static
  site (FR-023).
- Q: Image upload mechanism (FR-014)? → A: Both a file picker and drag-and-drop
  are available; neither is mandatory — the administrator uses whichever they
  prefer.
- Q: Orphaned-image cleanup and image naming? → A: **Out of scope for v1** (a
  conscious decision): orphaned images are cleaned up manually; images are named
  after the wine's slug to avoid collisions.
- Q: Numeric image-weight / LCP budget? → A: **Out of scope for v1** (a conscious
  decision): no numeric criterion; rely on Astro `<Image />` default optimisation.
- Q: Upload validation/failure behaviour (CHK017)? → A: The Keystatic panel
  surfaces a validation error and does not save the entry when a required field
  is missing or the image violates the format/size limits, via Keystatic's
  native validation (FR-024). No upload-progress, retry, or network-upload
  feedback (that belongs to the discarded interactive model).
- Q: Image behaviour on edit (CHK014)? → A: Editing a wine retains its existing
  image unless the administrator explicitly replaces it (native Keystatic
  behaviour) — documented as FR-025.
- Q: CMS ⇆ content-collection schema parity (CHK030)? → A: Both schemas MUST
  declare the same field set; divergence is a defect, enforced by the
  schema-parity test (T019) — documented as FR-026.
- Q: Where are image format/size validated (T022 spike finding)? → A: **Not in
  Keystatic** — `fields.image` only validates presence (isRequired), not
  format/size. Format (JPEG/PNG/WebP) and size (≤10 MB) are enforced by a
  **build gate** that scans `src/assets/vinos/` and fails the build with a clear
  message (FR-014). Keystatic native validation covers only required fields and
  the `anada` NV/YYYY pattern (FR-024).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture a wine I have tasted (Priority: P1)

As the catalogue administrator, after tasting a wine I want to add it to the
catalogue by recording its vintage, designation of origin, winery, and wine
name, together with a representative image and its alt text, so that visitors
have a durable, published record of every wine.

**Why this priority**: Without the ability to add entries, the catalogue holds
no data and has no value. This is the foundation of the MVP.

**Independent Test**: In local development, open the Keystatic panel, create a
wine with all required fields and an image; confirm a versioned `.mdoc` entry
and its image are written, and that after building the site the wine appears in
the catalogue with its details and image.

**Acceptance Scenarios**:

1. **Given** the Keystatic panel is open, **When** I provide vintage,
   designation of origin, winery, wine name, and alt text, and upload a wine
   image, **Then** the entry is saved as a versioned `.mdoc` file plus image
   and, once built and published, appears in the catalogue with the image and
   details visible.
2. **Given** I am creating a new entry, **When** I leave a required field
   empty or omit the image, **Then** the CMS blocks the save and indicates
   which field is missing.
3. **Given** I am creating a new entry, **When** the wine has no specific year,
   **Then** "NV" is accepted as a valid vintage value.

---

### User Story 2 - Browse the catalogue (Priority: P1)

As a visitor, I want to see all the wines laid out as a visual catalogue, so
that I can scroll through and recognise wines at a glance by their image and
label information.

**Why this priority**: A catalogue that cannot be browsed is just a database.
Visual browsing is a primary user need stated in the request ("a catalogue
featuring an image of the wine ... minimalist, simple design").

**Independent Test**: With at least 10 wines published, open the catalogue and
confirm that all wines are visible as a grid of image + key details, with no
clutter and consistent spacing.

**Acceptance Scenarios**:

1. **Given** the catalogue contains several wines, **When** I open the main
   page, **Then** I see each wine as a card showing its image, wine name,
   winery, and vintage.
2. **Given** the catalogue is empty, **When** I open the main page, **Then**
   I see a friendly empty state.
3. **Given** I select a wine card, **When** the detail page opens, **Then**
   I see a larger image and all four fields (vintage, designation of origin,
   winery, wine name) clearly displayed.

---

### User Story 3 - Search and filter the catalogue (Priority: P2)

As a visitor, when the catalogue grows I want to quickly find a specific wine,
or all wines that share a vintage, designation of origin, or winery, so that I
can locate wines without scrolling through everything.

**Why this priority**: The user explicitly asked for "an easy-to-use search
function". Without it the catalogue becomes unusable past a few dozen
entries, but the basic browse loop is still usable, so this is P2.

**Independent Test**: With at least 30 wines spanning multiple vintages,
designations of origin, and wineries, type a single search term and confirm
that matching wines surface; then apply a vintage filter and confirm the
result narrows correctly.

**Acceptance Scenarios**:

1. **Given** the catalogue has wines with varied attributes, **When** I type
   a term into the search box, **Then** the catalogue updates in place to
   show only wines whose vintage, designation of origin, winery, or wine
   name contains that term (case-insensitive).
2. **Given** I am viewing the catalogue, **When** I select a vintage,
   designation of origin, or winery as a filter, **Then** the catalogue
   shows only matching wines and clearly indicates the active filter.
3. **Given** I have an active search or filter, **When** I clear it, **Then**
   the full catalogue is restored.
4. **Given** my search yields no matches, **When** the result is empty,
   **Then** the site shows a clear "no results" message instead of an empty
   page.

---

### User Story 4 - Maintain the catalogue (Priority: P3)

As the catalogue administrator, I want to correct mistakes in existing entries
or remove ones added by accident, so that the published catalogue stays
accurate over time.

**Why this priority**: Important for long-term use but not required for the
first useful version — the administrator can re-add or live with imperfect
entries until this lands.

**Independent Test**: In the Keystatic panel, edit an existing wine's field and
save; after committing, pushing, and the redeploy, confirm the change appears.
Separately, delete an entry and, after the redeploy, confirm it no longer
appears; confirm it can be recovered by reverting the commit.

**Acceptance Scenarios**:

1. **Given** I am the administrator editing a wine in the Keystatic panel,
   **When** I change a field and save, then commit and push, **Then** the
   updated value appears on the detail page and the catalogue grid after the
   rebuild and redeploy triggered by the push to the main branch.
2. **Given** I am the administrator deleting a wine in the Keystatic panel,
   **When** I choose to delete the entry, **Then** the CMS asks me to confirm
   before removing it (the removal is a commit).
3. **Given** I have deleted an entry by mistake, **When** I need it back,
   **Then** I can recover it by reverting the deletion commit in git history
   (there is no ephemeral in-session undo).

---

### Edge Cases

- What happens when a wine image fails to load (corrupt file, decode error)?
  The published site MUST fall back to a clean placeholder image rather than a
  broken icon, and the administrator SHOULD be able to upload a replacement in
  the CMS.
- What happens when an image is an unsupported format or exceeds 10 MB? The
  **build gate** rejects it — the build fails with a clear message naming the
  file and the reason — so it never reaches production. (The Keystatic panel
  itself does not validate image format/size.)
- What happens when two entries have identical vintage + winery + wine name?
  The catalogue MUST allow the duplicate (different bottlings or re-tastings are
  legitimate) but the CMS SHOULD surface a non-blocking warning.
- What happens for very old vintages (e.g., pre-1950) or future-dated
  vintages? The site MUST accept any plausible 4-digit year and visibly flag
  future years as suspicious.
- What happens when the catalogue is empty? The published site MUST show an
  empty state, not a blank screen.
- What happens when a search term matches multiple fields (e.g., "Rioja"
  matches both a designation of origin and a winery name)? The catalogue MUST
  return all matches and visibly indicate which field matched.
- What happens if a visitor is offline? Browsing the already-published
  catalogue (including images) MUST work offline via precache. Authoring
  (add/edit/delete) is not available offline because it requires committing to
  git; the administrator must be online to author.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the administrator to create a new wine entry
  capturing all four fields (vintage, designation of origin, winery, wine
  name), one associated image, and its alt text.
- **FR-002**: System MUST treat vintage, designation of origin, winery, wine
  name, the image (`foto`), and its alt text (`fotoAlt`) as required fields and
  block saving until all are provided.
- **FR-003**: Vintage MUST accept either a four-digit year or the value
  "NV" (non-vintage).
- **FR-004**: System MUST display the catalogue as a visual grid where each
  wine is represented by a card showing its image, wine name, winery, and
  vintage.
- **FR-005**: System MUST provide a detail view for any wine showing the
  larger image and all four fields.
- **FR-006**: System MUST provide a single, always-visible search input on
  the main catalogue view that filters entries in place as the visitor types.
- **FR-007**: Search MUST match (case-insensitive, partial match) against
  wine name, winery, designation of origin, and vintage, and MUST visibly
  indicate which field(s) matched each result.
- **FR-008**: System MUST provide filter controls allowing the visitor to
  narrow the catalogue by vintage, designation of origin, or winery, and to
  combine an active filter with a search term.
- **FR-009**: System MUST clearly indicate active filters and allow the
  visitor to clear them in one action.
- **FR-010**: System MUST allow the administrator to edit any field of an
  existing wine entry.
- **FR-011**: System MUST allow the administrator to delete a wine entry
  behind a confirmation step. Recovery of a deleted entry is provided through
  git history/revert (its removal is a revertible commit); no ephemeral
  in-session undo is required.
- **FR-012**: System MUST persist all wine entries and their images durably as
  version-controlled files committed to the project's git repository, and MUST
  NOT use browser-only storage (IndexedDB, localStorage, or sessionStorage) as
  the system of record for content or images. Content MUST therefore be
  identical for every visitor of the published site. The published catalogue
  MUST be viewable offline via precache; authoring actions require connectivity
  to commit to git. (Authoring/CMS: FR-018; deployment: FR-020.)
- **FR-013**: System MUST display a neutral placeholder image whenever the
  configured wine image cannot be loaded.
- **FR-014**: System MUST allow the administrator to attach a wine image by
  uploading an image file in the git-based CMS through **either a file picker or
  drag-and-drop** — both MUST be available and neither is mandatory (the
  administrator uses whichever they prefer). The administrator is responsible for
  sourcing the image themselves (typically by downloading it from the internet
  beforehand). Accepted image formats are JPEG, PNG, and WebP with a per-image
  size limit of 10 MB, **enforced by a build gate** — the Keystatic panel cannot
  validate image format/size, so a pipeline check scans the committed images in
  `src/assets/vinos/` and **fails the build** with a clear message (file + reason)
  if any image is an unsupported format or exceeds the size limit, so no invalid
  image can reach production. The uploaded image MUST
  be committed to the git repository as a versioned file and served as a static
  asset of the published site, so it is durable, versioned alongside the rest of
  the wine's data, visible to anyone viewing the published site, and independent
  of any external URL.
- **FR-015**: System MUST present a minimalist visual design — limited
  colour palette, generous whitespace, no decorative chrome — across all
  views.
- **FR-016**: System MUST show an explicit empty state when the catalogue
  contains no entries and when a search/filter returns no matches.
- **FR-017**: System MUST handle a personal-scale catalogue of at least
  1,000 entries without visible slowdown of search, filter, or browse
  actions.
- **FR-018**: Content authoring (create, edit, delete) MUST be performed by the
  administrator through a git-based CMS whose actions result in commits to the
  repository; there MUST be no runtime server backend that owns, mutates, or
  serves content independently of git. (Persistence: FR-012; deployment: FR-020.)
- **FR-019**: Authoring runs only in the administrator's **local development
  environment**; the administrator is authenticated by their local machine and
  their **GitHub push credentials** (used to push the commits that publish).
  There is no CMS login. Only the administrator may author content. Public
  visitors MUST be able to view the published catalogue without authentication
  and MUST NOT be able to upload or modify any content.
- **FR-020**: The catalogue site MUST be generated and deployed as a static
  artifact to **GitHub Pages** via a **GitHub Actions** workflow triggered by a
  **push to the main branch** (and manual `workflow_dispatch`); the workflow
  builds the site with the admin panel disabled (see FR-023) and publishes the
  static output to Pages. A local commit that is not pushed MUST NOT publish.
- **FR-021**: System MUST capture a short alt-text description for each wine
  image and render it as the image's `alt` attribute on the published site
  (accessibility).
- **FR-022**: System MUST allow the administrator to record optional free-text
  notes for a wine; when present, the notes MUST be shown on the wine's detail
  view.
- **FR-023**: The `/keystatic` administration panel MUST be available only in
  local development and MUST NOT be part of the published static site (it is
  excluded from the production build and deployment; see FR-020).
- **FR-024**: The Keystatic admin panel MUST surface a validation error and MUST
  NOT save a wine entry when a **required field is missing or the `anada` value
  does not match the `NV`/`YYYY` pattern**, using Keystatic's native field
  validation. Keystatic's native validation does **not** cover image format or
  size — those are enforced by the FR-014 build gate. No upload-progress
  indicators, retries, or network-upload feedback are required — authoring is
  local, not a networked upload.
- **FR-025**: When editing a wine, its existing image MUST be retained unless the
  administrator explicitly replaces it (native Keystatic behaviour; see FR-010).
- **FR-026**: The Keystatic schema (`keystatic.config.ts`) and the
  content-collection schema (Zod, `src/lib/schema.ts`) MUST declare the same set
  of fields; any divergence is a defect (enforced by the schema-parity test,
  task T019).

### Key Entities

- **Wine Entry**: A single wine the administrator has tasted. Attributes: vintage
  (4-digit year or "NV"), designation of origin (free text), winery (free
  text), wine name (free text), image (an image file uploaded by the
  administrator and committed to the repository as a versioned static asset),
  image alt text (short description for accessibility), notes (optional free
  text), creation timestamp. Each entry is uniquely
  identified independently of its fields, so legitimate duplicates are
  permitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can add a wine in the Keystatic panel — filling
  all required fields and attaching the image — in under 90 seconds, excluding
  the separate commit-and-push publish step.
- **SC-002**: With a catalogue of 500 wines, a visitor can locate any
  specific wine they remember via search in under 10 seconds (single
  query, no scrolling).
- **SC-003**: The catalogue grid presents the first screen of wines within
  2 seconds of opening the app on a typical home internet connection.
- **SC-004**: At least 95% of single-term searches surface the intended
  wine within the first 10 visible results. (Observational metric — validated
  by usage review, not a build gate.)
- **SC-005**: When asked to describe the site's purpose after one minute of
  use, a first-time visitor uses the words "catalogue", "wine", and "search"
  or close synonyms — confirming the minimalist design communicates intent.
- **SC-006**: Visitors report the design as "simple" or "easy" in at least 8
  of 10 informal usability checks; no visitor gets stuck looking for the
  search or filter controls.

## Assumptions

- A single administrator authors the catalogue; the published catalogue is
  publicly readable by anyone. No multi-author or multi-tenant concerns in v1.
- Web-accessible app, usable from both desktop and mobile browsers;
  responsive layout. Native mobile and desktop wrappers are out of scope
  for v1.
- Structured tasting metrics (ratings, score, date tasted, food pairing,
  price) are out of scope for v1. The catalogue captures the four structured
  fields (vintage, designation of origin, winery, wine name), the image with
  its alt text, and an optional free-text notes field.
- "Designation of origin" is recorded as free text using whatever
  convention the administrator prefers (e.g., "Rioja DOCa", "Chianti DOCG").
  No enforced taxonomy or external validation.
- The catalogue scale is personal — up to ~1,000 entries. Larger-scale
  performance is not a goal.
- All wine entries and their images are stored as version-controlled files in
  the project's git repository and published as a static site; there is no
  runtime server backend and no browser-only storage (IndexedDB / localStorage
  / sessionStorage) used as the system of record. Create, edit, and delete
  actions are performed by the administrator through a git-based CMS and take
  effect as commits that trigger a rebuild and redeploy of the static site.
- The catalogue's durability and history come from the git repository (and its
  hosting on GitHub); no separate backup mechanism is specified for v1.
- Accepted image formats are JPEG, PNG, and WebP, with a default per-image
  size limit of 10 MB. These defaults can be revisited but MUST remain
  explicit so that the build-gate validation (FR-014) is testable.
- All UI text is in English for v1. Additional locales are out of scope.
- Offline behaviour: the published catalogue (pages and images) MUST be
  viewable and searchable offline via precache. Authoring requires connectivity
  because it commits to git.
- The administrator is expected to source the wine image themselves (typically
  by searching the winery's website or a public image search) before uploading.
  The site does not perform any web search on the administrator's behalf.
- **Out of scope for v1 (conscious decisions, not gaps)**:
  - Automatic cleanup of orphaned images when a wine is deleted is out of
    scope; the image file is removed manually. To avoid collisions, Keystatic
    stores each wine's image in a per-slug subfolder
    (`src/assets/vinos/<slug>/`).
  - No numeric image-weight or image-specific LCP budget is defined; image
    optimisation relies on the default behaviour of Astro's `<Image />`
    component.

## Dependencies

- The administrator must obtain the wine image themselves (typically by
  downloading it from the internet) before adding the entry.
- Authoring depends on connectivity to the git host (GitHub) so that CMS
  actions can be committed and **pushed to the main branch** (the push triggers
  the GitHub Actions build + deploy to GitHub Pages); viewing the published
  site has no such dependency once its assets are precached.

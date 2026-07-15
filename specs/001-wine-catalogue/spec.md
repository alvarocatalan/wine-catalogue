# Feature Specification: Wine Catalogue

**Feature Branch**: `001-wine-catalogue`

**Created**: 2026-05-29

**Status**: Draft — refined 2026-07-15 to lock the interactive-app direction and reconcile the spec/plan divergence (analysis findings I1/I2)

**Input**: User description: "Create an app to help me organise all the wine details I've tasted, categorising them by vintage, designation of origin, winery and wine name. The app will be a catalogue featuring an image of the wine downloaded from the internet, along with the aforementioned information; it should have a minimalist, simple design and an easy-to-use search function."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture a wine I have tasted (Priority: P1)

As a wine enthusiast, after tasting a wine I want to add it to my personal
catalogue by recording its vintage, designation of origin, winery, and wine
name, together with a representative image, so that I keep a durable record
of every wine I have tried.

**Why this priority**: Without the ability to add entries, the app holds no
data and has no value. This is the foundation of the MVP.

**Independent Test**: Open the empty app, add a single new wine with all four
fields and an image, then confirm the wine appears in the catalogue with the
correct details and image displayed.

**Acceptance Scenarios**:

1. **Given** the app is open and empty, **When** I provide a vintage,
   designation of origin, winery, wine name, and upload a wine image file,
   **Then** the entry is saved and appears in the catalogue with the image
   and details visible.
2. **Given** I am creating a new entry, **When** I leave a required field
   empty and attempt to save, **Then** the app blocks the save and tells me
   which field is missing.
3. **Given** I am creating a new entry, **When** I enter a non-vintage wine
   (no specific year), **Then** the app accepts "NV" as a valid vintage value.

---

### User Story 2 - Browse my catalogue (Priority: P1)

As a wine enthusiast, I want to see all the wines I have tasted laid out as
a visual catalogue, so that I can scroll through and recognise wines at a
glance by their image and label information.

**Why this priority**: A catalogue that cannot be browsed is just a database.
Visual browsing is a primary user need stated in the request ("a catalogue
featuring an image of the wine ... minimalist, simple design").

**Independent Test**: With at least 10 wines already added, open the
catalogue view and confirm that all wines are visible as a grid of image +
key details, with no clutter and consistent spacing.

**Acceptance Scenarios**:

1. **Given** my catalogue contains several wines, **When** I open the main
   view, **Then** I see each wine as a card showing its image, wine name,
   winery, and vintage.
2. **Given** my catalogue is empty, **When** I open the main view, **Then**
   I see a friendly empty state inviting me to add my first wine.
3. **Given** I tap on a wine card, **When** the detail view opens, **Then**
   I see a larger image and all four fields (vintage, designation of origin,
   winery, wine name) clearly displayed.

---

### User Story 3 - Search and filter the catalogue (Priority: P2)

As a wine enthusiast, when my catalogue grows I want to quickly find a
specific wine, or all wines that share a vintage, designation of origin, or
winery, so that I can recall what I have tasted without scrolling through
everything.

**Why this priority**: The user explicitly asked for "an easy-to-use search
function". Without it the catalogue becomes unusable past a few dozen
entries, but the basic Add/Browse loop is still usable, so this is P2.

**Independent Test**: With at least 30 wines spanning multiple vintages,
designations of origin, and wineries, type a single search term and confirm
that matching wines surface; then apply a vintage filter and confirm the
result narrows correctly.

**Acceptance Scenarios**:

1. **Given** my catalogue has wines with varied attributes, **When** I type
   a term into the search box, **Then** the catalogue updates in place to
   show only wines whose vintage, designation of origin, winery, or wine
   name contains that term (case-insensitive).
2. **Given** I am viewing the catalogue, **When** I select a vintage,
   designation of origin, or winery as a filter, **Then** the catalogue
   shows only matching wines and clearly indicates the active filter.
3. **Given** I have an active search or filter, **When** I clear it, **Then**
   the full catalogue is restored.
4. **Given** my search yields no matches, **When** the result is empty,
   **Then** the app shows a clear "no results" message instead of an empty
   page.

---

### User Story 4 - Maintain my entries (Priority: P3)

As a wine enthusiast, I want to correct mistakes in existing entries or
remove ones I added by accident, so that my catalogue stays accurate over
time.

**Why this priority**: Important for long-term use but not required for the
first useful version — initial users can re-add or live with imperfect
entries until this lands.

**Independent Test**: Open an existing wine entry, change one field, save,
and confirm the change persists in the catalogue. Separately, delete an
entry and confirm it no longer appears.

**Acceptance Scenarios**:

1. **Given** I am viewing a wine's detail page, **When** I edit any field
   and save, **Then** the updated value is reflected immediately in both
   the detail view and the catalogue grid.
2. **Given** I am viewing a wine's detail page, **When** I choose to delete
   the entry, **Then** the app asks me to confirm before the entry is
   permanently removed.
3. **Given** I have deleted an entry by mistake, **When** I act
   immediately, **Then** I have a brief opportunity to undo the deletion.

---

### Edge Cases

- What happens when an uploaded image file fails to load (corrupt file,
  storage error)? The app MUST fall back to a clean placeholder image
  rather than a broken icon, and SHOULD let the user re-upload from the
  detail view.
- What happens when the user tries to upload an oversized or unsupported
  file? The app MUST refuse the upload with a clear message stating the
  accepted formats and size limit.
- What happens when two entries have identical vintage + winery + wine name?
  The app MUST allow the duplicate (different bottlings or re-tastings are
  legitimate) but SHOULD surface a non-blocking warning.
- What happens for very old vintages (e.g., pre-1950) or future-dated
  vintages? The app MUST accept any plausible 4-digit year and visibly flag
  future years as suspicious.
- What happens when the catalogue is empty? The app MUST show an empty
  state inviting the first entry, not a blank screen.
- What happens when a search term matches multiple fields (e.g., "Rioja"
  matches both a designation of origin and a winery name)? The app MUST
  return all matches and visibly indicate which field matched.
- What happens if the user is offline when adding or browsing wines?
  Browsing existing entries (including their images) MUST work offline
  because images are stored locally after upload. Creating new entries
  offline is allowed provided the user has the image file at hand.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to create a new wine entry
  capturing all four fields (vintage, designation of origin, winery, wine
  name) and one associated image.
- **FR-002**: System MUST treat vintage, designation of origin, winery, and
  wine name as required fields and block saving until all are provided.
- **FR-003**: Vintage MUST accept either a four-digit year or the value
  "NV" (non-vintage).
- **FR-004**: System MUST display the catalogue as a visual grid where each
  wine is represented by a card showing its image, wine name, winery, and
  vintage.
- **FR-005**: System MUST provide a detail view for any wine showing the
  larger image and all four fields.
- **FR-006**: System MUST provide a single, always-visible search input on
  the main catalogue view that filters entries in place as the user types.
- **FR-007**: Search MUST match (case-insensitive, partial match) against
  wine name, winery, designation of origin, and vintage, and MUST visibly
  indicate which field(s) matched each result.
- **FR-008**: System MUST provide filter controls allowing the user to
  narrow the catalogue by vintage, designation of origin, or winery, and to
  combine an active filter with a search term.
- **FR-009**: System MUST clearly indicate active filters and allow the
  user to clear them in one action.
- **FR-010**: System MUST allow the user to edit any field of an existing
  wine entry.
- **FR-011**: System MUST allow the user to delete a wine entry, with a
  confirmation step and a short-lived undo opportunity.
- **FR-012**: System MUST persist all wine entries and their images durably
  on the user's own device so the catalogue survives closing and reopening
  the app, with no account, sign-in, or remote server required, and MUST make
  the stored catalogue available offline.
- **FR-013**: System MUST display a neutral placeholder image whenever the
  configured wine image cannot be loaded.
- **FR-014**: System MUST allow the user to attach a wine image by
  uploading an image file from their device. The user is responsible for
  sourcing the image themselves (typically by downloading it from the
  internet beforehand). The app MUST accept common image formats
  (JPEG, PNG, WebP), enforce a per-image size limit of 10 MB (rejecting
  larger files with a clear message stating the accepted formats and size
  limit), and store the uploaded image locally on the user's device so that
  it remains available offline and is not dependent on any external URL
  after upload.
- **FR-015**: System MUST present a minimalist visual design — limited
  colour palette, generous whitespace, no decorative chrome — across all
  views.
- **FR-016**: System MUST show an explicit empty state when the catalogue
  contains no entries and when a search/filter returns no matches.
- **FR-017**: System MUST handle a personal-scale catalogue of at least
  1,000 entries without visible slowdown of search, filter, or browse
  actions.

### Key Entities

- **Wine Entry**: A single wine the user has tasted. Attributes: vintage
  (4-digit year or "NV"), designation of origin (free text), winery (free
  text), wine name (free text), image (an image file uploaded by the user
  and stored by the app), creation timestamp. Each entry is uniquely
  identified independently of its fields, so legitimate duplicates are
  permitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can add their first wine entry — including
  finding/attaching the image — in under 90 seconds without external
  guidance.
- **SC-002**: With a catalogue of 500 wines, a user can locate any
  specific wine they remember via search in under 10 seconds (single
  query, no scrolling).
- **SC-003**: The catalogue grid presents the first screen of wines within
  2 seconds of opening the app on a typical home internet connection.
- **SC-004**: At least 95% of single-term searches surface the intended
  wine within the first 10 visible results.
- **SC-005**: When asked to describe the app's purpose after one minute of
  use, a non-technical user uses the words "catalogue", "wine", and
  "search" or close synonyms — confirming the minimalist design
  communicates intent.
- **SC-006**: Users report the design as "simple" or "easy" in at least 8
  of 10 informal usability checks; no user gets stuck looking for the add,
  search, or filter controls.

## Assumptions

- Single-user, personal catalogue: no accounts, no sharing, no
  multi-tenant concerns in v1.
- Web-accessible app, usable from both desktop and mobile browsers;
  responsive layout. Native mobile and desktop wrappers are out of scope
  for v1.
- Tasting impressions (notes, ratings, score, date tasted, food pairing,
  price) are out of scope for v1. Only the four fields the user enumerated,
  plus the image, are captured.
- "Designation of origin" is recorded as free text using whatever
  convention the user prefers (e.g., "Rioja DOCa", "Chianti DOCG"). No
  enforced taxonomy or external validation.
- The catalogue scale is personal — up to ~1,000 entries. Larger-scale
  performance is not a goal.
- All wine entries and their images are stored locally on the user's own
  device (in-browser, client-side storage); there is no remote server or
  shared database in v1, so the catalogue is private to that device. All
  create, edit, and delete actions happen inside the running app, not through
  any external authoring or deployment step.
- The user is responsible for backup of their personal catalogue;
  cross-device sync is out of scope unless added later.
- Accepted image formats are JPEG, PNG, and WebP, with a default per-image
  size limit of 10 MB. These defaults can be revisited but MUST remain
  explicit so that upload validation is testable.
- All UI text is in English for v1. Additional locales are out of scope.
- Offline behaviour: because images are uploaded and stored locally,
  viewing and searching the existing catalogue MUST work offline. Adding
  new entries also works offline as long as the user has the image file at
  hand.
- The user is expected to source the wine image themselves (typically by
  searching the winery's website or a public image search) before
  uploading. The app does not perform any web search on the user's behalf.

## Dependencies

- The user must obtain the wine image themselves (typically by downloading
  it from the internet) before adding the entry. The app itself has no
  internet dependency for any of its core flows once the image has been
  uploaded.

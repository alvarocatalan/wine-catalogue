# Feature Specification: Visual Redesign + Wine "Type" Field

**Feature Branch**: `002-wine-redesign-tipo`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "Rediseño visual del catálogo de vinos a partir del diseño generado con Claude Design (referencias en design/redesign-2026/), que incluye un cambio en el modelo de datos: añadir el campo 'tipo' a cada vino para diferenciar blanco / tinto / rosado / espumoso / dulce / generoso."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse a redesigned, editorial catalogue (Priority: P1)

A visitor opens the catalogue home and sees a polished, editorial presentation: a full-width burgundy hero with the collection title, a grid of wine cards on a warm cream background, and a live count of wines. Each card shows the bottle photo, the wine name, its winery and vintage, its denomination of origin, and a colour-coded type label (e.g. red = "TINTO"). Clicking any card opens that wine's detail page.

**Why this priority**: This is the core experience every visitor sees first. The redesign is the reason the feature exists; without the refreshed home grid there is no visible value delivered. It is a complete, demonstrable slice on its own.

**Independent Test**: Load the home page with the existing content and confirm the hero, grid, card layout, type label, and wine count render per the design references, and that each card links to its detail page.

**Acceptance Scenarios**:

1. **Given** the catalogue contains one or more wines, **When** a visitor loads the home page, **Then** they see the burgundy hero with title/subtitle, a grid of cards, and a header showing "{n} vinos".
2. **Given** a wine card is displayed, **When** the visitor views it, **Then** it shows the bottle photo, name, "winery · vintage", denomination of origin, and a type label whose colour matches the wine's type.
3. **Given** a wine whose vintage is "NV", **When** its card renders, **Then** the vintage displays literally as "NV" (not a year).
4. **Given** a visitor points at (hovers) a card, **When** the pointer is over it, **Then** the card lifts subtly, and the whole card is a link to `/vinos/[slug]/`.
5. **Given** a visitor has reduced-motion enabled, **When** views transition or cards are hovered, **Then** motion is minimized/omitted.

---

### User Story 2 - Read a redesigned wine detail page (Priority: P1)

A visitor opens a wine's detail page and sees a two-column editorial layout: the bottle photo on the left (sticky on desktop) and, on the right, the type label, the wine name, the winery, a data table (winery, denomination of origin, vintage), and the tasting notes rendered as a readable column. A "back to catalogue" link returns them to the home page.

**Why this priority**: The detail page is the second half of the core browsing journey and the only place the tasting notes and full data are shown. It must reflect the same visual system and the new type label to be coherent with the home grid.

**Independent Test**: Navigate to a wine's detail page and confirm the two-column layout, type label with the correct colour, data table (winery / D.O. / vintage), rendered tasting notes, and a working back link — collapsing to a stacked single column on small screens.

**Acceptance Scenarios**:

1. **Given** a wine detail page, **When** it loads, **Then** it shows the bottle image panel, a colour-coded type label, the name, the winery, and a data table with rows for Bodega, D.O., and Añada.
2. **Given** a wine with tasting notes, **When** the detail page renders, **Then** the notes body is displayed as formatted, readable text.
3. **Given** a visitor on the detail page, **When** they activate "← Volver al catálogo", **Then** they return to the home page.
4. **Given** a small (mobile) viewport, **When** the detail page renders, **Then** the two columns stack vertically and the image is not sticky.

---

### User Story 3 - Classify wines by type (data model) (Priority: P1)

Every wine has a mandatory type from a fixed set — tinto, blanco, rosado, espumoso, dulce, generoso — chosen when the wine is authored. The type is the single new content field and drives the colour-coded label everywhere the wine appears. All wines that already exist are assigned a correct type so the catalogue never contains a wine without one.

**Why this priority**: The type field is a prerequisite for both the redesigned label (Stories 1 & 2) and the type filter (Story 4). Because it is a mandatory field, existing content is invalid until every wine is assigned a type, so it must ship together with the redesign — no wine can be published without it.

**Independent Test**: Confirm the content model requires a type on every wine, that the authoring form offers exactly the six types, that every existing wine has been assigned a type, and that a wine missing a type is rejected.

**Acceptance Scenarios**:

1. **Given** the content model, **When** a wine is authored or validated, **Then** a type is required and must be one of: tinto, blanco, rosado, espumoso, dulce, generoso.
2. **Given** the authoring interface, **When** an editor adds or edits a wine, **Then** they can select the type from exactly those six options.
3. **Given** the wines that existed before this change, **When** the catalogue is built, **Then** each of them has a valid type assigned (backfill complete) and the build succeeds.
4. **Given** a wine entry without a type, **When** the content is validated, **Then** validation fails.

---

### User Story 4 - Filter the catalogue by type (Priority: P2)

While browsing, a visitor uses a single search field to narrow the catalogue and can additionally filter by wine type. Searching matches across the wine's text (name, winery, denomination of origin, vintage, type) and the type facet lets them see only wines of a chosen category. When nothing matches, a clear "no results" state appears with the searched term highlighted and a way to clear the search; the wine count reflects the filtered results.

**Why this priority**: Search already exists; this story adds the type facet on top of the redesign. It enhances discovery but the catalogue is fully usable (browse + detail) without it, so it ranks below the core P1 stories.

**Independent Test**: On the home page, type a query and confirm the grid narrows in place; apply a type filter and confirm only wines of that type remain; enter a query with no matches and confirm the "no results" state and a working "clear search" control; confirm the count updates.

**Acceptance Scenarios**:

1. **Given** the catalogue, **When** the visitor types text into the search field, **Then** the grid updates in place to show only wines matching that text across name, winery, D.O., vintage, and type.
2. **Given** the catalogue, **When** the visitor filters by a type, **Then** only wines of that type are shown and the count updates accordingly.
3. **Given** a search that matches nothing, **When** results are empty, **Then** a "Sin resultados" state appears with the searched term highlighted and a "Limpiar búsqueda" control, and the header shows "0 vinos".
4. **Given** an active search or filter, **When** the visitor clears it, **Then** the full catalogue is shown again.
5. **Given** the search field, **When** a keyboard-only user navigates, **Then** the field is reachable and operable with a visible, accessible label.

---

### Edge Cases

- **Wine with vintage "NV"**: shown literally as "NV" everywhere the vintage appears (card, detail data table, and as searchable text).
- **Backfill of legacy content**: the pre-existing wine(s) with no type must be assigned a type before build; the build must fail loudly if any wine lacks a type rather than silently defaulting.
- **Empty catalogue**: home renders the hero and a "0 vinos" header with an empty grid (no crash).
- **No search matches**: the dedicated "no results" state is shown, not an empty grid.
- **Unknown/removed type value**: a wine whose type is not one of the six allowed values is rejected at validation/build time.
- **Reduced motion**: hover lift and view fade-in are suppressed when the visitor prefers reduced motion.
- **Long tasting notes**: notes render in a constrained readable column without breaking the two-column layout.

## Requirements *(mandatory)*

### Functional Requirements

#### Data model — wine "type"

- **FR-001**: The content model MUST include a new mandatory field, "type" (`tipo`), on every wine.
- **FR-002**: The "type" field MUST accept exactly one of six values: `tinto`, `blanco`, `rosado`, `espumoso`, `dulce`, `generoso`.
- **FR-003**: The authoring interface MUST present "type" as a selectable field offering exactly those six options.
- **FR-004**: The content model and the authoring interface MUST remain consistent with each other for the "type" field (i.e. the existing schema-parity guarantee continues to hold with the new field included).
- **FR-005**: Every wine that exists before this change MUST be assigned a valid "type" value (content backfill) so that the catalogue builds with no wine missing a type.
- **FR-006**: Content validation MUST reject any wine that lacks a "type" or whose "type" is outside the six allowed values.
- **FR-007**: All other existing content fields (`nombre`, `bodega`, `denominacionOrigen`, `anada`, `foto`, `fotoAlt`, `notas`, `createdAt`) MUST remain unchanged; no other fields are added or removed.

#### Visual redesign

- **FR-008**: The catalogue MUST adopt the redesign's visual system — colour palette, typography (editorial display face for names/titles + sans-serif for body/UI), spacing scale, corner radii, and shadows — as defined in the design references (`design/redesign-2026/`).
- **FR-009**: The home page MUST present a full-width hero (collection overline, title, subtitle) above a wine grid with a section header showing the wine count.
- **FR-010**: Each wine card MUST display the bottle photo, name, "winery · vintage", denomination of origin, and a colour-coded type label; the whole card MUST link to that wine's detail page.
- **FR-011**: The wine detail page MUST present a two-column editorial layout (bottle image + data/notes) that stacks vertically on small screens, including a colour-coded type label, the name, the winery, a data table (Bodega, D.O., Añada), and the rendered tasting notes, plus a "back to catalogue" link to the home page.
- **FR-012**: The type MUST be shown as a colour-coded label on both the card and the detail page, with a distinct colour per type as specified in the design references.
- **FR-013**: A vintage value of "NV" MUST be displayed literally as "NV" wherever the vintage appears.
- **FR-014**: Interactive motion (card hover lift, view fade-in) MUST respect the visitor's reduced-motion preference.

#### Search & filter

- **FR-015**: The catalogue MUST provide a single search field that filters the visible wines in place across their text (name, winery, denomination of origin, vintage, and type).
- **FR-016**: The catalogue MUST provide a "type" filter facet allowing the visitor to restrict results to a chosen type; "type" MUST be part of the build-time search index.
- **FR-017**: When a search/filter yields no matches, the catalogue MUST show a dedicated "no results" state that highlights the searched term and offers a control to clear the search, and the header count MUST read "0 vinos".
- **FR-018**: The wine count in the section header MUST reflect the currently displayed (filtered) results.
- **FR-019**: The initial grid MUST be present without requiring search interaction (usable when scripting is unavailable); search/filter refines it in place.

#### Constraints & non-functional

- **FR-020**: The published catalogue MUST remain fully static — no runtime backend, no network calls at view time, and no use of browser storage (IndexedDB / localStorage / sessionStorage).
- **FR-021**: The redesigned pages MUST remain accessible (keyboard operable, accessible labels for the search field, visible focus, sufficient contrast) and MUST sustain the project's 100/100/100/100 quality bar (performance, accessibility, best practices, SEO).
- **FR-022**: The affected automated tests MUST be updated to cover the new field and behaviours — content schema, schema parity, search/filter (including the type facet in the index), and end-to-end coverage of the redesigned pages and states.

### Key Entities *(include if feature involves data)*

- **Wine (`vino`)**: a single wine in the personal collection. Existing attributes: name, winery, denomination of origin, vintage ("NV" or a 4-digit year), bottle photo + its alt text, tasting notes, and a creation timestamp used for default ordering. **New attribute**: **type** — a mandatory category, one of {tinto, blanco, rosado, espumoso, dulce, generoso}, that drives the colour-coded label and the type filter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of wines in the catalogue have a valid type assigned; a build with any wine missing a type fails.
- **SC-002**: Every wine card and every detail page displays a colour-coded type label whose colour corresponds to the wine's type, matching the six colours in the design references.
- **SC-003**: A visitor can filter the catalogue to a single type and see only wines of that type, with the visible count updating to match.
- **SC-004**: A search with no matches shows the "no results" state (with the searched term highlighted and a clear-search control) in 100% of no-match cases, and the count reads "0 vinos".
- **SC-005**: The redesigned home and detail pages sustain 100/100/100/100 on the project's automated quality audit (performance, accessibility, best practices, SEO).
- **SC-006**: The published site performs no network requests and uses no browser storage while browsing, searching, or filtering.
- **SC-007**: The home, detail, and no-results views render per the design references at both desktop and mobile widths (grid collapses; detail columns stack).
- **SC-008**: The full automated test suite (schema, schema parity, search/filter, end-to-end) passes with the new type field and redesigned UI.

## Assumptions

- The design references in `design/redesign-2026/design_handoff_catalogo_vinos/` (README, `design-tokens.css`, screenshots) are the authoritative, high-fidelity source for colours, typography, spacing, radii, shadows, layout, and per-type label colours; the prototype HTML is visual reference only and is not ported to production.
- The redesign extends the content model with **exactly one** new field, `tipo`. Other fields floated in the prototype (uva, país, graduación, precio, puntuación, maridaje, enlaceBodega) are explicitly out of scope and are not added.
- The single pre-existing wine (Vega Sicilia "Único") is a red wine and will be backfilled as `tipo: tinto`; any additional legacy entries are assigned their correct type during backfill.
- Default catalogue ordering (most recent first, by creation timestamp) is retained and unchanged; `createdAt` remains non-visible.
- Bottle images continue to be authored as real photos with alt text and processed at build; prototype bottle art is placeholder only.
- The editorial display typeface (Playfair Display) is delivered in a way that does not regress the performance/accessibility quality bar (e.g. self-hosted or otherwise optimized).
- Offline viewing / PWA precache remains out of scope; browser storage remains prohibited.
- The type filter is a facet layered onto the existing in-memory, build-time search index; no new runtime data source is introduced.

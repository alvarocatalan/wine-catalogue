# Phase 1 Data Model: Wine Catalogue

**Feature**: 001-wine-catalogue | **Date**: 2026-07-15 (re-architected)

The data model is realised at **runtime in IndexedDB** on the user's device.
There is no database server. A Zod schema (`src/lib/schema.ts`) is the
authoritative record contract; the repository (`src/lib/db.ts`) is the only code
that touches IndexedDB. See `contracts/wine-schema.md`.

---

## Store: `wines` (text records)

One tasted wine per record. `keyPath: "id"`.

### Fields

| Field | Type | Required | Rules | Source |
|---|---|---|---|---|
| `id` | string (UUID v4) | Yes | Generated on create; stable identity independent of field values, so legitimate duplicates are allowed. | FR-001, Key Entities |
| `wineName` | string | Yes | Non-empty, trimmed. | FR-001, FR-002 |
| `winery` | string | Yes | Non-empty, trimmed. | FR-001, FR-002 |
| `designationOfOrigin` | string | Yes | Non-empty, trimmed. Free text — no enforced taxonomy. | FR-001, FR-002, Assumptions |
| `vintage` | string | Yes | Literal `"NV"` **or** 4-digit year `^\d{4}$`. Stored as string to preserve `"NV"`. | FR-002, FR-003 |
| `imageAlt` | string | Yes | Non-empty. Descriptive alt text (WCAG, Principle III). | Principle III |
| `createdAt` | number (epoch ms) | Yes | Set on create. Default ordering = newest first. | Key Entities |
| `updatedAt` | number (epoch ms) | Yes | Set on create and every edit. | FR-010 |

### Indexes

| Index | Key | Used by |
|---|---|---|
| `by-createdAt` | `createdAt` | Default newest-first grid ordering. |

> The actual image bytes are **not** in this store (see `images`), so the whole
> catalogue's text can be loaded into memory cheaply for search/filter.

---

## Store: `images` (binary)

`key = wine id` (1:1 with a `wines` record).

| Field | Type | Rules |
|---|---|---|
| `thumb` | Blob (WebP) | ≤ 400 px longest edge; rendered in the grid. |
| `full` | Blob (WebP) | ≤ 1600 px longest edge; rendered in detail. |
| `mime` | string | Original accepted MIME (`image/jpeg`\|`png`\|`webp`). |
| `width` / `height` | number | Original decoded dimensions (for layout / CLS). |

Rendered via `URL.createObjectURL(blob)`; object URLs are revoked on unmount.
A missing/undecodable Blob falls back to the shared placeholder (FR-013).

---

## Derived / computed (in memory, at runtime)

| Derived value | How | Used by |
|---|---|---|
| `vintageIsFuture` | `vintage !== "NV" && Number(vintage) > currentYear` | Visibly flag future vintages as suspicious (edge case). |
| Facets | Distinct sorted `vintage` / `designationOfOrigin` / `winery` over loaded records. | Filter controls (FR-008). |
| Search result + matched fields | In-memory case-insensitive partial scan over the 4 fields; records which field(s) matched. | Search (FR-006, FR-007) + which-field-matched (FR-007 edge case, analysis U1). |
| Duplicate warning | On save, detect an existing record with identical `vintage`+`winery`+`wineName`. | Non-blocking in-app warning (duplicate edge case) — save still allowed. |

---

## Validation rules (Zod, enforced on save — the runtime "block the save")

1. All required fields present and non-empty → else the form **blocks save** and
   names the offending field(s) (FR-002).
2. `vintage` matches `NV` or `^\d{4}$` (FR-003).
3. Uploaded image: MIME ∈ {jpeg, png, webp} **and** size ≤ 10 MB → else upload
   is refused with a message stating formats + limit (FR-014, edge case).
4. `imageAlt` present (accessibility gate).
5. On create, an image is required (FR-001); on edit, the existing image is kept
   unless the user replaces it (FR-010).

---

## Lifecycle / state transitions

Runtime state lives in IndexedDB + the island's in-memory store:

```
        create (form, Zod-valid) ─────▶ record in `wines` + Blobs in `images`
              │                                   │
        edit (form) ──▶ updated record       delete (confirm)
              │                                   │
              │                          removed from grid, held in memory
              │                                   │  ┌── Undo (within ~7s) ──┐
              │                                   ▼  ▼                        │
              │                          purge from IndexedDB   ◀── restore ──┘
              └───────────────────────────────────────────────────────────────
```

- **Confirm + Undo**: delete asks for confirmation, then a ~7 s toast offers
  Undo; the IndexedDB purge only commits when the toast expires (FR-011,
  research Decision 8).
- **Transient UI state**: `{ query, activeFilters, currentView }` held in island
  signals; reset by the single **Clear** control (FR-009); not persisted across
  reloads (the catalogue itself is).

---

## Relationships

- A Wine Entry has exactly **one** image (`wines.id` ↔ `images.<id>`, 1:1).
- Wineries / designations / vintages are **not** separate entities — free-text
  attributes aggregated only into in-memory facets for filtering (Assumptions
  forbid an enforced taxonomy in v1).

---

## Scale

~1,000 entries (FR-017, Assumptions). Text records load fully into memory for
instant search/filter; the grid renders **windowed** with lazy `thumb` Blobs so
only visible cards mount — keeping browse/search/filter within the performance
budget (research Decision 10).

# Phase 1 Data Model: Wine Catalogue (git-versioned content)

**Feature**: 001-wine-catalogue | **Date**: 2026-07-15 (re-architected for Constitution v1.1.0)

Each wine is a **`.mdoc` file** under `src/content/vinos/`, with its image under
`src/assets/vinos/` — both **versioned in git**. There is no database and no
browser storage. A single **Zod** schema (`src/lib/schema.ts`) is the
authoritative contract; the Astro **Content Layer** collection validates every
entry **at build**, and **Keystatic** authors entries against a mirror schema.
See `contracts/wine-schema.md`.

---

## Entity: Wine (`vinos` collection entry)

One tasted wine per `.mdoc` file. The file **slug** is the stable identity (so
legitimate duplicates coexist under distinct slugs). Structured fields are
frontmatter; `notas` is the Markdoc body.

### Fields

| Field (canonical) | Type | Required | Rules | Source |
|---|---|---|---|---|
| `nombre` | string | Yes | Non-empty, trimmed. Wine name. | FR-001, FR-002 |
| `bodega` | string | Yes | Non-empty, trimmed. Winery. | FR-001, FR-002 |
| `denominacionOrigen` | string | Yes | Non-empty, trimmed. Free text — no enforced taxonomy. Designation of origin. | FR-001, FR-002, Assumptions |
| `anada` | string | Yes | Literal `"NV"` **or** 4-digit year `^\d{4}$`. String to preserve `"NV"`. Vintage. | FR-002, FR-003 |
| `foto` | image (via `image()` helper) | Yes | Co-located file in `src/assets/vinos/`; built/optimised by `astro:assets`. Accepted on upload: JPEG/PNG/WebP ≤ 10 MB (FR-014). | FR-001, FR-014 |
| `fotoAlt` | string | Yes | Non-empty. Alt text rendered as the image `alt` (WCAG, Principle III). | FR-021 |
| `notas` | Markdoc body | No | Optional free-text notes; rendered on the detail view. | FR-022 |
| `createdAt` | date | Yes | Set by Keystatic on create. Default ordering = newest first. | Key Entities |

> The slug (filename) is the identity; there is no separate `id` field. Ordering
> uses `createdAt`.

---

## Storage layout (versioned in git)

```text
src/
├── content/
│   └── vinos/
│       └── <slug>.mdoc          # frontmatter (nombre, bodega, denominacionOrigen,
│                                #   anada, foto, fotoAlt, createdAt) + notas body
└── assets/
    └── vinos/
        └── <slug>/foto.<ext>    # co-located image, referenced by `foto`
```

`.mdoc` frontmatter example:

```yaml
---
nombre: Único
bodega: Vega Sicilia
denominacionOrigen: Ribera del Duero DO
anada: "2018"                    # or "NV"
foto: ./foto.jpg                 # resolved by the image() helper → astro:assets
fotoAlt: Botella de Vega Sicilia Único 2018 sobre fondo neutro
createdAt: 2026-07-15
---
Nariz de fruta madura y roble fino; taninos pulidos.   # notas (Markdoc body)
```

---

## Derived / computed (at build or in the client island, never stored)

| Derived value | How | Used by |
|---|---|---|
| `anadaIsFuture` | `anada !== "NV" && Number(anada) > currentYear` | Visibly flag future vintages as suspicious (edge case). |
| Facets | Distinct sorted `anada` / `denominacionOrigen` / `bodega` over all entries. | Filter controls (FR-008). |
| Search index | Build-time JSON of `{ slug, nombre, bodega, denominacionOrigen, anada }` (text only). | Client in-memory search (FR-006/007). |
| Matched field(s) | Computed during the in-memory scan. | Which-field-matched (FR-007 edge case). |
| Duplicate warning | Author-time: an existing entry with identical `anada`+`bodega`+`nombre`. | Non-blocking notice; entry still allowed (duplicate edge case). |

---

## Validation rules (Zod — enforced at build; mirrored in Keystatic at author time)

1. `nombre`, `bodega`, `denominacionOrigen` present and non-empty (FR-002).
2. `anada` matches `NV` or `^\d{4}$` (FR-003).
3. `foto` resolves to a co-located image (present on create); upload accepts only
   JPEG/PNG/WebP ≤ 10 MB, else Keystatic refuses it with a message stating
   formats + limit (FR-014).
4. `fotoAlt` present and non-empty (accessibility gate, FR-021).
5. `notas` optional (FR-022).

A failing rule at build **fails `astro build`** (and `astro check`); an invalid
entry cannot be published.

---

## Lifecycle / state transitions (git-backed)

```
   Keystatic create (schema-valid) ──▶ new <slug>.mdoc + image committed to git
             │                                        │
        Keystatic edit ──▶ file change committed   Keystatic delete (confirm)
             │                                        │
             │                                   file removed in a commit
             │                                        │
             └───────── recovery ── git revert / history ◀── (no in-session undo)
```

- **Publish**: a commit (produced via the CMS) triggers a rebuild/redeploy of the
  static site (FR-020).
- **Delete + recovery**: confirmation step in Keystatic; the deletion is a
  revertible commit — recovery is via git history, not an ephemeral undo
  (Clarification 2026-07-15, Q3=B; FR-011).
- **Client UI state**: the public island holds `{ query, activeFilters }` in
  signals only — transient, never persisted, no browser storage (Constitution VI).

---

## Relationships

- A Wine has exactly **one** image (`foto`), co-located with its `.mdoc` (1:1).
- Bodegas / denominaciones / añadas are **not** separate entities — free-text
  attributes aggregated only into build/in-memory facets (no enforced taxonomy in
  v1, Assumptions).

---

## Scale

~1,000 entries (FR-017, Assumptions). The full site (grid + one detail page per
wine) is generated at build; the client search index is text-only (a few hundred
KB at 1,000 entries), filtered in memory well within the 100 ms interaction budget
(research Decision 7 & 11).

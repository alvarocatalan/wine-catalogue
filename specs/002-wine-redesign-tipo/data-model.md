# Phase 1 Data Model: Visual Redesign + Wine "Type" Field

## Entity: Wine (`vino`)

One `.mdoc` file per wine in `src/content/vinos/`, edited via Keystatic (dev-only) and
committed to git. This feature adds exactly one field (`tipo`); all others are unchanged.

| Field | Type | Required | Constraint | New? | Source of truth |
|-------|------|----------|------------|------|-----------------|
| `nombre` | string (slug) | yes | non-empty; also the entry slug | no | Zod + Keystatic `fields.slug` |
| `bodega` | string | yes | non-empty | no | Zod + Keystatic `fields.text` |
| `denominacionOrigen` | string | yes | non-empty | no | Zod + Keystatic `fields.text` |
| `anada` | string | yes | matches `^(NV\|\d{4})$` | no | Zod regex + Keystatic pattern |
| **`tipo`** | **enum** | **yes** | **one of `tinto \| blanco \| rosado \| espumoso \| dulce \| generoso`** | **YES** | **Zod `z.enum(TIPOS)` + Keystatic `fields.select`** |
| `foto` | image | yes | co-located; optimised at build via `image()` + `<Image/>` | no | `content.config.ts` `image()` + Keystatic `fields.image` |
| `fotoAlt` | string | yes | non-empty | no | Zod + Keystatic `fields.text` |
| `notas` | markdoc body | no | Markdown body → tasting notes | no | Keystatic `fields.markdoc` (content body) |
| `createdAt` | date | yes | default "today" (Keystatic); drives ordering | no | Zod `z.coerce.date` + Keystatic `fields.date` |

### The new field: `tipo`

- **Values (canonical order)**: `tinto`, `blanco`, `rosado`, `espumoso`, `dulce`, `generoso`.
- **Cardinality**: exactly one per wine (single-select, not multi).
- **Required**: yes, **no default** in the Zod schema → a wine without a valid `tipo` fails
  `astro build` (FR-005, FR-006).
- **Canonical definition** (`src/lib/schema.ts`):

  ```ts
  export const TIPOS = ['tinto', 'blanco', 'rosado', 'espumoso', 'dulce', 'generoso'] as const;
  export type TipoValue = (typeof TIPOS)[number];
  // inside wineFrontmatter:
  tipo: z.enum(TIPOS),
  ```

- **Keystatic mirror** (`keystatic.config.ts`) — same values, capitalised labels; `defaultValue`
  is a **form convenience only** (does not affect existing `.mdoc` at build):

  ```ts
  tipo: fields.select({
    label: 'Tipo',
    options: [
      { label: 'Tinto', value: 'tinto' },
      { label: 'Blanco', value: 'blanco' },
      { label: 'Rosado', value: 'rosado' },
      { label: 'Espumoso', value: 'espumoso' },
      { label: 'Dulce', value: 'dulce' },
      { label: 'Generoso', value: 'generoso' },
    ],
    defaultValue: 'tinto',
  }),
  ```

### Canonical field set (`WINE_FIELDS`)

`tipo` is inserted into `WINE_FIELDS` so the schema-parity test (compares against
`keystatic.config.ts` keys) continues to pass:

```ts
export const WINE_FIELDS = [
  'nombre', 'bodega', 'denominacionOrigen', 'anada',
  'tipo',            // ← new
  'foto', 'fotoAlt', 'notas', 'createdAt',
] as const;
```

## Validation rules

| Rule | Enforced by | Test |
|------|-------------|------|
| `tipo` required, one of the six values | `z.enum(TIPOS)` via `content.config.ts` | `content-validate.test.ts` (accept valid, reject missing/invalid) |
| `tipo` present in **both** schemas | `WINE_FIELDS` + `keystatic.config.ts` | `schema-parity.test.ts` |
| Missing `tipo` fails the build (no silent default) | required enum, no `.default()` | `content-validate.test.ts` + e2e build step |
| All other fields unchanged | untouched `wineFrontmatter` / Keystatic schema | existing tests remain green |

## Ordering (unchanged)

Default order remains newest-first by `createdAt` via `orderByNewest()` in `src/lib/order.ts`.
`createdAt` stays non-visible. `tipo` does **not** affect ordering.

## Search index projection (build-time)

`index.astro` projects each wine into a `WineIndexEntry` embedded as JSON in the page. This
feature adds `tipo`:

```ts
{ slug, nombre, bodega, denominacionOrigen, anada, tipo }   // tipo added
```

See `contracts/search-index.md` for the full index + facet contract.

## Backfill (data migration)

- **Scope**: every existing `.mdoc` in `src/content/vinos/`. Currently one: `unico.mdoc`.
- **Action**: add `tipo: tinto` to `unico.mdoc` frontmatter (Vega Sicilia "Único" is a red wine).
- **Verification**: `astro build` succeeds; a temporarily-untyped entry makes the build fail.

# Contract: Wine Schema (Zod + Content Collection + Keystatic parity)

**Feature**: 001-wine-catalogue | **Type**: build-time content schema + CMS schema

> **Re-architected 2026-07-15** for Constitution v1.1.0: the wine is
> **git-versioned content** validated **at build** by an Astro Content Layer
> collection, and authored in **Keystatic**. One Zod schema is the single source
> of truth; Keystatic mirrors it (enforced by a parity test). Replaces the former
> IndexedDB runtime repository contract.

## Shared field set (canonical)

`nombre`, `bodega`, `denominacionOrigen`, `anada`, `foto`, `fotoAlt`, `notas`.

## Shared validation — `src/lib/schema.ts`

```ts
import { z } from 'zod';

export const VINTAGE = /^(NV|\d{4})$/; // "NV" or a 4-digit year — FR-003

// Frontmatter/data fields shared by the collection schema and the parity test.
// `foto` is added by content.config.ts via the image() helper (see below);
// `notas` is the Markdoc body, not a frontmatter field.
export const wineFrontmatter = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),                     // FR-002
  bodega: z.string().trim().min(1, 'La bodega es obligatoria'),                     // FR-002
  denominacionOrigen: z.string().trim().min(1, 'La D.O. es obligatoria'),           // FR-002
  anada: z.string().regex(VINTAGE, 'La añada debe ser "NV" o un año de 4 cifras'),  // FR-003
  fotoAlt: z.string().trim().min(1, 'La descripción de la imagen es obligatoria'),  // FR-021
  createdAt: z.coerce.date(),
} as const;

// Canonical key list — the parity test compares this to keystatic.config.ts.
export const WINE_FIELDS = [
  'nombre', 'bodega', 'denominacionOrigen', 'anada', 'foto', 'fotoAlt', 'notas',
] as const;
```

## Content collection — `src/content.config.ts`

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { wineFrontmatter } from './lib/schema';

const vinos = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/vinos' }),
  schema: ({ image }) =>
    z.object({
      ...wineFrontmatter,
      foto: image(),          // resolves the co-located image → astro:assets <Image/> (FR-014)
    }),
});

export const collections = { vinos };
```

## Keystatic schema — `keystatic.config.ts` (local mode, mirrors the above)

```ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    vinos: collection({
      label: 'Vinos',
      slugField: 'nombre',
      path: 'src/content/vinos/*',
      format: { contentField: 'notas' },       // notas = Markdoc body (FR-022)
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre' } }),
        bodega: fields.text({ label: 'Bodega', validation: { isRequired: true } }),
        denominacionOrigen: fields.text({ label: 'Denominación de Origen', validation: { isRequired: true } }),
        anada: fields.text({ label: 'Añada', validation: { isRequired: true } }), // "NV" o AAAA (FR-003)
        foto: fields.image({
          label: 'Foto',
          directory: 'src/assets/vinos',        // co-located, versioned (FR-014)
          publicPath: '../../assets/vinos/',    // path the image() helper can resolve (verify — research D4)
          validation: { isRequired: true },
        }),
        fotoAlt: fields.text({ label: 'Texto alternativo de la foto', validation: { isRequired: true } }), // FR-021
        notas: fields.mdoc({ label: 'Notas' }), // optional (FR-022)
        createdAt: fields.date({ label: 'Creado', defaultValue: { kind: 'today' } }),
      },
    }),
  },
});
```

> **`anada`** is a free text field in Keystatic; the `NV`/`YYYY` rule is enforced
> by Zod at build (and should be surfaced with a Keystatic field validation
> pattern where supported). **`foto`** file size/format (≤10 MB, JPEG/PNG/WebP) is
> validated on upload (FR-014). The `publicPath`/`directory` pairing is the seam to
> verify against the `image()` helper (research Decision 4).

## Parity contract (test) — `tests/unit/schema-parity.test.ts`

```ts
// Asserts the Keystatic collection field set === WINE_FIELDS, so the CMS schema
// and the content-collection schema cannot silently diverge.
import keystaticConfig from '../../keystatic.config';
import { WINE_FIELDS } from '../../src/lib/schema';

const keystaticKeys = Object.keys(keystaticConfig.collections.vinos.schema).sort();
expect(keystaticKeys).toEqual([...WINE_FIELDS].sort());
```

## Contract guarantees

| Guarantee | Mechanism | Requirement |
|---|---|---|
| Four structured fields present before publish | Zod `.min(1)` at build; Keystatic `isRequired` at author time | FR-001, FR-002 |
| Añada is `NV` or `YYYY` | `VINTAGE` regex (Zod) | FR-003 |
| Image accepted (JPEG/PNG/WebP ≤ 10 MB), versioned, optimised | Keystatic `fields.image` + `image()` + `<Image/>` | FR-014 |
| Alt text always present | required `fotoAlt` | FR-021 |
| Content is versioned in git; no browser storage | files under `src/`; CI grep guard forbids IndexedDB/localStorage/sessionStorage | FR-012, Constitution VI |
| CMS ⇆ collection schemas stay in sync | schema-parity test | plan / FR schema-mirror |
| Legitimate duplicates allowed | slug identity; author-time non-blocking duplicate notice | Key Entities, duplicate edge case |

## Versioning

Adding a **required** field is a breaking content change (existing entries must be
backfilled) needing a PR migration note (Constitution governance); adding an
**optional** field is non-breaking. Schema changes MUST update Zod, the Keystatic
schema, and `WINE_FIELDS` together (the parity test enforces this).

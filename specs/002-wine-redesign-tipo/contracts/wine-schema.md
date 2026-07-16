# Contract: Wine Content Schema (with `tipo`)

**Applies to**: `src/lib/schema.ts`, `keystatic.config.ts`, `src/content.config.ts`,
and every `.mdoc` in `src/content/vinos/`.

## Field set (canonical)

The Zod `wineFrontmatter` + `foto` (via `image()`) and the Keystatic `vinos.schema` MUST
declare the **same** field set, locked by `WINE_FIELDS` and asserted by `schema-parity.test.ts`:

```
nombre, bodega, denominacionOrigen, anada, tipo, foto, fotoAlt, notas, createdAt
```

Adding, removing, or renaming any field without updating `WINE_FIELDS` **and** both schemas
is a contract violation and MUST fail `schema-parity.test.ts`.

## `tipo` contract

- **Type**: string enum, single value.
- **Allowed values**: `tinto`, `blanco`, `rosado`, `espumoso`, `dulce`, `generoso`
  (exactly these, in this canonical order, defined once as `TIPOS` in `schema.ts`).
- **Required**: yes. **No default** in the content schema.
- **Failure mode**: a `.mdoc` missing `tipo` or with a value outside the set MUST cause
  `astro build` to fail (content-collection validation error). No fallback, no silent default.
- **Keystatic**: exposed as `fields.select` with the six options; `defaultValue: 'tinto'`
  pre-fills the authoring form only and MUST NOT be relied on to fix existing content.

## Invariants preserved

- `anada` still matches `^(NV|\d{4})$`; "NV" renders literally.
- `foto` is still resolved by `content.config.ts` `image()` and optimised via `<Image/>`.
- `createdAt` still drives newest-first ordering and is not displayed.
- No new fields beyond `tipo`; the discarded brief fields (uva, país, graduación, precio,
  puntuación, maridaje, enlaceBodega) are NOT added.

## Test obligations

| Test | Assertion |
|------|-----------|
| `schema-parity.test.ts` | Keystatic `vinos` keys === `WINE_FIELDS` (incl. `tipo`) |
| `content-validate.test.ts` | valid `tipo` accepted; missing/invalid `tipo` rejected by the schema |

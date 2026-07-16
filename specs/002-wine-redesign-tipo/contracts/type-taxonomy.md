# Contract: Type Taxonomy, Label & Colour

**Applies to**: `src/components/TypeLabel.astro`, `src/styles/global.css` (`--tipo-*`),
`WineCard.astro`, `vinos/[slug].astro`.

## Taxonomy (fixed)

| value | display label (uppercase) | colour token | hex |
|-------|---------------------------|--------------|-----|
| `tinto` | TINTO | `--tipo-tinto` | `#6b2c37` |
| `blanco` | BLANCO | `--tipo-blanco` | `#9a7d2e` |
| `rosado` | ROSADO | `--tipo-rosado` | `#a86b73` |
| `espumoso` | ESPUMOSO | `--tipo-espumoso` | `#7d8a5a` |
| `dulce` | DULCE | `--tipo-dulce` | `#9c5f2a` |
| `generoso` | GENEROSO | `--tipo-generoso` | `#7a4a2a` |

The display label is the Spanish word in uppercase with letter-spacing (card `.14em` / detail
`.16em`); the value is the lowercase enum. Both derive from `TIPOS` / `TipoValue`.

## Label component contract (`TypeLabel.astro`)

- **Input**: `tipo: TipoValue` (typed; invalid values are impossible given the schema).
- **Output**: an inline chip = a small round dot (7 px card / 8 px detail) in the type colour +
  the uppercase text label in the type colour.
- **Colour is reinforcement, not the sole channel**: the text label always carries the meaning,
  so the component remains understandable without colour perception (Principle III / WCAG 1.4.1).
- Used on both `WineCard` and the detail page for a consistent affordance.

## Accessibility contract (WCAG 2.1 AA)

- The label **text** MUST meet ≥ 4.5:1 contrast against its background (cream `--wine-bg`
  `#f5f0e7` on the card body / detail column). Where a `--tipo-*` value is borderline for text,
  darken the **text** rendering to reach AA while keeping the **dot** on the brand colour.
- The dot alone is decorative (paired with text) and is exempt from text-contrast, but SHOULD
  remain visually distinguishable.
- Verified by the Lighthouse a11y = 100 run and the axe e2e sweep (`a11y.spec.ts`).

## Test obligations

| Test | Assertion |
|------|-----------|
| `browse.spec.ts` (e2e) | each card shows a type label matching the wine's `tipo` |
| `detail.spec.ts` (e2e) | detail page shows the type label for the wine |
| `a11y.spec.ts` (axe) | no contrast violations on home + detail |

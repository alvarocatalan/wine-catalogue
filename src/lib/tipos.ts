// Canonical wine-type taxonomy (FR-001/FR-002). Kept in its own zod-free module so
// the search island (which imports search.ts) never pulls Zod into its bundle
// (<20 KB gz budget). `schema.ts` re-exports these for the content model.
export const TIPOS = ['tinto', 'blanco', 'rosado', 'espumoso', 'dulce', 'generoso'] as const;
export type TipoValue = (typeof TIPOS)[number];

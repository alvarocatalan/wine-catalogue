import { z } from 'zod';

// "NV" or a 4-digit year — FR-003
export const VINTAGE = /^(NV|\d{4})$/;

// Frontmatter fields shared by the content collection and the schema-parity test.
// `foto` is added in content.config.ts via the image() helper; `notas` is the
// Markdoc body (not a frontmatter field).
export const wineFrontmatter = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  bodega: z.string().trim().min(1, 'La bodega es obligatoria'),
  denominacionOrigen: z.string().trim().min(1, 'La D.O. es obligatoria'),
  anada: z.string().regex(VINTAGE, 'La añada debe ser "NV" o un año de 4 cifras'),
  fotoAlt: z.string().trim().min(1, 'La descripción de la imagen es obligatoria'),
  createdAt: z.coerce.date(),
};

// Canonical schema field set — the schema-parity test (T019/FR-026) compares this
// to keystatic.config.ts. The first seven are the FROZEN v1 content fields
// (Decision 14); `createdAt` is the system creation timestamp (Key Entities),
// present in both schemas. No id/UUID, no composite slug.
export const WINE_FIELDS = [
  'nombre',
  'bodega',
  'denominacionOrigen',
  'anada',
  'foto',
  'fotoAlt',
  'notas',
  'createdAt',
] as const;

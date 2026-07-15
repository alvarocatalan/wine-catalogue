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

// Canonical field set — the schema-parity test (T019) compares this to keystatic.config.ts.
export const WINE_FIELDS = [
  'nombre',
  'bodega',
  'denominacionOrigen',
  'anada',
  'foto',
  'fotoAlt',
  'notas',
] as const;

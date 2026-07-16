import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { wineFrontmatter } from '../../src/lib/schema';

// The content-collection frontmatter validation (foto is validated separately by
// astro:assets image() at build). Covers FR-002 (required fields) and FR-003 (NV/YYYY).
const frontmatter = z.object(wineFrontmatter);

const valid = {
  nombre: 'Único',
  bodega: 'Vega Sicilia',
  denominacionOrigen: 'Ribera del Duero DO',
  anada: '2018',
  fotoAlt: 'Botella de Vega Sicilia Único 2018',
  createdAt: '2026-07-15',
};

describe('content frontmatter validation (FR-002 / FR-003)', () => {
  it('accepts a valid entry, including an "NV" vintage', () => {
    expect(frontmatter.safeParse(valid).success).toBe(true);
    expect(frontmatter.safeParse({ ...valid, anada: 'NV' }).success).toBe(true);
  });

  it('rejects a missing required field (bodega)', () => {
    const { bodega, ...missing } = valid;
    expect(frontmatter.safeParse(missing).success).toBe(false);
  });

  it('rejects an invalid vintage', () => {
    expect(frontmatter.safeParse({ ...valid, anada: '18' }).success).toBe(false);
    expect(frontmatter.safeParse({ ...valid, anada: 'twenty' }).success).toBe(false);
  });
});

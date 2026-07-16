// Vintage helper (FR-003 edge case): flag a future vintage as suspicious.
// `anada` is already validated as "NV" or a 4-digit year by the Zod schema.
export function anadaIsFuture(anada: string, currentYear = new Date().getFullYear()): boolean {
  return anada !== 'NV' && /^\d{4}$/.test(anada) && Number(anada) > currentYear;
}

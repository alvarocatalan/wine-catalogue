import { config, fields, collection } from '@keystatic/core';

// Local-mode git-based CMS. Dev-only (excluded from the production build via
// SKIP_KEYSTATIC — see astro.config.mjs and FR-023). Its field set mirrors the
// Zod schema in src/lib/schema.ts (enforced by the schema-parity test, T019 / FR-026).
export default config({
  storage: { kind: 'local' },
  collections: {
    vinos: collection({
      label: 'Vinos',
      slugField: 'nombre',
      path: 'src/content/vinos/*',
      format: { contentField: 'notas' },
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre' } }),
        bodega: fields.text({ label: 'Bodega', validation: { isRequired: true } }),
        denominacionOrigen: fields.text({
          label: 'Denominación de Origen',
          validation: { isRequired: true },
        }),
        anada: fields.text({
          label: 'Añada',
          validation: {
            isRequired: true,
            pattern: {
              regex: /^(NV|\d{4})$/,
              message: 'La añada debe ser "NV" o un año de 4 cifras (p. ej. 2018)',
            },
          },
        }),
        // Mirrors the Zod `tipo` enum (schema-parity test). `defaultValue` is a form
        // convenience only — it never patches existing .mdoc entries at build time.
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
        foto: fields.image({
          label: 'Foto',
          // Co-located, versioned; publicPath yields a path the content-collection
          // image() helper resolves relative to the .mdoc entry (FR-014, research D4).
          directory: 'src/assets/vinos',
          publicPath: '../../assets/vinos/',
          validation: { isRequired: true },
        }),
        fotoAlt: fields.text({
          label: 'Texto alternativo de la foto',
          validation: { isRequired: true },
        }),
        notas: fields.markdoc({ label: 'Notas' }),
        createdAt: fields.date({ label: 'Creado', defaultValue: { kind: 'today' } }),
      },
    }),
  },
});

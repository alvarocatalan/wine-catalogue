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
        anada: fields.text({ label: 'Añada', validation: { isRequired: true } }),
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
        notas: fields.mdoc({ label: 'Notas' }),
        createdAt: fields.date({ label: 'Creado', defaultValue: { kind: 'today' } }),
      },
    }),
  },
});

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { wineFrontmatter } from './lib/schema';

const vinos = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/vinos' }),
  schema: ({ image }) =>
    z.object({
      ...wineFrontmatter,
      // Resolves the co-located image → astro:assets <Image /> optimises it at build (FR-014).
      foto: image(),
    }),
});

export const collections = { vinos };

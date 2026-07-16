import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    environment: 'node', // component tests opt into jsdom via a per-file docblock
  },
  // Compile .tsx with Preact's JSX runtime (island + component tests).
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
});

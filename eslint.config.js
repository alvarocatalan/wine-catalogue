import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Sensible baseline for an Astro 5 + Preact island + TS-strict codebase.
// Not maximalist: JS-recommended + TS-recommended (no type-checked project rules,
// which would add noise for a small static site) + Astro-recommended, with
// eslint-config-prettier LAST so formatting is owned by Prettier alone.
export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'src/env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Allow intentionally-unused args/vars when prefixed with _, and the
      // `const { omit, ...rest } = obj` omit idiom (rest siblings).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Node scripts and config files run in Node and may use console freely.
    files: ['scripts/**/*.mjs', '*.config.{js,mjs,ts}', 'keystatic.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);

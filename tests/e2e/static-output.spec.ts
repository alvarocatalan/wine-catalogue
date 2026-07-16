import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { verifyStatic } from '../../scripts/verify-static.mjs';
import { scanForStorage } from '../../scripts/check-no-storage.mjs';
import { scan as scanImages } from '../../scripts/validate-images.mjs';

// T047 — verify the build is a pure static site and the build-time guards run.
// Tied to the same pipeline as the smoke tests: `npm run test:e2e` builds dist/
// first, so these assertions run against the real artifact.
const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = fileURLToPath(new URL('../../dist', import.meta.url));

// These are filesystem/artifact checks — no browser needed.
test.describe.configure({ mode: 'parallel' });

test('dist is pure static: no server/adapter output, no /keystatic, no storage (Constitution V/VI, FR-023)', () => {
  expect(verifyStatic(dist)).toEqual([]);
});

test('storage guard runs clean on src/ (Constitution VI)', () => {
  expect(scanForStorage(`${root}src`)).toEqual([]);
});

test('image gate runs clean on committed assets (FR-014)', () => {
  expect(scanImages(`${root}src/assets/vinos`)).toEqual([]);
});

test('the guards are wired into the build/deploy pipeline', () => {
  const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));
  // Image gate runs before every build.
  expect(pkg.scripts.prebuild).toContain('validate-images');
  // Storage guard runs in CI before publishing.
  const workflow = readFileSync(`${root}.github/workflows/deploy.yml`, 'utf8');
  expect(workflow).toContain('scripts/check-no-storage.mjs');
});

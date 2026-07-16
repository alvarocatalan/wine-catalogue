// T047 — verify the published output is a PURE STATIC site (Constitution V) with
// NO Keystatic route in production (FR-023) and NO browser storage in the shipped
// JS/HTML (Constitution VI). Complements the source-level storage guard by
// checking the actual build artifact in dist/.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const STORAGE_APIS = ['indexedDB', 'localStorage', 'sessionStorage'];
const SCAN_EXTS = new Set(['.js', '.mjs', '.html']);

// Artifacts that only an SSR/adapter build would emit — none may exist in a
// fully static output.
const SERVER_ARTIFACTS = ['server', 'entry.mjs', '_worker.js', '_worker.js.map', 'functions'];
// On-demand Keystatic routes must never ship to production.
const KEYSTATIC_ROUTES = ['keystatic', join('api', 'keystatic')];

export function verifyStatic(dist = 'dist') {
  const problems = [];
  if (!existsSync(dist)) {
    return [`dist not found at "${dist}" — run \`npm run build\` first`];
  }

  for (const artifact of SERVER_ARTIFACTS) {
    if (existsSync(join(dist, artifact))) {
      problems.push(`server/adapter artifact present: ${artifact} (output is not static)`);
    }
  }

  for (const route of KEYSTATIC_ROUTES) {
    if (existsSync(join(dist, route))) {
      problems.push(`Keystatic route shipped to production: /${route} (FR-023)`);
    }
  }

  // Grep the shipped JS/HTML for prohibited storage APIs (Constitution VI).
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!SCAN_EXTS.has(extname(e.name))) continue;
      const code = readFileSync(p, 'utf8');
      for (const api of STORAGE_APIS) {
        if (new RegExp(`\\b${api}\\b`).test(code)) {
          problems.push(`prohibited storage API "${api}" in shipped file: ${p}`);
        }
      }
    }
  };
  walk(dist);

  return problems;
}

// CLI gate.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const dist = process.argv[2] || 'dist';
  const problems = verifyStatic(dist);
  if (problems.length > 0) {
    console.error(`✗ Static-output check failed — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `✓ ${dist}/ is pure static: no server/adapter output, no /keystatic, no browser storage.`,
  );
}

// Storage guard (Constitution VI): fail the build if browser storage
// (indexedDB / localStorage / sessionStorage) is used in SOURCE code (src/).
// Scans only src/ (never node_modules or dist), and strips comments first so
// negation mentions ("we do NOT use localStorage") don't trip it.
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const APIS = ['indexedDB', 'localStorage', 'sessionStorage'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro']);

// Remove /* block */, <!-- html --> and // line comments (keeping `://` in URLs).
export function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

export function scanForStorage(root) {
  const violations = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!EXTS.has(extname(e.name))) continue;
      const lines = stripComments(readFileSync(p, 'utf8')).split('\n');
      lines.forEach((line, i) => {
        for (const api of APIS) {
          if (new RegExp(`\\b${api}\\b`).test(line)) {
            violations.push({ file: p, line: i + 1, api });
          }
        }
      });
    }
  };
  walk(root);
  return violations;
}

// CLI (used as a CI gate before the build).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] || 'src';
  const violations = scanForStorage(root);
  if (violations.length > 0) {
    console.error(
      `✗ Storage guard failed (Constitution VI) — ${violations.length} use(s) of prohibited browser storage in ${root}/:`,
    );
    for (const v of violations) console.error(`  - ${v.file}:${v.line} → ${v.api}`);
    process.exit(1);
  }
  console.log(
    `✓ Storage guard passed (Constitution VI): no indexedDB / localStorage / sessionStorage in ${root}/.`,
  );
}

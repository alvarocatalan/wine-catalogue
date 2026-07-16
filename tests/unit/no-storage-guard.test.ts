import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanForStorage, stripComments } from '../../scripts/check-no-storage.mjs';

const tmps: string[] = [];
const mk = () => {
  const d = mkdtempSync(join(tmpdir(), 'storage-guard-'));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('storage guard (Constitution VI)', () => {
  it('passes on the real src/ (no prohibited browser storage)', () => {
    expect(scanForStorage('src')).toEqual([]);
  });

  it('REJECTS real usage of localStorage / sessionStorage / indexedDB', () => {
    const d = mk();
    writeFileSync(
      join(d, 'bad.ts'),
      'export const x = localStorage.getItem("k");\nwindow.sessionStorage.setItem("a", "b");\nindexedDB.open("db");\n',
    );
    const v = scanForStorage(d);
    const apis = v.map((x) => x.api);
    expect(apis).toContain('localStorage');
    expect(apis).toContain('sessionStorage');
    expect(apis).toContain('indexedDB');
  });

  it('does NOT false-positive on comment negations ("no localStorage")', () => {
    const d = mk();
    writeFileSync(
      join(d, 'ok.ts'),
      '// we deliberately do NOT use localStorage or sessionStorage here\n/* no indexedDB either */\nexport const y = 1;\n',
    );
    expect(scanForStorage(d)).toEqual([]);
  });

  it('strips line comments but keeps URLs (://)', () => {
    expect(stripComments('const u = "https://x"; // localStorage')).not.toContain('localStorage');
    expect(stripComments('const u = "https://x"; foo();')).toContain('https://x');
  });
});

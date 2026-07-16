// Image build gate (FR-014). Scans src/assets/vinos/** and FAILS the build if any
// image is not JPEG/PNG/WebP (by content sniffing) or exceeds 10 MB. Keystatic's
// fields.image cannot validate format/size, so this gate enforces it before deploy.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ROOT = 'src/assets/vinos';

// Detect format from magic bytes (not the extension), so a mislabelled file is caught.
export function detectFormat(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return 'png';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 && // "RIFF"
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50 // "WEBP"
  )
    return 'webp';
  return null;
}

// Returns null when the image is valid, or a human-readable reason (naming the file) when not.
export function checkImage(name, buf) {
  if (detectFormat(buf) === null) {
    return `${name}: unsupported format — only JPEG, PNG, and WebP are allowed`;
  }
  if (buf.length > MAX_BYTES) {
    return `${name}: ${(buf.length / 1048576).toFixed(1)} MB exceeds the 10 MB limit`;
  }
  return null;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // directory absent (e.g. no wines yet) → nothing to validate
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function scan(root = ROOT) {
  const failures = [];
  for (const file of walk(root)) {
    const reason = checkImage(file, readFileSync(file));
    if (reason) failures.push(reason);
  }
  return failures;
}

// CLI entry — used as a prebuild step (and in CI). Fails the build on any invalid image.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const failures = scan();
  if (failures.length > 0) {
    console.error(`✗ Image build gate failed (FR-014) — ${failures.length} invalid image(s):`);
    for (const f of failures) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('✓ Image build gate passed (FR-014): all images are JPEG/PNG/WebP ≤ 10 MB.');
}

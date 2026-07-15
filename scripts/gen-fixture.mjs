// Generates the fixture wine image used by the smoke tests.
// Simulates the file a Keystatic image upload would co-locate under src/assets/vinos/<slug>/.
import { writeFileSync, mkdirSync } from 'node:fs';

// Path matches what Keystatic actually writes: <directory>/<slug>/<filename>,
// where slug comes from slugField: 'nombre' ("Único" -> "unico").
const dir = 'src/assets/vinos/unico';
mkdirSync(dir, { recursive: true });
const out = `${dir}/foto.png`;

try {
  const sharp = (await import('sharp')).default;
  const buf = await sharp({
    create: { width: 1200, height: 1600, channels: 3, background: { r: 90, g: 20, b: 40 } },
  })
    .png()
    .toBuffer();
  writeFileSync(out, buf);
  console.log('fixture image via sharp (1200x1600):', out);
} catch (e) {
  // Fallback: a tiny but valid PNG if sharp is not resolvable.
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('fixture image via base64 fallback (1x1):', out, '(' + String(e).slice(0, 60) + ')');
}

import { describe, it, expect } from 'vitest';
import { checkImage, MAX_BYTES } from '../../scripts/validate-images.mjs';

// Magic-byte prefixes (content sniffing, not extension) — FR-014.
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const GIF = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // unsupported

describe('image build gate (FR-014)', () => {
  it('accepts JPEG / PNG / WebP under the size limit', () => {
    expect(checkImage('a.png', PNG)).toBeNull();
    expect(checkImage('a.jpg', JPEG)).toBeNull();
    expect(checkImage('a.webp', WEBP)).toBeNull();
  });

  it('rejects an unsupported format, naming the file + reason', () => {
    const reason = checkImage('bad.gif', GIF);
    expect(reason).not.toBeNull();
    expect(reason).toContain('bad.gif');
    expect(reason).toMatch(/unsupported|JPEG/i);
  });

  it('rejects a file over 10 MB, naming the file + reason', () => {
    const big = new Uint8Array(MAX_BYTES + 1);
    big.set(PNG, 0);
    const reason = checkImage('big.png', big);
    expect(reason).not.toBeNull();
    expect(reason).toContain('big.png');
    expect(reason).toMatch(/10 MB|exceeds/i);
  });
});

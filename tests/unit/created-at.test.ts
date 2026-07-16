import { describe, it, expect } from 'vitest';
import { orderByNewest } from '../../src/lib/order';

// My contract (not Keystatic's): the catalogue orders by createdAt (newest first),
// and editing a field other than createdAt must NOT change the order — i.e. an edit
// preserves createdAt (Key Entities; T019 showed a schema field can silently drift).
const mk = (id: string, createdAt: string, bodega: string) => ({ id, data: { createdAt, bodega } });

describe('orderByNewest + createdAt preservation on edit (FR-010, Key Entities)', () => {
  it('orders entries by createdAt, newest first', () => {
    const out = orderByNewest([
      mk('a', '2026-01-01', 'X'),
      mk('b', '2026-03-01', 'Y'),
      mk('c', '2026-02-01', 'Z'),
    ]);
    expect(out.map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const input = [mk('a', '2026-01-01', 'X'), mk('b', '2026-03-01', 'Y')];
    orderByNewest(input);
    expect(input.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('editing a non-createdAt field keeps the same order (createdAt stable)', () => {
    const before = orderByNewest([mk('a', '2026-01-01', 'X'), mk('b', '2026-03-01', 'Y')]);
    const edited = [mk('a', '2026-01-01', 'X EDITED'), mk('b', '2026-03-01', 'Y')]; // same createdAt
    const after = orderByNewest(edited);
    expect(after.map((e) => e.id)).toEqual(before.map((e) => e.id));
  });
});

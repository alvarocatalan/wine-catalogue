// Catalogue ordering: newest createdAt first. Pure + non-mutating, so the
// createdAt-preservation invariant (an edit that leaves createdAt untouched keeps
// the same order) is unit-testable in isolation.
export interface HasCreatedAt {
  data: { createdAt: Date | string };
}

export function orderByNewest<T extends HasCreatedAt>(entries: T[]): T[] {
  return [...entries].sort((a, b) => +new Date(b.data.createdAt) - +new Date(a.data.createdAt));
}

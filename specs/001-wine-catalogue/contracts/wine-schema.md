# Contract: Wine Record Schema & IndexedDB Repository

**Feature**: 001-wine-catalogue | **Type**: Zod record schema + IndexedDB repository API

> **Re-architected 2026-07-15**: this is now a **runtime** data contract. Zod
> validates form input before a write (the runtime "block the save"); the
> repository is the sole gateway to IndexedDB. Replaces the former
> Astro-Content-Collection build-time schema.

## Record schema (reference implementation) — `src/lib/schema.ts`

```ts
import { z } from 'zod';

const VINTAGE = /^(NV|\d{4})$/; // "NV" or a 4-digit year — FR-003

// Fields the user enters in the form.
export const WineInput = z.object({
  wineName: z.string().trim().min(1, 'Wine name is required'),              // FR-002
  winery: z.string().trim().min(1, 'Winery is required'),                  // FR-002
  designationOfOrigin: z.string().trim().min(1, 'Designation of origin is required'), // FR-002
  vintage: z.string().regex(VINTAGE, 'Vintage must be "NV" or a 4-digit year'),       // FR-003
  imageAlt: z.string().trim().min(1, 'Image description is required'),     // a11y
});
export type WineInput = z.infer<typeof WineInput>;

// Full persisted record (adds identity + timestamps).
export const WineRecord = WineInput.extend({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});
export type WineRecord = z.infer<typeof WineRecord>;

export interface WineImage {
  thumb: Blob; full: Blob; mime: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number; height: number;
}
```

## Image validation contract (FR-014) — `src/lib/image.ts`

```ts
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Throws a user-facing error naming accepted formats + limit when invalid.
export function validateImageFile(file: File): void;
// Decode → canvas → two WebP Blobs (thumb ≤400px, full ≤1600px longest edge).
export function processImage(file: File): Promise<WineImage>;
```

## Repository API (the only IndexedDB gateway) — `src/lib/db.ts`

```ts
export interface WineWithImage extends WineRecord { image: WineImage | null; }

export const db = {
  // Load all text records (no Blobs) for in-memory search/filter, newest first.
  listRecords(): Promise<WineRecord[]>;
  // Load one record + its image Blobs (detail / edit).
  get(id: string): Promise<WineWithImage | null>;
  // Load a single image (grid lazy-loads thumbs).
  getImage(id: string): Promise<WineImage | null>;
  // Validate-then-create. Rejects if WineInput/​image invalid (FR-001/002).
  create(input: WineInput, image: WineImage): Promise<WineRecord>;
  // Update fields and/or replace the image (FR-010). Bumps updatedAt.
  update(id: string, input: WineInput, image?: WineImage): Promise<WineRecord>;
  // Hard delete of record + image (called only after the Undo window closes).
  remove(id: string): Promise<void>;
};
```

## Example record (in `wines`) + image (in `images`)

```jsonc
// wines
{
  "id": "b6f2…-uuid",
  "wineName": "Único",
  "winery": "Vega Sicilia",
  "designationOfOrigin": "Ribera del Duero DO",
  "vintage": "2018",              // or "NV"
  "imageAlt": "Bottle of Vega Sicilia Único 2018 on a neutral background",
  "createdAt": 1752566400000,
  "updatedAt": 1752566400000
}
// images["b6f2…-uuid"] = { thumb: Blob, full: Blob, mime: "image/jpeg", width: 1200, height: 1600 }
```

## Contract guarantees

| Guarantee | Mechanism | Requirement |
|---|---|---|
| All four user fields present before save | `WineInput` `.min(1)` blocks submit | FR-001, FR-002 |
| Vintage is `NV` or `YYYY` | `VINTAGE` regex | FR-003 |
| Image is an accepted format ≤ 10 MB | `validateImageFile` | FR-014 |
| Data survives reload / offline | IndexedDB persistence | FR-012 |
| Accessible images | required `imageAlt` | Principle III |
| Legitimate duplicates allowed | UUID identity; duplicate emits a **non-blocking** warning | Key Entities, duplicate edge case |

## Versioning

The IndexedDB database carries a numeric `version`; adding a store/index or a
required field is a breaking change requiring an `upgrade` migration and a PR
migration note (Constitution governance). Adding an **optional** field is
non-breaking.

# Prologue Apartment — Staged Assets

**Generated:** 2026-04-23
**Scope:** Rebuild the PrologueScene apartment (bedroom + living room) with real pixel art, replacing the current `fillRect` renderer in `src/scenes/PrologueRoomRenderer.ts`.
**Status:** Staged — NOT yet integrated. Review before running the integrate phase.

## Style constants (applied to every asset)

- `view: low top-down`
- `outline: selective outline`
- `shading: detailed shading`
- `detail: high detail`
- Tileset `tile_size: 16x16`

## Inventory

### Tilesets — `tilesets/`

| Asset | Job ID | Size | Notes |
|---|---|---|---|
| apartment_floor | `ec625650…` | 64x64 (16 tiles @ 16px) | hardwood ↔ carpet, transition 0.25 |
| apartment_wall  | `2b71ccbc…` | 64x64 (16 tiles @ 16px) | drywall ↔ baseboard, transition 0 |

### Map objects — `map-objects/`

| Asset | Job ID | Output | Requested |
|---|---|---|---|
| bed_queen         | `30b6f1f7…` | 48x48 | 48x64 |
| nightstand_alarm  | `583ad4af…` | 32x32 | 32x32 |
| desk_computer     | `51314cbd…` | 48x48 | 48x48 |
| bookshelf_tall    | `ab944a04…` | 32x32 | 32x64 |
| wall_poster       | `69e77cd0…` | 32x32 | 32x48 |
| window_day        | `029fea9c…` | 48x48 | 48x32 |
| flatscreen_tv     | `185a4e99…` | 48x48 | 48x32 |
| coffee_table      | `852b707f…` | 48x48 | 48x32 |
| couch_3seat       | `9b1e2c9e…` | 80x80 | 80x40 |
| potted_plant      | `b9b02841…` | 32x32 | 32x48 |
| front_door_closed | `22ec2d3e…` | 32x32 | 32x48 |
| interior_doorway  | `0f36db53…` | 32x32 | 32x48 |

## Known issue — non-square requests

PixelLab's map-object endpoint appears to force a square canvas: every non-square request came back at the larger square dimension (e.g. 48x32 → 48x48, 80x40 → 80x80). The art itself sits within the square with transparent padding, so it's usable — just expect extra whitespace. If a specific asset reads poorly in-game, regenerate with an explicit square size that matches the silhouette we want, or crop in post.

## Preview

```
npm run dev
```

Then browse to `http://localhost:5173/assets/_staging/` (Vite serves `public/` at root).

## Next step

Review the PNGs. When ready, ask to **integrate apartment** and I'll:

1. Move PNGs to `public/assets/tilesets/` and `public/assets/sprites/props/misc/`.
2. Wire `this.load.image(...)` calls in `src/scenes/PreloadScene.ts`.
3. Replace `drawPrologueRoom()` in `src/scenes/PrologueRoomRenderer.ts` with sprite placement against the real tileset.

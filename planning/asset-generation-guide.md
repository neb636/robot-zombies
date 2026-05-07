# Asset Generation Guide — Quiet Machines

This is the source of truth for sizing, scale, and prompt conventions when
generating new art for the game. Read it before requesting any new asset
from ChatGPT, PixelLab, or sketching one in Aseprite.

---

## Pixel scale — the canonical unit

Every asset is sized relative to the **player character**, which is fixed.
The character is the anchor; everything else is scaled to fit.

| Anchor                    | Native (PNG) | Render scale | Effective (in-game) |
|---------------------------|--------------|--------------|---------------------|
| Player character (PixelLab) | 108 × 108  | 1.55×        | **167 × 167 px**    |

From there, the world is laid out on a **32 px tile grid**:

| Element            | Effective size | In tiles | Notes                              |
|--------------------|----------------|----------|------------------------------------|
| 1 tile             | 32 px          | 1        | `TILE_SIZE` in `src/utils/constants.ts` |
| Character height   | ~167 px        | ~5       | Anchor — do not change             |
| Top wall band (cap + face) | ~240 px | ~7.5     | Player ≈ 70% of wall height        |
| Bottom wall band   | ~64 px         | 2        |                                    |
| Side wall thickness | ~32 px        | 1        |                                    |
| Floor pattern repeat | ~96 px       | 3        | Bricks/planks at character-relevant scale |

### Two valid asset workflows

1. **Native target** — the PNG is generated at exactly the effective size.
   Render scale = 1×. Cleanest path. Use this for new PixelLab jobs and
   curated Aseprite work.
2. **Native + render scale** — the PNG is at some other native size and is
   scaled at render time (e.g., `setTileScale()` for `tileSprite`s, or
   `setScale()` for sprites). Use this when working with ChatGPT outputs
   (which arrive at unpredictable resolutions) and you don't want to do
   a permanent Aseprite resize.

When option 2 is used, document the native dimensions next to the constants
in code so the scaling math is auditable. See `ApartmentRenderer.ts` for the
pattern.

---

## ChatGPT prompt template

ChatGPT is the worst offender for scale consistency — its image gen does
not respect requested pixel dimensions reliably. Treat its output as a
**reference comp**: regenerate the silhouette and palette in Aseprite, or
crop and resize before committing.

Always include all of the following in the prompt:

```
Generate a [WIDTH]×[HEIGHT] pixel-art tile for a top-down SNES-style JRPG
(Chrono Trigger / Final Fantasy VI references).

Constraints:
- Strict pixel art: nearest-neighbor edges, no anti-aliasing, no gradients,
  hard edges, limited palette (16–32 colors).
- The asset must tile seamlessly along the [horizontal/vertical] axis —
  left/right (or top/bottom) edges must match perfectly when repeated.
- Top-down perspective (camera looks straight down). For walls, use a slight
  3/4 perspective with a small cap overhang (~10 px tall on the top edge).
- Scale reference: a human character in this game is ~48 pixels tall in
  source pixels. Show a 48 px silhouette beside the asset for proportion
  calibration.
- Generate two versions side-by-side: one clean, one with a faint 16 px
  grid overlay so I can verify proportions. I will discard the grid copy.

Subject: [DESCRIBE THE ASSET — e.g., "interior brick wall, dark red brick,
 mortar joints, weathered, dim warm interior lighting"]
```

### Why these specific instructions

- **Tileability** — the renderer uses `tileSprite`, which repeats the texture.
  If edges don't match, the seam is visible at every repeat.
- **Scale reference (48 px silhouette)** — the prompt asks for a *source-pixel*
  reference, not the in-game effective height. The 48 px silhouette gives
  ChatGPT a concrete anchor; we resize after.
- **Grid overlay** — ChatGPT often ignores requested dimensions, but a grid
  reveals the actual proportions so we can see what to fix in Aseprite.

---

## PixelLab prompts

PixelLab respects size constraints. Standard character spec:

- **Frame size**: 108 × 108
- **8-direction rotation set** (south, southeast, east, northeast, north,
  northwest, west, southwest)
- **Idle + walk animations** per direction

For tilesets and map objects, see `pixellab-assets` skill — it submits jobs
async and stages results at `public/assets/_staging/` for review before
integrating.

---

## Aseprite touch-up workflow

Most ChatGPT outputs need post-processing. Common operations:

1. **Resize to target** — `Sprite → Sprite Size`, set the target effective
   size, choose nearest-neighbor.
2. **Tileable edges** — `Edit → Shift` (or use the tile mode preview) to
   verify edges seam cleanly.
3. **Crop to game-relevant portion** — strip ChatGPT decoration like grid
   overlays, scale references, watermarks.
4. **Palette quantization** — `Sprite → Color Mode → Indexed` with a 16–32
   color palette, for consistency across the project.
5. **Slice into multiple assets** — for ChatGPT scenes generated as a single
   image (rooms, locations), use slices to export sub-regions as separate
   PNGs.

Final files go into the relevant `src/scenes/<scene>/assets/` folder, never
into `public/`.

---

## When proportions look wrong in-game

If an asset looks out of scale once rendered, the diagnostic order is:

1. **Compare against the player** — does the player read at ~70% of the top
   wall, ~5 tiles tall, and roughly chest-height through doorways?
2. **Check `setTileScale` / `setScale`** in the scene's renderer — is the
   asset being scaled correctly to its target effective size?
3. **Check the source PNG dimensions** — ChatGPT outputs vary widely; an
   asset that looks fine in isolation may be 3× the expected pixel count.
4. **Check the floor tile scale** — if walls and characters look right but
   the floor reads wrong, it's `FLOOR_TILE_SCALE` (or the equivalent in
   another scene).

When in doubt, screenshot the scene at native zoom, drop it into Aseprite
alongside a 48 px character silhouette, and measure pixel-for-pixel.

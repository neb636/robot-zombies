# Player — staged PixelLab output

**Date:** 2026-04-18
**Character ID:** `42b5f674-adca-4c42-9336-f66620c3969a`
**Category:** characters
**Status:** in-review

## Prompt

> A weary but determined everyman in his early 30s. Short dark brown hair, light stubble, lean build. Wears a faded olive sage-green t-shirt, worn blue jeans with a leather belt, grey canvas sneakers. A makeshift melee weapon (short length of pipe or wrench) tucked through his belt. Clothes show wear — small tears and road dust — but he reads as an ordinary contemporary person who has been surviving, not a costumed warrior. Warm tired face. Hands scuffed. Post-apocalyptic survivor grounded in modern streetwear.

Reference image: `istockphoto-471947578-1024x1024.jpg` (repo root) — contemporary casual guy in olive tee + blue jeans + grey sneakers.

## Generation parameters

| Field | Value |
|---|---|
| `size` | `48` (canvas 68×68) |
| `n_directions` | `8` (S, SE, E, NE, N, NW, W, SW) |
| `body_type` | `humanoid` (mannequin template) |
| `view` | `low top-down` |
| `outline` | `selective outline` |
| `shading` | `detailed shading` |
| `detail` | `high detail` |
| `proportions` | `{"type": "preset", "name": "default"}` |
| `mode` | `standard` |

## Contents

```
rotations/                     # 8 static directional sprites
animations/
  breathing-idle/              # 8 dirs × 4 frames
  walking-4-frames/            # 8 dirs × 4 frames
  running-4-frames/            # 8 dirs × 4 frames
  fight-stance-idle-8-frames/  # 8 dirs × 8 frames
  taking-punch/                # 8 dirs × 6 frames
  jumping-2/                   # 8 dirs × 8 frames
metadata.json                  # raw PixelLab export
player.zip                     # original download
```

Animation folder mapping was inferred from frame counts + visual inspection (PixelLab's metadata.json uses hashed folder names; renamed here for clarity).

Total: 48 animation job entries, 264 animation frames + 8 rotation sprites.

## Not produced by PixelLab

- **Sitting pose** — no template animation exists; plan is to hand-author in Aseprite from an idle frame. Custom generation skipped due to 20–40× cost.
- Jumping is covered by the `jumping-2` template (full 8-frame anim), not a single static pose as originally requested.

## Preview

- Dev server: `http://localhost:5173/assets/_staging/characters/player/`
- Finder: open `rotations/south.png` for the canonical front-facing sprite.
- PixelLab rotation sheet (original): https://backblaze.pixellab.ai/file/pixellab-characters/f4aa2e85-e618-4c5b-aaca-52e8aa1ba734/42b5f674-adca-4c42-9336-f66620c3969a/rotations/south.png

## Next

Review. When ready, say "integrate player" to move files into `public/assets/sprites/characters/` and wire `src/scenes/PreloadScene.ts`.

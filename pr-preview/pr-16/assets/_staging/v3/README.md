# ApartmentV3 — Staged Furniture Sprites

**Generated:** 2026-04-25
**Scope:** 14 map-object PNGs for `ApartmentV3Scene`. Floor + wall tilesets are NOT here — those are chopped from `6.png` and live at `public/assets/tilesets/v3/`.
**Status:** Staged — NOT yet integrated. Review before moving into `public/assets/sprites/props/apartment_v3/`.

## Style settings (every asset)

- `view: low top-down`
- `outline: selective outline`
- `shading: detailed shading`
- `detail: high detail`
- Aesthetic: warm-brown SNES-JRPG 16-bit residential, matching `6.png` reference

## Inventory

All in `map-objects/`.

| Asset | Size | PixelLab Job ID |
|---|---|---|
| bed_queen | 64×64 | `f2536bb2-972f-4639-864a-ff4e4ac1fabc` |
| nightstand_alarm | 32×32 | `c91a5c07-7572-4225-bf4e-21925af52950` |
| dresser_low | 48×48 | `a3c5f1fa-a7b9-4117-ac44-b646c271675f` |
| desk_computer | 64×64 | `a5800d5b-9807-40c6-a5ce-20501e643940` |
| couch_3seat | 96×96 | `e167b269-62ee-4d6f-b06d-3df38cc65172` |
| coffee_table_rug | 80×80 | `9d1f909e-1810-48aa-ae0f-e63ea3ff269b` |
| flatscreen_tv | 48×48 | `90e972dc-8267-4e5a-a2b7-386a511d0f32` |
| front_door_closed | 32×48 (returned 32×32) | `ac8647de-4b6d-4761-996f-bb91613c0c79` |
| window_day | 48×32 (returned 48×48) | `db054e20-1aa4-4d75-8677-c6ee705e7522` |
| wall_clock | 32×32 | `e8ba9e45-10ce-4933-8825-55c067d02778` |
| coat_rack_hanging | 32×32 | `72a58a5c-ce7d-480a-aa26-d09bdd7fa989` |
| potted_plant_small | 32×32 | `a11e1504-56b1-47c6-bc6d-f5f989dfad8d` |
| potted_plant_large | 48×48 | `cacdb49a-2f4b-427e-a4ea-e7ee9ca246ca` |
| cat_sleeping | 32×32 | `64a4f579-3d74-4258-92ad-fdc707dbf705` |

## Submission notes

- First batch of 14 hit PixelLab's concurrent-job limit; 6 returned 429. Resubmitted in two follow-up batches (6 + 1).
- The two non-square requests (`front_door_closed` 32×48, `window_day` 48×32) — server appears to have squared them anyway. The art still sits within a square canvas; placements in `apartment_v3.json` use centered origin so this should be fine, but if either reads poorly, regenerate at the explicit silhouette square.

## Preview

```
npm run dev
```

Then browse to `http://localhost:3000/robot-zombies/assets/_staging/v3/map-objects/` (Vite serves `public/` at root) — or jump to `ApartmentV3Scene` via the DevScene panel (backtick) once integrated.

## Next step

Review the PNGs. When ready, ask to **integrate apartment v3** and I'll:

1. Move PNGs from `public/assets/_staging/v3/map-objects/` → `public/assets/sprites/props/apartment_v3/`.
2. Confirm path matches in `src/data/scenes/apartment_v3.json` (already pointing at `assets/sprites/props/apartment_v3/<name>.png`).
3. Re-launch the scene and verify each sprite renders in the right spot.
4. Delete the staging folder.

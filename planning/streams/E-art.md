# Stream E — Art (Procedural Sprite Extensions)

## Scope

Extend the existing procedural sprite generation system (which currently produces placeholder rectangles for characters/enemies) with region tilesets, new NPC sprites, and new enemy sprites. Match the existing style: silhouette + palette + one accent detail. No painterly rendering.

**Style cap:** Do not exceed the existing art complexity. If tempted to add shading, animations, or facial features — stop. The cap is: character sprite = 32×48 block with one distinguishing color plus one accent shape (hat, rifle, etc.). Keep it consistent.

## Files you OWN (create)

### Region tileset generators
- `src/art/generators/regions/boston.ts` — concrete, brick, rubble palette
- `src/art/generators/regions/appalachia.ts` — forest greens, dirt paths
- `src/art/generators/regions/deep_south.ts` — bayou, swamp, jazz neon
- `src/art/generators/regions/great_plains.ts` — wheat gold, storm gray
- `src/art/generators/regions/rockies.ts` — snow white, stone gray, pine dark
- `src/art/generators/regions/silicon_valley.ts` — pristine pastel, glass
- `src/art/generators/regions/index.ts`

### NPC sprites
- `src/art/generators/npcs/sam.ts`
- `src/art/generators/npcs/tilly.ts`
- `src/art/generators/npcs/cora.ts`
- `src/art/generators/npcs/rook.ts`
- `src/art/generators/npcs/tomas.ts`
- `src/art/generators/npcs/gideon.ts`
- `src/art/generators/npcs/lila.ts`
- `src/art/generators/npcs/mrGray.ts`
- `src/art/generators/npcs/elena.ts` (still image — archival)
- `src/art/generators/npcs/ghost.ts`
- `src/art/generators/npcs/index.ts`

### Enemy sprites
- `src/art/generators/enemies/excavatorPrime.ts`
- `src/art/generators/enemies/wardenSix.ts` (single generator, 3 tint variants)
- `src/art/generators/enemies/theGovernor.ts`
- `src/art/generators/enemies/sentinelSpire.ts`
- `src/art/generators/enemies/gateColossus.ts`
- `src/art/generators/enemies/aerialSentinel.ts`
- `src/art/generators/enemies/bayouSwimmer.ts`
- `src/art/generators/enemies/convertedCitizen.ts`
- `src/art/generators/enemies/bridgeEnforcer.ts`
- `src/art/generators/enemies/blockadeSentry.ts`
- `src/art/generators/enemies/desertScavenger.ts`
- `src/art/generators/enemies/eliteSecurityBot.ts`
- `src/art/generators/enemies/complianceSwarm.ts`
- `src/art/generators/enemies/index.ts`

## Files you MAY MODIFY (sole owner)

- `src/scenes/PreloadScene.ts` — register your generators. Existing code registers Hero, Maya, etc. via procedural generation; extend the same pattern with the new generators.

## Files you MAY NOT TOUCH

- Any character def.
- Any enemy config.
- Any scene other than PreloadScene.

## API each generator must expose

```ts
export function registerSprite(scene: Phaser.Scene, key: string): void;
// Called from PreloadScene. Generates a texture via scene.textures.generate or canvas draw, keyed by `key`.
```

All generators produce pixel-art textures. Use `Phaser.GameObjects.Graphics` → `generateTexture()` to turn vector ops into a texture, OR draw to an HTMLCanvas and `addCanvas`. Existing PreloadScene uses the former — follow that pattern.

## Acceptance

1. PreloadScene registers all new sprites without errors.
2. Running `npm run dev` boots with no `texture not found` warnings when a new scene references a new sprite key.
3. Each NPC sprite is visually distinguishable from the others (unique color + accent).
4. Each region tileset generator produces a 4×4 tile sheet that a tilemap can reference.
5. `npm run typecheck` clean.

## Reference reading

- `src/scenes/PreloadScene.ts` existing procedural generation (READ FIRST — mirror the pattern exactly)
- `planning/side_characters.md` — for each NPC, pick a palette that matches their voice
- `public/assets/sprites/props/` — existing prop art for palette calibration

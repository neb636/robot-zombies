import Phaser from "phaser";
import {
  APARTMENT_TILESET_URLS,
  APARTMENT_WALL_URLS,
} from "./assets.js";

// ─── Layout constants ────────────────────────────────────────────────────────
//
// PixelLab characters are the size-of-truth. The hero sprite is 108 × 108
// native, but the visible body inside that frame is only ~40 × 60 px (the
// PNG has lots of transparent padding). At setScale(1.55), that gives a
// rendered body of ~62 × 93 px. Wall band sizes are chosen so the player
// reads at ~70% of the top wall band.
//
// Source assets are tile-scaled at render time to fit these target bands:
//   wall-top-screen.png   →  11 × 217 native  → tiled into TOP_WALL_H band
//   wall-bottom.png       →  10 × 92 native   → tiled into BOTTOM_WALL_H band
//   wall-right.png        →  24 × 20 native   → tiled into SIDE_WALL_W column

const WALL_TOP_NATIVE_H    = 217;
const WALL_BOTTOM_NATIVE_H = 92;
const WALL_SIDE_NATIVE_W   = 24;

export const TOP_WALL_H    = 96; // 3 tiles — player body (~62 px) ≈ 65% of wall
export const BOTTOM_WALL_H = 32; // 1 tile
export const SIDE_WALL_W   = 16; // ½ tile

export const FLOOR_W = 624;
export const FLOOR_H = 320;

export const MAP_W = SIDE_WALL_W * 2 + FLOOR_W;
export const MAP_H = TOP_WALL_H + FLOOR_H + BOTTOM_WALL_H;

export const FLOOR_X = SIDE_WALL_W;
export const FLOOR_Y = TOP_WALL_H;

const FLOOR_TEXTURE_KEY = "apartment_floor_texture";
const FLOOR_TILE_SCALE  = 0.14;

const WALL_KEYS = {
  top:    "apartment_wall_top",
  bottom: "apartment_wall_bottom",
  side:   "apartment_wall_side",
} as const;

/**
 * Preload textures used by the prologue apartment room (floor + tileable
 * wall strips). Idempotent; safe to call from any preload().
 */
export function preloadApartmentAssets(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FLOOR_TEXTURE_KEY)) {
    scene.load.image(FLOOR_TEXTURE_KEY, APARTMENT_TILESET_URLS.apartment_floor_texture);
  }
  for (const [name, url] of Object.entries(APARTMENT_WALL_URLS)) {
    if (!scene.textures.exists(name)) {
      scene.load.image(name, url);
    }
  }
}

/**
 * Draw the empty prologue apartment: floor + four tiled walls. Furniture and
 * interactables are intentionally not rendered here — the scene composes them
 * on top.
 */
export function drawPrologueRoom(scene: Phaser.Scene): void {
  // Floor — repeating texture inside the four walls.
  scene.add
    .tileSprite(FLOOR_X, FLOOR_Y, FLOOR_W, FLOOR_H, FLOOR_TEXTURE_KEY)
    .setOrigin(0, 0)
    .setTileScale(FLOOR_TILE_SCALE, FLOOR_TILE_SCALE)
    .setDepth(0);

  // Side walls span the full map height; top/bottom walls sit between them.
  const TOP_BOT_W = MAP_W - SIDE_WALL_W * 2;

  // Top wall — between the side walls. setTileScale on the Y axis stretches
  // the 217 px native texture to fill the TOP_WALL_H band.
  scene.add
    .tileSprite(SIDE_WALL_W, 0, TOP_BOT_W, TOP_WALL_H, WALL_KEYS.top)
    .setOrigin(0, 0)
    .setTileScale(1, TOP_WALL_H / WALL_TOP_NATIVE_H)
    .setDepth(1);

  // Bottom wall — between the side walls.
  scene.add
    .tileSprite(SIDE_WALL_W, MAP_H - BOTTOM_WALL_H, TOP_BOT_W, BOTTOM_WALL_H, WALL_KEYS.bottom)
    .setOrigin(0, 0)
    .setTileScale(1, BOTTOM_WALL_H / WALL_BOTTOM_NATIVE_H)
    .setDepth(1);

  // Right wall — full map height.
  scene.add
    .tileSprite(MAP_W - SIDE_WALL_W, 0, SIDE_WALL_W, MAP_H, WALL_KEYS.side)
    .setOrigin(0, 0)
    .setTileScale(SIDE_WALL_W / WALL_SIDE_NATIVE_W, 1)
    .setDepth(2);

  // Left wall — same texture, mirrored on the X axis.
  scene.add
    .tileSprite(0, 0, SIDE_WALL_W, MAP_H, WALL_KEYS.side)
    .setOrigin(0, 0)
    .setTileScale(SIDE_WALL_W / WALL_SIDE_NATIVE_W, 1)
    .setFlipX(true)
    .setDepth(2);
}

/**
 * Create static physics zones that match the four walls. Returns the zones
 * so callers can wire colliders against the player sprite.
 */
export function buildApartmentWalls(scene: Phaser.Scene): Phaser.GameObjects.Zone[] {
  const zones: Phaser.GameObjects.Zone[] = [];

  const addWall = (cx: number, cy: number, w: number, h: number): void => {
    const zone = scene.add.zone(cx, cy, w, h);
    scene.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zones.push(zone);
  };

  // Top, bottom, left, right.
  addWall(MAP_W / 2,            TOP_WALL_H / 2,           MAP_W,        TOP_WALL_H);
  addWall(MAP_W / 2,            MAP_H - BOTTOM_WALL_H / 2, MAP_W,        BOTTOM_WALL_H);
  addWall(SIDE_WALL_W / 2,      FLOOR_Y + FLOOR_H / 2,    SIDE_WALL_W,  FLOOR_H);
  addWall(MAP_W - SIDE_WALL_W / 2, FLOOR_Y + FLOOR_H / 2, SIDE_WALL_W,  FLOOR_H);

  return zones;
}

import Phaser from 'phaser';
import {
  APARTMENT_OBJECT_URLS,
  APARTMENT_V3_TILESET_URLS,
} from './assets.js';

export interface V3ObjectDef {
  asset: string;
  x: number;
  y: number;
  origin?: number[];
  depth?: number;
}

export interface V3WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface V3SceneLayout {
  title: string;
  mapWidth: number;
  mapHeight: number;
  wallThickness: number;
  topWallHeight: number;
  tilesets: { floor: string; wall: string };
  mapObjects: Record<string, string>;
  objects: V3ObjectDef[];
  walls: V3WallRect[];
  playerStart?: { x: number; y: number };
  camera?: { zoom?: number };
}

const FLOOR_KEY = 'apt_v3_floor';
const WALL_KEY  = 'apt_v3_wall';

export function preloadV3Assets(scene: Phaser.Scene, layout: V3SceneLayout): void {
  if (!scene.textures.exists(FLOOR_KEY)) {
    scene.load.image(FLOOR_KEY, APARTMENT_V3_TILESET_URLS.apartment_v3_floor);
  }
  if (!scene.textures.exists(WALL_KEY)) {
    scene.load.image(WALL_KEY, APARTMENT_V3_TILESET_URLS.apartment_v3_wall);
  }
  // V3 sandbox borrows its prop URLs from the V1 object set; the V3 PNG pack
  // hasn't been generated, so missing assets log a warning and render skips
  // them (existing behavior). Names are still keyed via cache so the scene
  // can render whatever subset is available.
  for (const name of Object.keys(layout.mapObjects)) {
    const key = `apt_v3_obj_${name}`;
    const url = APARTMENT_OBJECT_URLS[name];
    if (!scene.textures.exists(key) && url) {
      scene.load.image(key, url);
    }
  }
}

export function drawApartmentV3(scene: Phaser.Scene, layout: V3SceneLayout): void {
  const { mapWidth: W, mapHeight: H, wallThickness: T, topWallHeight: TH } = layout;

  scene.add.tileSprite(0, TH, W, H - TH, FLOOR_KEY).setOrigin(0, 0).setDepth(0);

  scene.add.tileSprite(0, 0,         W, TH, WALL_KEY).setOrigin(0, 0).setDepth(1);
  scene.add.tileSprite(0, H - T,     W, T,  WALL_KEY).setOrigin(0, 0).setDepth(1);
  scene.add.tileSprite(0, TH,        T, H - TH - T, WALL_KEY).setOrigin(0, 0).setDepth(1);
  scene.add.tileSprite(W - T, TH,    T, H - TH - T, WALL_KEY).setOrigin(0, 0).setDepth(1);

  for (const o of layout.objects) {
    const key = `apt_v3_obj_${o.asset}`;
    if (!scene.textures.exists(key)) {
      console.warn(`[apartment-v3] missing object texture '${o.asset}' (key: ${key})`);
      continue;
    }
    const ox = o.origin?.[0] ?? 0.5;
    const oy = o.origin?.[1] ?? 0.5;
    const depth = o.depth ?? o.y;
    scene.add.image(o.x, o.y, key).setOrigin(ox, oy).setDepth(depth);
  }
}

export function buildV3Walls(
  scene: Phaser.Scene,
  layout: V3SceneLayout,
): Phaser.GameObjects.Zone[] {
  const { mapWidth: W, mapHeight: H, wallThickness: T, topWallHeight: TH } = layout;
  const zones: Phaser.GameObjects.Zone[] = [];

  const addWall = (cx: number, cy: number, w: number, h: number): void => {
    const z = scene.add.zone(cx, cy, w, h);
    scene.physics.world.enable(z, Phaser.Physics.Arcade.STATIC_BODY);
    zones.push(z);
  };

  addWall(W / 2,        TH / 2,         W,  TH);
  addWall(W / 2,        H - T / 2,      W,  T);
  addWall(T / 2,        H / 2,          T,  H);
  addWall(W - T / 2,    H / 2,          T,  H);

  for (const r of layout.walls) {
    addWall(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
  }

  return zones;
}

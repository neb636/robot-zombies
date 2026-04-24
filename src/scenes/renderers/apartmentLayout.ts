import Phaser from 'phaser';

export interface TileMeta {
  corners: { NE: string; NW: string; SE: string; SW: string };
  bounding_box: { x: number; y: number; width: number; height: number };
}

export interface TilesetJson {
  tile_size: { width: number; height: number };
  tileset_data: { tiles: TileMeta[] };
  tileset_image: { dimensions: { width: number; height: number } };
}

export interface RegionDef {
  tileset: string;
  variant: 'lower' | 'upper';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ObjectDef {
  asset: string;
  x: number;
  y: number;
  origin?: number[];
}

export interface SceneLayout {
  title: string;
  mapWidth: number;
  mapHeight: number;
  cellSize: number;
  tilesets: Record<string, string>;
  mapObjects: Record<string, string>;
  regions: RegionDef[];
  objects: ObjectDef[];
  playerStart?: { x: number; y: number };
  camera?: { zoom?: number };
}

export interface RendererBindings {
  tilesetTextureKey: (name: string) => string;
  tilesetMeta: (name: string) => TilesetJson | undefined;
  objectTextureKey: (name: string) => string;
}

export function findPureTile(meta: TilesetJson, variant: 'lower' | 'upper'): TileMeta | null {
  for (const t of meta.tileset_data.tiles) {
    const c = t.corners;
    if (c.NE === variant && c.NW === variant && c.SE === variant && c.SW === variant) {
      return t;
    }
  }
  return null;
}

export function renderApartment(
  scene: Phaser.Scene,
  layout: SceneLayout,
  b: RendererBindings,
): void {
  for (const r of layout.regions) {
    const meta = b.tilesetMeta(r.tileset);
    if (!meta) {
      console.warn(`[apartment] missing metadata for tileset '${r.tileset}'`);
      continue;
    }
    const tile = findPureTile(meta, r.variant);
    if (!tile) {
      console.warn(`[apartment] no pure '${r.variant}' tile in '${r.tileset}'`);
      continue;
    }

    const texKey = b.tilesetTextureKey(r.tileset);
    const tex = scene.textures.get(texKey);
    const frameKey = `${r.tileset}_${r.variant}`;
    if (!tex.has(frameKey)) {
      tex.add(
        frameKey, 0,
        tile.bounding_box.x, tile.bounding_box.y,
        tile.bounding_box.width, tile.bounding_box.height,
      );
    }

    const cell = layout.cellSize;
    for (let y = 0; y < r.h; y += cell) {
      for (let x = 0; x < r.w; x += cell) {
        scene.add.image(r.x + x, r.y + y, texKey, frameKey).setOrigin(0, 0);
      }
    }
  }

  for (const o of layout.objects) {
    const key = b.objectTextureKey(o.asset);
    if (!scene.textures.exists(key)) {
      console.warn(`[apartment] missing object texture '${o.asset}' (key: ${key})`);
      continue;
    }
    const ox = o.origin?.[0] ?? 0.5;
    const oy = o.origin?.[1] ?? 0.5;
    scene.add.image(o.x, o.y, key).setOrigin(ox, oy).setDepth(o.y);
  }
}

import Phaser from 'phaser';
import layout from '../data/scenes/prologue_apartment.json';
import { renderApartment, type SceneLayout, type TilesetJson } from './renderers/apartmentLayout.js';

export const MAP_W      = 704;
export const MAP_H      = 480;
export const WALL_T     = 16;
export const TOP_WALL_H = 48;
export const DIVIDER_X  = 344;
export const DOOR_TOP   = 248;
export const DOOR_BOT   = 280;
export const FDOOR_TOP  = 248;
export const FDOOR_BOT  = 280;

const TILESETS = ['apartment_floor', 'apartment_wall'];

/**
 * Preload apartment tilesets, metadata, and prop sprites. Call from the
 * parent scene's preload(); idempotent across scenes.
 */
export function preloadApartmentAssets(scene: Phaser.Scene): void {
  for (const name of TILESETS) {
    if (!scene.textures.exists(`tileset_${name}`)) {
      scene.load.image(`tileset_${name}`, `assets/tilesets/${name}.png`);
    }
    if (!scene.cache.json.exists(`tileset_${name}_meta`)) {
      scene.load.json(`tileset_${name}_meta`, `assets/tilesets/${name}.json`);
    }
  }
  for (const [name, path] of Object.entries((layout as SceneLayout).mapObjects)) {
    if (name === 'hero_preview') continue;
    const key = `prop_${name}`;
    if (!scene.textures.exists(key)) {
      scene.load.image(key, path);
    }
  }
}

/**
 * Render the prologue apartment (floor tiles, walls, furniture props) from
 * the layout JSON. Assets must have been loaded via preloadApartmentAssets().
 */
export function drawPrologueRoom(scene: Phaser.Scene): void {
  renderApartment(scene, layout as SceneLayout, {
    tilesetTextureKey: n => `tileset_${n}`,
    tilesetMeta:       n => scene.cache.json.get(`tileset_${n}_meta`) as TilesetJson | undefined,
    objectTextureKey:  n => `prop_${n}`,
  });
}

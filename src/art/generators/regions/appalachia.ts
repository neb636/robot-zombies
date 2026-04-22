import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Appalachia tileset — 16×16 tiles, 4 wide (dirt path, forest floor, rock, cabin plank).
 * Palette: earthy greens, brown, mossy accent.
 */
export const generateAppalachiaTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const DIRT   = 0x4a3520;
  const GRASS  = 0x2a4a1a;
  const MOSS   = 0x3a6a2a;
  const ROCK   = 0x5a5050;
  const PLANK  = 0x6a4020;

  const g = scene.make.graphics({}, false);

  // Tile 0: dirt path
  g.fillStyle(DIRT);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(0x3a2510);
  g.fillRect(3, 5, 2, 2);
  g.fillRect(10, 10, 3, 2);

  // Tile 1: forest floor / grass
  g.fillStyle(GRASS);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(MOSS);
  g.fillRect(TW + 1, 2, 3, 3);
  g.fillRect(TW + 9, 8, 4, 3);
  g.fillRect(TW + 4, 12, 5, 2);

  // Tile 2: rock / stone
  g.fillStyle(ROCK);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(0x3a3030);
  g.fillRect(TW * 2 + 5, 4, 6, 1);
  g.fillRect(TW * 2 + 2, 9, 10, 1);
  g.fillStyle(0x7a7070);
  g.fillRect(TW * 2 + 6, 5, 3, 3);

  // Tile 3: cabin plank floor
  g.fillStyle(PLANK);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(0x4a2a10);
  g.fillRect(TW * 3, 4, TW, 1);
  g.fillRect(TW * 3, 10, TW, 1);
  g.fillStyle(0x8a6030);
  g.fillRect(TW * 3 + 3, 5, 4, 4);

  g.generateTexture('tileset_appalachia', TW * 4, TH);
  g.destroy();
};

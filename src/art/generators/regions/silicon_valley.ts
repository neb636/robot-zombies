import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Silicon Valley tileset — 16×16 tiles, 4 wide (polished floor, glass wall, campus grass, server grid).
 * Palette: pristine white, cold blue, grass green — utopia horror palette.
 */
export const generateSiliconValleyTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const WHITE  = 0xf0f2f4;
  const BLUE   = 0x0055aa;
  const GLASS  = 0x8ab8d8;
  const GRASS  = 0x3a8a30;
  const GRID   = 0x1a1a2a;

  const g = scene.make.graphics({}, false);

  // Tile 0: polished floor — subtle grid seam
  g.fillStyle(WHITE);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(0xd8dadc);
  g.fillRect(0, 8, TW, 1);
  g.fillRect(8, 0, 1, TH);

  // Tile 1: glass wall — blue tinted
  g.fillStyle(GLASS);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(BLUE);
  g.fillRect(TW, 0, 2, TH);
  g.fillStyle(0xaad0e8);
  g.fillRect(TW + 4, 3, 8, 8);

  // Tile 2: campus grass — too perfect
  g.fillStyle(GRASS);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(0x2a6a20);
  g.fillRect(TW * 2 + 0, 8, TW, 1);
  g.fillRect(TW * 2 + 8, 0, 1, 8);

  // Tile 3: server / data floor grid
  g.fillStyle(GRID);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(BLUE);
  g.fillRect(TW * 3 + 1, 1, 6, 6);
  g.fillRect(TW * 3 + 9, 9, 6, 6);
  g.fillStyle(WHITE);
  g.fillRect(TW * 3 + 3, 3, 2, 2);
  g.fillRect(TW * 3 + 11, 11, 2, 2);

  g.generateTexture('tileset_silicon_valley', TW * 4, TH);
  g.destroy();
};

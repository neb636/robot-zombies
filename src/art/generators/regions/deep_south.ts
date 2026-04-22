import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Deep South tileset — 16×16 tiles, 4 wide (bayou mud, swamp water, wood dock, kudzu).
 * Palette: murky greens, muddy brown, muted amber accent.
 */
export const generateDeepSouthTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const MUD    = 0x3a2a10;
  const WATER  = 0x1a3030;
  const DOCK   = 0x5a3810;
  const KUDZU  = 0x2a5020;
  const AMBER  = 0x8a6010;

  const g = scene.make.graphics({}, false);

  // Tile 0: bayou mud
  g.fillStyle(MUD);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(0x2a1a08);
  g.fillRect(5, 6, 4, 3);
  g.fillRect(11, 2, 2, 2);

  // Tile 1: swamp water — ripple accent
  g.fillStyle(WATER);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(0x2a4444);
  g.fillRect(TW + 3, 5, 7, 1);
  g.fillRect(TW + 5, 10, 5, 1);

  // Tile 2: wood dock
  g.fillStyle(DOCK);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(0x3a2008);
  g.fillRect(TW * 2, 5, TW, 1);
  g.fillRect(TW * 2, 11, TW, 1);
  g.fillStyle(AMBER);
  g.fillRect(TW * 2 + 4, 6, 2, 4);
  g.fillRect(TW * 2 + 10, 6, 2, 4);

  // Tile 3: kudzu / overgrowth
  g.fillStyle(0x1a2a10);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(KUDZU);
  g.fillRect(TW * 3 + 1, 2, 5, 4);
  g.fillRect(TW * 3 + 8, 5, 6, 5);
  g.fillRect(TW * 3 + 3, 10, 8, 4);

  g.generateTexture('tileset_deep_south', TW * 4, TH);
  g.destroy();
};

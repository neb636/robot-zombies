import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Rockies tileset — 16×16 tiles, 4 wide (snow/ice, grey stone, pine floor, alpine meadow).
 * Palette: cool blue-white, slate grey, pine green accent.
 */
export const generateRockiesTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const SNOW   = 0xd8e8f0;
  const STONE  = 0x6a6870;
  const PINE   = 0x1a3a20;
  const MEADOW = 0x4a6a30;
  const ICE    = 0x9abaca;

  const g = scene.make.graphics({}, false);

  // Tile 0: snow / ice floor
  g.fillStyle(SNOW);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(ICE);
  g.fillRect(4, 5, 5, 3);
  g.fillRect(11, 10, 3, 3);

  // Tile 1: grey stone
  g.fillStyle(STONE);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(0x4a484a);
  g.fillRect(TW + 3, 4, 8, 1);
  g.fillRect(TW + 7, 9, 6, 1);
  g.fillStyle(0x8a8890);
  g.fillRect(TW + 5, 6, 3, 2);

  // Tile 2: pine needle floor
  g.fillStyle(0x0a1a0a);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(PINE);
  g.fillRect(TW * 2 + 2, 3, 4, 3);
  g.fillRect(TW * 2 + 9, 7, 5, 3);
  g.fillRect(TW * 2 + 1, 11, 7, 3);

  // Tile 3: alpine meadow
  g.fillStyle(MEADOW);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(0x6a8a40);
  g.fillRect(TW * 3 + 1, 4, 3, 2);
  g.fillRect(TW * 3 + 8, 9, 4, 2);
  g.fillStyle(SNOW);
  g.fillRect(TW * 3 + 5, 6, 2, 2);

  g.generateTexture('tileset_rockies', TW * 4, TH);
  g.destroy();
};

import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Boston tileset — 16×16 tiles, 4 wide (floor, wall, rubble, road).
 * Palette: asphalt grey, rust-orange accent, dark brick.
 */
export const generateBostonTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const ASPHALT = 0x2a2a30;
  const BRICK   = 0x4a2a1a;
  const RUST    = 0x8b3a10;
  const GROUT   = 0x1a1a1e;

  const g = scene.make.graphics({}, false);

  // Tile 0: cracked floor / asphalt
  g.fillStyle(ASPHALT);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(GROUT);
  g.fillRect(4, 7, 8, 1);
  g.fillRect(10, 2, 1, 5);

  // Tile 1: brick wall
  g.fillStyle(BRICK);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(GROUT);
  for (let row = 0; row < 4; row++) {
    const offsetX = (row % 2) * 5;
    for (let col = 0; col < 3; col++) {
      g.fillRect(TW + offsetX + col * 7 - 1, row * 4, 1, 4);
    }
    g.fillRect(TW, row * 4, TW, 1);
  }

  // Tile 2: rubble / debris
  g.fillStyle(ASPHALT);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(BRICK);
  g.fillRect(TW * 2 + 2, 3,  5, 4);
  g.fillRect(TW * 2 + 9, 8,  4, 5);
  g.fillRect(TW * 2 + 1, 10, 6, 3);

  // Tile 3: road / accent stripe
  g.fillStyle(ASPHALT);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(RUST);
  g.fillRect(TW * 3 + 6, 0, 3, TH);

  g.generateTexture('tileset_boston', TW * 4, TH);
  g.destroy();
};

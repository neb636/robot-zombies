import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Great Plains tileset — 16×16 tiles, 4 wide (dry grass, hardpan, wheat field, highway).
 * Palette: pale wheat, burnt ochre, faded grey — existential dread palette.
 */
export const generateGreatPlainsTiles: SpriteGenerator = (scene: Phaser.Scene) => {
  const TW = 16, TH = 16;
  const WHEAT    = 0x9a8030;
  const HARDPAN  = 0x7a6040;
  const PALE     = 0xc0a850;
  const HIGHWAY  = 0x3a3a38;
  const STRIPE   = 0xc0b820;

  const g = scene.make.graphics({}, false);

  // Tile 0: dry grass — sparse blades
  g.fillStyle(HARDPAN);
  g.fillRect(0, 0, TW, TH);
  g.fillStyle(WHEAT);
  g.fillRect(2, 8, 1, 5);
  g.fillRect(6, 6, 1, 6);
  g.fillRect(11, 9, 1, 4);
  g.fillRect(14, 5, 1, 7);

  // Tile 1: hardpan / cracked earth
  g.fillStyle(HARDPAN);
  g.fillRect(TW, 0, TW, TH);
  g.fillStyle(0x5a4020);
  g.fillRect(TW + 0, 6, 9, 1);
  g.fillRect(TW + 8, 6, 1, 6);
  g.fillRect(TW + 3, 11, 6, 1);

  // Tile 2: wheat field — dense
  g.fillStyle(0x8a6820);
  g.fillRect(TW * 2, 0, TW, TH);
  g.fillStyle(PALE);
  for (let col = 0; col < 4; col++) {
    g.fillRect(TW * 2 + col * 4 + 1, 3, 2, 10);
  }

  // Tile 3: highway — yellow center stripe
  g.fillStyle(HIGHWAY);
  g.fillRect(TW * 3, 0, TW, TH);
  g.fillStyle(STRIPE);
  g.fillRect(TW * 3 + 7, 0, 2, 5);
  g.fillRect(TW * 3 + 7, 9, 2, 7);

  g.generateTexture('tileset_great_plains', TW * 4, TH);
  g.destroy();
};

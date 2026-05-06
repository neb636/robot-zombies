import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Farmhand NPC — great plains volunteer convert or genuine holdout. 32×48, 4 frames.
 * Accent: denim overalls, straw hat, hoe tool in hand.
 */
export const generateFarmhandSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN     = 0xc89060;
  const DENIM    = 0x4a6a9a;
  const STRAP    = 0x3a5a8a;
  const HAT      = 0xd0a820;
  const HATSTRAW = 0xb08010;
  const SHOE     = 0x2a1a08;
  const TOOL     = 0x5a4020;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;

    g.fillStyle(SHOE);
    g.fillRect(cx - 8, 43, 7, 5);
    g.fillRect(cx + 1, 43, 7, 5);

    // overalls
    g.fillStyle(DENIM);
    g.fillRect(cx - 8, 18, 16, 26);
    // bib
    g.fillRect(cx - 5, 14, 10, 6);
    // straps
    g.fillStyle(STRAP);
    g.fillRect(cx - 8, 14, 2, 6);
    g.fillRect(cx + 6, 14, 2, 6);

    // leg split
    g.fillStyle(0x3a5a8a);
    g.fillRect(cx - 8, 30 + legLift, 7, 13 - legLift);
    g.fillRect(cx + 1, 30 + (2 - legLift), 7, 13 - (2 - legLift));

    // arms + hoe tool
    g.fillStyle(SKIN);
    g.fillRect(cx - 12, 18, 4, 10);
    g.fillRect(cx + 8, 18, 4, 10);
    g.fillStyle(TOOL);
    g.fillRect(cx + 9, 14, 2, 16);

    g.fillStyle(SKIN);
    g.fillCircle(cx, 11, 7);
    // straw hat — wide brim
    g.fillStyle(HAT);
    g.fillRect(cx - 12, 5, 24, 3);
    g.fillStyle(HATSTRAW);
    g.fillRect(cx - 9, 2, 18, 5);

    g.fillStyle(0x111111);
    g.fillRect(cx - 3, 11, 2, 2);
    g.fillRect(cx + 1, 11, 2, 2);
  }

  g.generateTexture('npc_farmhand', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_farmhand');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

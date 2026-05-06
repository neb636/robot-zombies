import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Generic survivor NPC — ragged civilian. 32×48, 4 frames (idle, walk-A, walk-B, talk).
 * Accent: torn olive jacket, bandana on arm.
 */
export const generateSurvivorSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN    = 0xd09060;
  const JACKET  = 0x4a5a2a;
  const PANTS   = 0x4a3820;
  const BANDANA = 0x9a2010;
  const SHOE    = 0x2a1808;
  const HAIR    = 0x1a1008;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;

    g.fillStyle(SHOE);
    g.fillRect(cx - 8, 43, 7, 5);
    g.fillRect(cx + 1, 43, 7, 5);

    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 29 + legLift, 5, 14 - legLift);
    g.fillRect(cx + 2, 29 + (2 - legLift), 5, 14 - (2 - legLift));

    g.fillStyle(JACKET);
    g.fillRect(cx - 9, 17, 18, 14);
    // torn edge detail
    g.fillStyle(0x3a4a1a);
    g.fillRect(cx - 9, 29, 18, 2);

    g.fillStyle(SKIN);
    g.fillRect(cx - 13, 18, 4, 9);
    // bandana on left arm
    g.fillStyle(BANDANA);
    g.fillRect(cx - 13, 22, 4, 3);
    g.fillStyle(SKIN);
    g.fillRect(cx + 9, 18, 4, 9);

    g.fillStyle(SKIN);
    g.fillCircle(cx, 11, 7);
    g.fillStyle(HAIR);
    g.fillRect(cx - 7, 4, 14, 6);

    g.fillStyle(0x111111);
    g.fillRect(cx - 3, 11, 2, 2);
    g.fillRect(cx + 1, 11, 2, 2);
  }

  g.generateTexture('npc_survivor', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_survivor');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

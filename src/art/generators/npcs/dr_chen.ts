import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Dr. Chen — engineer, 61, guilt-ridden. 32×48, 4 frames (idle, walk-A, walk-B, rewire).
 * Accent: lab coat, datapad in hand, stooped posture.
 */
export const generateDrChenSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN  = 0xd4a880;
  const COAT  = 0xeeeeff;
  const SHIRT = 0x445566;
  const PANTS = 0x2a2a3a;
  const HAIR  = 0x888878;
  const PAD   = 0x224488;
  const SHOE  = 0x111111;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    const stoop = 1; // always slightly stooped

    // shoes
    g.fillStyle(SHOE);
    g.fillRect(cx - 8, 43, 7, 5);
    g.fillRect(cx + 1, 43, 7, 5);

    // pants
    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 31 + legLift, 5, 12 - legLift);
    g.fillRect(cx + 2, 31 + (2 - legLift), 5, 12 - (2 - legLift));

    // lab coat
    g.fillStyle(COAT);
    g.fillRect(cx - 10, 19 + stoop, 20, 13);
    // shirt showing under coat
    g.fillStyle(SHIRT);
    g.fillRect(cx - 5, 19 + stoop, 10, 4);

    // arms — datapad in left hand on frames 0+3
    g.fillStyle(COAT);
    g.fillRect(cx - 14, 20 + stoop, 5, 10);
    g.fillRect(cx + 9, 20 + stoop, 5, 10);
    g.fillStyle(SKIN);
    g.fillRect(cx - 14, 30 + stoop, 5, 4);
    g.fillRect(cx + 9, 30 + stoop, 5, 4);
    if (f === 0 || f === 3) {
      g.fillStyle(PAD);
      g.fillRect(cx - 14, 23 + stoop, 4, 5);
    }

    // head — grey hair, older
    g.fillStyle(SKIN);
    g.fillCircle(cx, 12 + stoop, 7);
    g.fillStyle(HAIR);
    g.fillRect(cx - 7, 5 + stoop, 14, 5);
    g.fillRect(cx - 7, 8 + stoop, 3, 5);

    // eyes — downcast, weight of guilt
    g.fillStyle(0x111111);
    g.fillRect(cx - 4, 13 + stoop, 2, 2);
    g.fillRect(cx + 2, 13 + stoop, 2, 2);
  }

  g.generateTexture('npc_dr_chen', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_dr_chen');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

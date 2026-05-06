import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Marcus — warm everyman electrician. 32×48, 4 frames (idle, walk-A, walk-B, converted).
 * Accent: yellow work-shirt, screwdriver in hand (frames 0–2). Glowing eyes (frame 3).
 */
export const generateMarcusSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN    = 0xc8824a;
  const SHIRT   = 0xc8a020;
  const PANTS   = 0x3a3a4a;
  const SHOES   = 0x1a1208;
  const HAIR    = 0x1a1008;
  const TOOL    = 0x8a8a8a;
  const GLOW    = 0x44ffcc;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;

    // shoes
    g.fillStyle(SHOES);
    g.fillRect(cx - 8, 44, 7, 4);
    g.fillRect(cx + 1, 44, 7, 4);

    // pants
    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 30 + legLift, 5, 14 - legLift);
    g.fillRect(cx + 2, 30 + (2 - legLift), 5, 14 - (2 - legLift));

    // shirt
    g.fillStyle(f === 3 ? 0x5a5a5a : SHIRT);
    g.fillRect(cx - 9, 18, 18, 13);

    // arms — screwdriver in right hand on frames 0-2
    g.fillStyle(SKIN);
    g.fillRect(cx - 13, 19, 4, 10);
    g.fillRect(cx + 9, 19, 4, 10);
    if (f < 3) {
      g.fillStyle(TOOL);
      g.fillRect(cx + 10, 28, 2, 6);
    }

    // head
    g.fillStyle(SKIN);
    g.fillCircle(cx, 12, 8);
    g.fillStyle(HAIR);
    g.fillRect(cx - 8, 4, 16, 7);

    // eyes — glow on frame 3 (converted)
    g.fillStyle(f === 3 ? GLOW : 0x111111);
    g.fillRect(cx - 4, 12, 2, 2);
    g.fillRect(cx + 2, 12, 2, 2);
  }

  g.generateTexture('npc_marcus', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_marcus');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

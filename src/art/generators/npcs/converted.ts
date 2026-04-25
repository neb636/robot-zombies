import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Converted human NPC — eerie synchronized civilian. 32×48, 4 frames (idle-A, idle-B, walk-A, walk-B).
 * Accent: muted grey clothes, teal neural-interface glow at temple, perfectly upright posture.
 */
export const generateConvertedSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN  = 0xc0a888;
  const GREY  = 0x5a5a5a;
  const DARK  = 0x3a3a3a;
  const GLOW  = 0x44ffcc;
  const SHOE  = 0x222222;
  const HAIR  = 0x4a4a4a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    // minimal animation — converted humans move stiffly
    const legLift = f === 2 ? 1 : f === 3 ? 0 : 0;

    g.fillStyle(SHOE);
    g.fillRect(cx - 7, 43, 6, 5);
    g.fillRect(cx + 1, 43, 6, 5);

    g.fillStyle(DARK);
    g.fillRect(cx - 6, 30 + legLift, 5, 13 - legLift);
    g.fillRect(cx + 1, 30 + legLift, 5, 13 - legLift);

    g.fillStyle(GREY);
    g.fillRect(cx - 9, 18, 18, 14);

    // perfectly still arms
    g.fillStyle(GREY);
    g.fillRect(cx - 13, 18, 4, 11);
    g.fillRect(cx + 9, 18, 4, 11);
    g.fillStyle(SKIN);
    g.fillRect(cx - 13, 29, 4, 4);
    g.fillRect(cx + 9, 29, 4, 4);

    g.fillStyle(SKIN);
    g.fillCircle(cx, 11, 7);
    g.fillStyle(HAIR);
    g.fillRect(cx - 7, 4, 14, 6);

    // neural interface glow at temple
    g.fillStyle(GLOW);
    g.fillRect(cx + 5, 9, 3, 3);

    // eyes — flat, forward-facing
    g.fillStyle(GLOW);
    g.fillRect(cx - 3, 11, 2, 2);
    g.fillRect(cx + 1, 11, 2, 2);
  }

  g.generateTexture('npc_converted', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_converted');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Maya — MIT robotics PhD. 32×48, 4 frames (idle, walk-A, walk-B, attack/EMP).
 * Accent: dark tech-vest, EMP device on belt (orange pip), intense posture.
 */
export const generateMayaSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN  = 0xd4a060;
  const VEST  = 0x1a1a2a;
  const SHIRT = 0x334455;
  const PANTS = 0x2a2a3a;
  const HAIR  = 0x0a0808;
  const EMP   = 0xff6600;
  const BOOT  = 0x1a1010;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    const armRaise = f === 3 ? -6 : 0;

    // boots
    g.fillStyle(BOOT);
    g.fillRect(cx - 8, 42, 7, 6);
    g.fillRect(cx + 1, 42, 7, 6);

    // pants
    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 30 + legLift, 5, 12 - legLift);
    g.fillRect(cx + 2, 30 + (2 - legLift), 5, 12 - (2 - legLift));

    // shirt + vest
    g.fillStyle(SHIRT);
    g.fillRect(cx - 9, 18, 18, 13);
    g.fillStyle(VEST);
    g.fillRect(cx - 9, 18, 5, 13);
    g.fillRect(cx + 4, 18, 5, 13);

    // EMP pip on belt
    g.fillStyle(EMP);
    g.fillRect(cx - 2, 30, 4, 3);

    // arms
    g.fillStyle(SKIN);
    g.fillRect(cx - 13, 19 + armRaise, 4, 10);
    g.fillRect(cx + 9, 19 + armRaise, 4, 10);

    // head — short hair pulled back
    g.fillStyle(SKIN);
    g.fillCircle(cx, 11, 8);
    g.fillStyle(HAIR);
    g.fillRect(cx - 8, 3, 16, 6);
    g.fillRect(cx + 4, 6, 5, 8);

    // eyes — narrow, determined
    g.fillStyle(0x111111);
    g.fillRect(cx - 4, 11, 2, 2);
    g.fillRect(cx + 2, 11, 2, 2);
  }

  g.generateTexture('npc_maya', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_maya');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

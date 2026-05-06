import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Elias — Appalachian hunter/tank, 60s. 32×48, 4 frames (idle, walk-A, walk-B, rifle-raised).
 * Accent: wide-brim hat, flannel, rifle silhouette in frames 0 and 3.
 */
export const generateEliasSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN    = 0xc8906a;
  const FLANNEL = 0x6a2a1a;
  const PANTS   = 0x4a3a20;
  const BOOT    = 0x2a1808;
  const HAT     = 0x3a2808;
  const RIFLE   = 0x5a4020;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    const rifleY  = f === 3 ? 12 : 20;

    // boots (tall)
    g.fillStyle(BOOT);
    g.fillRect(cx - 8, 40, 7, 8);
    g.fillRect(cx + 1, 40, 7, 8);

    // pants
    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 28 + legLift, 6, 13 - legLift);
    g.fillRect(cx + 1, 28 + (2 - legLift), 6, 13 - (2 - legLift));

    // flannel — wide torso
    g.fillStyle(FLANNEL);
    g.fillRect(cx - 10, 17, 20, 13);
    g.fillStyle(0x8a4a2a);
    g.fillRect(cx - 2, 17, 4, 13);

    // arms + rifle
    g.fillStyle(SKIN);
    g.fillRect(cx - 14, 18, 4, 9);
    g.fillRect(cx + 10, 18, 4, 9);
    if (f === 0 || f === 3) {
      g.fillStyle(RIFLE);
      g.fillRect(cx + 10, rifleY, 3, 18);
    }

    // head — large, weathered
    g.fillStyle(SKIN);
    g.fillCircle(cx, 11, 8);
    // wide-brim hat
    g.fillStyle(HAT);
    g.fillRect(cx - 11, 4, 22, 4);
    g.fillRect(cx - 8, 0, 16, 6);

    // eyes — steady
    g.fillStyle(0x111111);
    g.fillRect(cx - 4, 11, 2, 2);
    g.fillRect(cx + 2, 11, 2, 2);
  }

  g.generateTexture('npc_elias', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_elias');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

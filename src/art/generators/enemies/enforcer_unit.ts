import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Enforcer Unit — T1 bipedal grunt. 32×48, 4 frames (idle-A, idle-B, attack, hit).
 * Accent: gunmetal body, blue visor, baton silhouette on frame 2.
 */
export const generateEnforcerUnitSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const METAL  = 0x3a3a4a;
  const DARK   = 0x1a1a22;
  const VISOR  = 0x2266cc;
  const BATON  = 0x8a8a6a;
  const LIGHT  = 0x6a6a8a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 1 : 0;
    const batonRaise = f === 2 ? -6 : 0;
    const hitShift = f === 3 ? 2 : 0;

    g.fillStyle(DARK);
    g.fillRect(cx - 7 + hitShift, 38, 6, 8);
    g.fillRect(cx + 1 + hitShift, 38, 6, 8);

    g.fillStyle(METAL);
    g.fillRect(cx - 8 + hitShift, 26 + legLift, 6, 12 - legLift);
    g.fillRect(cx + 2 + hitShift, 26 + (2 - legLift), 6, 12 - (2 - legLift));

    g.fillStyle(METAL);
    g.fillRect(cx - 10 + hitShift, 14, 20, 14);

    // arms
    g.fillStyle(DARK);
    g.fillRect(cx - 14 + hitShift, 15 + batonRaise, 5, 12);
    g.fillRect(cx + 9 + hitShift, 15, 5, 12);

    // baton on attack frame
    if (f === 2) {
      g.fillStyle(BATON);
      g.fillRect(cx - 16 + hitShift, 10, 3, 14);
    }

    // head / sensor block
    g.fillStyle(METAL);
    g.fillRect(cx - 8 + hitShift, 4, 16, 12);
    g.fillStyle(VISOR);
    g.fillRect(cx - 7 + hitShift, 7, 14, 5);
    g.fillStyle(LIGHT);
    g.fillRect(cx - 8 + hitShift, 4, 16, 2);
  }

  g.generateTexture('enemy_enforcer_unit', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_enforcer_unit');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Compliance Warden Beta — named mini-boss variant, heavier than Alpha.
 * 64×80, 4 frames (idle-A, idle-B, heavy-strike, hit-stagger).
 * Accent: dark red hull, twin shoulder cannons, damaged panel on hit frame.
 */
export const generateComplianceWardenBetaSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 64, FH = 80;
  const HULL   = 0x2a0a00;
  const ARMOR  = 0x4a1010;
  const CANNON = 0x3a3a3a;
  const RED    = 0xcc1100;
  const DARK   = 0x0a0000;
  const EXPOSE = 0xaa4400;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;

    // shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(cx, FH - 4, 44, 8);

    // feet / base
    g.fillStyle(DARK);
    g.fillRect(cx - 18, 72, 16, 8);
    g.fillRect(cx + 2, 72, 16, 8);

    // legs
    g.fillStyle(ARMOR);
    g.fillRect(cx - 14, 48, 11, 24);
    g.fillRect(cx + 3, 48, 11, 24);
    g.fillStyle(HULL);
    g.fillRect(cx - 14, 48, 11, 3);
    g.fillRect(cx + 3, 48, 11, 3);

    // torso — wide
    const strikeShift = f === 2 ? 3 : 0;
    g.fillStyle(ARMOR);
    g.fillRect(cx - 18 + strikeShift, 22, 36, 28);
    // red eye/vent strip
    g.fillStyle(f === 3 ? EXPOSE : RED);
    g.fillRect(cx - 6 + strikeShift, 28, 4, 16);
    g.fillRect(cx + 2 + strikeShift, 28, 4, 16);
    g.fillStyle(HULL);
    g.fillRect(cx - 18 + strikeShift, 22, 36, 3);

    // shoulder cannons
    const armDY = f === 1 ? 1 : 0;
    const cannonExtend = f === 2 ? 6 : 0;
    g.fillStyle(CANNON);
    g.fillRect(cx - 26, 18 + armDY, 10, 20);
    g.fillRect(cx + 16 + cannonExtend, 18 + armDY, 10, 20);
    // cannon barrels
    g.fillStyle(DARK);
    g.fillRect(cx - 30, 22 + armDY, 6, 6);
    g.fillRect(cx + 24 + cannonExtend, 22 + armDY, 6, 6);
    // muzzle glow on attack
    if (f === 2) {
      g.fillStyle(RED);
      g.fillRect(cx + 28, 23, 4, 4);
    }

    // shoulders
    g.fillStyle(HULL);
    g.fillRect(cx - 24, 14, 12, 8);
    g.fillRect(cx + 12, 14, 12, 8);

    // head
    const headX = f === 3 ? 2 : 0;
    g.fillStyle(ARMOR);
    g.fillRect(cx - 11 + headX, 4, 22, 18);
    g.fillStyle(HULL);
    g.fillRect(cx - 11 + headX, 4, 22, 2);
    // eyes
    const eyeColor = f === 2 ? 0xff2200 : (f === 3 ? 0x441100 : RED);
    g.fillStyle(eyeColor);
    g.fillRect(cx - 9 + headX, 9, 5, 5);
    g.fillRect(cx + 4 + headX, 9, 5, 5);
  }

  g.generateTexture('enemy_compliance_warden_beta', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_compliance_warden_beta');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

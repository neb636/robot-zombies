import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Enforcer Heavy — T2 armored bruiser. 40×56, 4 frames (idle-A, idle-B, attack, hit).
 * Accent: thick shoulder plates, orange thermal vents on torso.
 */
export const generateEnforcerHeavySprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 40, FH = 56;
  const ARMOR  = 0x2a2a3a;
  const PLATE  = 0x4a4a5a;
  const VENT   = 0xcc4400;
  const VISOR  = 0x003388;
  const DARK   = 0x111118;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 1 : 0;
    const chargeShift = f === 2 ? 3 : 0;
    const hitShift = f === 3 ? 2 : 0;

    // feet
    g.fillStyle(DARK);
    g.fillRect(cx - 10 + hitShift, 48, 9, 8);
    g.fillRect(cx + 1 + hitShift, 48, 9, 8);

    // legs — wide
    g.fillStyle(ARMOR);
    g.fillRect(cx - 10 + hitShift, 34 + legLift, 8, 14 - legLift);
    g.fillRect(cx + 2 + hitShift, 34 + (2 - legLift), 8, 14 - (2 - legLift));
    // knee plates
    g.fillStyle(PLATE);
    g.fillRect(cx - 11 + hitShift, 38, 10, 4);
    g.fillRect(cx + 1 + hitShift, 38, 10, 4);

    // torso — wide
    g.fillStyle(ARMOR);
    g.fillRect(cx - 14 + chargeShift + hitShift, 18, 28, 17);
    // thermal vents
    g.fillStyle(VENT);
    g.fillRect(cx - 8 + chargeShift + hitShift, 22, 3, 8);
    g.fillRect(cx - 2 + chargeShift + hitShift, 22, 3, 8);
    g.fillRect(cx + 4 + chargeShift + hitShift, 22, 3, 8);

    // shoulder pauldrons
    g.fillStyle(PLATE);
    g.fillRect(cx - 20 + hitShift, 14, 10, 8);
    g.fillRect(cx + 10 + hitShift, 14, 10, 8);

    // arms — thick
    g.fillStyle(ARMOR);
    g.fillRect(cx - 20 + hitShift, 20, 8, 14);
    g.fillRect(cx + 12 + hitShift, 20, 8, 14);

    // head
    g.fillStyle(PLATE);
    g.fillRect(cx - 9 + hitShift, 4, 18, 12);
    g.fillStyle(VISOR);
    g.fillRect(cx - 8 + hitShift, 7, 16, 5);
    g.fillStyle(ARMOR);
    g.fillRect(cx - 9 + hitShift, 4, 18, 2);
  }

  g.generateTexture('enemy_enforcer_heavy', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_enforcer_heavy');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

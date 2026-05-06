import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Compliance Drone — T1 enemy. 32×32, 4 frames (idle-A, idle-B, attack, hit).
 * Accent: floating disc shape, red compliance light, white SI logo stripe.
 */
export const generateComplianceDroneSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 32;
  const STEEL = 0x3a3a4a;
  const SILVER = 0x7a7a8a;
  const RED   = 0xdd1100;
  const WHITE = 0xeeeeff;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const hover = f === 1 ? 1 : 0;
    const attackShift = f === 2 ? 2 : 0;

    // shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(cx, 29 - hover, 20, 4);

    // disc body
    g.fillStyle(STEEL);
    g.fillEllipse(cx, 14 - hover, 24, 10);
    g.fillStyle(SILVER);
    g.fillEllipse(cx, 13 - hover, 20, 6);

    // compliance light — pulsing (red normally, bright on attack)
    g.fillStyle(f === 2 ? 0xff4422 : RED);
    g.fillRect(cx - 3, 10 - hover + attackShift, 6, 3);

    // SI logo stripe
    g.fillStyle(WHITE);
    g.fillRect(cx - 8, 15 - hover, 16, 2);

    // undercarriage sensor
    g.fillStyle(STEEL);
    g.fillRect(cx - 4, 17 - hover, 8, 5);
    g.fillStyle(RED);
    g.fillRect(cx - 2, 19 - hover, 4, 2);
  }

  g.generateTexture('enemy_compliance_drone', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_compliance_drone');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

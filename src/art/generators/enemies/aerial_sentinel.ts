import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Aerial Sentinel — T3 high-altitude guardian. 56×48, 4 frames (idle-A, idle-B, dive, hit).
 * Accent: sleek white hull, blue thruster glow, swept delta-wing silhouette.
 */
export const generateAerialSentinelSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 56, FH = 48;
  const WHITE  = 0xdde8f0;
  const BLUE   = 0x0055cc;
  const STEEL  = 0x6a7a8a;
  const DARK   = 0x0a1018;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const diveShift = f === 2 ? 4 : 0;

    // delta wings — broad
    g.fillStyle(WHITE);
    g.fillRect(ox, 22 + diveShift, 18, 8);
    g.fillRect(ox + 38, 22 + diveShift, 18, 8);
    // wing underside
    g.fillStyle(STEEL);
    g.fillRect(ox + 2, 28 + diveShift, 14, 4);
    g.fillRect(ox + 40, 28 + diveShift, 14, 4);

    // fuselage
    g.fillStyle(WHITE);
    g.fillRect(cx - 12, 16 + diveShift, 24, 18);
    g.fillStyle(DARK);
    g.fillRect(cx - 10, 18 + diveShift, 20, 14);

    // blue thruster glow (rear)
    const thrustColor = f === 3 ? 0x002266 : BLUE;
    g.fillStyle(thrustColor);
    g.fillRect(cx - 8, 32 + diveShift, 16, 6);

    // nose cone
    g.fillStyle(STEEL);
    g.fillRect(cx - 5, 10 + diveShift, 10, 8);
    // sensor dot
    g.fillStyle(BLUE);
    g.fillRect(cx - 2, 12 + diveShift, 4, 4);
  }

  g.generateTexture('enemy_aerial_sentinel', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_aerial_sentinel');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

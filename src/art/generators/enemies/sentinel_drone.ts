import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Sentinel Drone — T2 hovering scanner. 40×32, 4 frames (idle-A, idle-B, scan, hit).
 * Accent: diamond body, four rotors, green scan beam.
 */
export const generateSentinelDroneSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 40, FH = 32;
  const STEEL = 0x3a3a4a;
  const DARK  = 0x1a1a22;
  const GREEN = 0x00cc44;
  const ROTOR = 0x5a5a6a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const hover = f === 1 ? 1 : 0;

    // rotors (4)
    g.fillStyle(ROTOR);
    g.fillRect(cx - 18, 8 - hover, 8, 3);
    g.fillRect(cx + 10, 8 - hover, 8, 3);
    g.fillRect(cx - 18, 16 - hover, 8, 3);
    g.fillRect(cx + 10, 16 - hover, 8, 3);

    // diamond body
    g.fillStyle(STEEL);
    g.fillRect(cx - 8, 8 - hover, 16, 12);
    g.fillStyle(DARK);
    g.fillRect(cx - 5, 10 - hover, 10, 8);

    // green scan beam (frame 2) or eye (others)
    if (f === 2) {
      g.fillStyle(GREEN);
      g.fillRect(cx - 3, 18 - hover, 6, 10);
    } else {
      g.fillStyle(f === 3 ? 0x224422 : GREEN);
      g.fillRect(cx - 3, 12 - hover, 6, 4);
    }
  }

  g.generateTexture('enemy_sentinel_drone', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_sentinel_drone');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

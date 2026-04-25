import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Sentinel Aerial — T2 large patrol flyer, Great Plains sky threat. 48×40, 4 frames.
 * Accent: wide wingspan silhouette, blue scanner light, swept-back design.
 */
export const generateSentinelAerialSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 48, FH = 40;
  const STEEL = 0x3a3a4a;
  const DARK  = 0x111118;
  const BLUE  = 0x0044cc;
  const LIGHT = 0x6a6a8a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const hover = f === 1 ? 1 : 0;
    const bankAngle = f === 2 ? 2 : 0;

    // swept wings
    g.fillStyle(STEEL);
    g.fillRect(ox, 16 - hover + bankAngle, 14, 6);
    g.fillRect(ox + 34, 16 - hover - bankAngle, 14, 6);
    // wing tips
    g.fillStyle(DARK);
    g.fillRect(ox, 14 - hover + bankAngle, 6, 3);
    g.fillRect(ox + 42, 14 - hover - bankAngle, 6, 3);

    // fuselage
    g.fillStyle(STEEL);
    g.fillRect(cx - 10, 12 - hover, 20, 14);
    g.fillStyle(DARK);
    g.fillRect(cx - 8, 14 - hover, 16, 10);

    // blue scanner
    const scanColor = f === 3 ? 0x002266 : BLUE;
    g.fillStyle(scanColor);
    g.fillRect(cx - 5, 19 - hover, 10, 4);

    // nose / sensor pod
    g.fillStyle(LIGHT);
    g.fillRect(cx - 4, 9 - hover, 8, 5);
  }

  g.generateTexture('enemy_sentinel_aerial', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_sentinel_aerial');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

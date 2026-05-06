import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Mining Crawler — T2 four-legged ore extractor. 48×40, 4 frames (idle-A, idle-B, claw, hit).
 * Accent: rust-brown hull, yellow hazard stripes, claw arm.
 */
export const generateMiningCrawlerSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 48, FH = 40;
  const HULL   = 0x4a2a10;
  const METAL  = 0x7a5a30;
  const YELLOW = 0xcc9900;
  const DARK   = 0x1a0a00;
  const CLAW   = 0x8a8a6a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legAnim = f === 1 ? 1 : 0;
    const clawExtend = f === 2 ? 6 : 0;

    // four legs
    g.fillStyle(DARK);
    g.fillRect(cx - 20, 26 + legAnim, 6, 10);
    g.fillRect(cx - 8, 26 - legAnim, 6, 10);
    g.fillRect(cx + 2, 26 + legAnim, 6, 10);
    g.fillRect(cx + 14, 26 - legAnim, 6, 10);

    // body hull
    g.fillStyle(HULL);
    g.fillRect(cx - 18, 14, 36, 14);
    // hazard stripes
    g.fillStyle(YELLOW);
    g.fillRect(cx - 18, 14, 4, 14);
    g.fillRect(cx + 14, 14, 4, 14);

    // dark recess
    g.fillStyle(DARK);
    g.fillRect(cx - 10, 17, 20, 8);

    // claw arm (right)
    g.fillStyle(METAL);
    g.fillRect(cx + 18, 12, 6 + clawExtend, 8);
    g.fillStyle(CLAW);
    g.fillRect(cx + 24 + clawExtend, 10, 6, 5);
    g.fillRect(cx + 24 + clawExtend, 15, 6, 5);

    // head / sensor
    g.fillStyle(METAL);
    g.fillRect(cx - 8, 4, 16, 12);
    g.fillStyle(YELLOW);
    g.fillRect(cx - 5, 7, 4, 4);
    g.fillRect(cx + 1, 7, 4, 4);
  }

  g.generateTexture('enemy_mining_crawler', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_mining_crawler');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

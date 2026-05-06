import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Storm Walker — T3 all-terrain Great Plains unit. 48×56, 4 frames (idle-A, idle-B, stomp, hit).
 * Accent: tall spider-legged frame, lightning-rod antennae, weathered grey hull.
 */
export const generateStormWalkerSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 48, FH = 56;
  const HULL  = 0x5a5a60;
  const DARK  = 0x1a1a22;
  const BOLT  = 0xddcc00;
  const METAL = 0x3a3a44;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const stompLeg = f === 2 ? 4 : 0;
    const hitShift = f === 3 ? 3 : 0;

    // four spidery legs
    g.fillStyle(METAL);
    g.fillRect(cx - 20 + hitShift, 36 + stompLeg, 4, 16 - stompLeg);
    g.fillRect(cx - 8 + hitShift, 36, 4, 16);
    g.fillRect(cx + 4 + hitShift, 36, 4, 16);
    g.fillRect(cx + 16 + hitShift, 36 + stompLeg, 4, 16 - stompLeg);
    // feet
    g.fillStyle(DARK);
    g.fillRect(cx - 22 + hitShift, 50, 7, 4);
    g.fillRect(cx - 10 + hitShift, 50, 7, 4);
    g.fillRect(cx + 3 + hitShift, 50, 7, 4);
    g.fillRect(cx + 15 + hitShift, 50, 7, 4);

    // body — central pod
    g.fillStyle(HULL);
    g.fillRect(cx - 14 + hitShift, 20, 28, 18);
    g.fillStyle(DARK);
    g.fillRect(cx - 10 + hitShift, 24, 20, 10);

    // lightning-rod antennae
    g.fillStyle(METAL);
    g.fillRect(cx - 8 + hitShift, 4, 3, 18);
    g.fillRect(cx + 5 + hitShift, 4, 3, 18);
    // bolt tips
    g.fillStyle(BOLT);
    g.fillRect(cx - 9 + hitShift, 2, 5, 3);
    g.fillRect(cx + 4 + hitShift, 2, 5, 3);

    // sensor strip
    g.fillStyle(BOLT);
    g.fillRect(cx - 10 + hitShift, 27, 20, 3);
  }

  g.generateTexture('enemy_storm_walker', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_storm_walker');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

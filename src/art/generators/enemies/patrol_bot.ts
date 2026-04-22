import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Patrol Bot — T1 small rolling sentry. 32×32, 4 frames (idle-A, idle-B, roll, hit).
 * Accent: spherical base, single red eye, wheel tracks.
 */
export const generatePatrolBotSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 32;
  const STEEL  = 0x4a4a5a;
  const DARK   = 0x1a1a22;
  const EYE    = 0xcc2200;
  const TRACK  = 0x2a2a2a;
  const SILVER = 0x8a8a9a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const rollOffset = f === 2 ? 1 : 0;

    // wheels / tracks
    g.fillStyle(TRACK);
    g.fillRect(cx - 12, 22 + rollOffset, 9, 6);
    g.fillRect(cx + 3,  22 + rollOffset, 9, 6);
    g.fillStyle(0x4a4a4a);
    g.fillRect(cx - 12, 22 + rollOffset, 9, 2);
    g.fillRect(cx + 3,  22 + rollOffset, 9, 2);

    // body sphere
    g.fillStyle(STEEL);
    g.fillCircle(cx, 16, 11);
    g.fillStyle(DARK);
    g.fillCircle(cx, 16, 9);

    // top cap
    g.fillStyle(SILVER);
    g.fillRect(cx - 6, 6, 12, 5);
    g.fillStyle(STEEL);
    g.fillRect(cx - 6, 6, 12, 2);

    // single eye
    const eyeColor = f === 3 ? 0x441100 : EYE;
    g.fillStyle(eyeColor);
    g.fillCircle(cx, 15, 4);
    g.fillStyle(f === 3 ? 0x220800 : 0xff4422);
    g.fillCircle(cx, 15, 2);
  }

  g.generateTexture('enemy_patrol_bot', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_patrol_bot');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

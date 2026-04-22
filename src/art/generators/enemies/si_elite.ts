import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * SI Elite — T3 Silicon Valley campus guard. 40×56, 4 frames (idle-A, idle-B, attack, hit).
 * Accent: pristine white armor, cold blue visor, sleek minimalist design — utopia horror.
 */
export const generateSIEliteSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 40, FH = 56;
  const WHITE  = 0xeeeeff;
  const BLUE   = 0x0055cc;
  const SILVER = 0xaabbc8;
  const DARK   = 0x0a0a18;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 1 : 0;
    const attackReach = f === 2 ? 4 : 0;
    const hitShift = f === 3 ? 2 : 0;

    // feet
    g.fillStyle(WHITE);
    g.fillRect(cx - 9 + hitShift, 48, 8, 8);
    g.fillRect(cx + 1 + hitShift, 48, 8, 8);

    // legs
    g.fillStyle(WHITE);
    g.fillRect(cx - 9 + hitShift, 34 + legLift, 7, 14 - legLift);
    g.fillRect(cx + 2 + hitShift, 34 + (2 - legLift), 7, 14 - (2 - legLift));
    // knee accent line
    g.fillStyle(BLUE);
    g.fillRect(cx - 9 + hitShift, 42, 7, 1);
    g.fillRect(cx + 2 + hitShift, 42, 7, 1);

    // torso
    g.fillStyle(WHITE);
    g.fillRect(cx - 12 + hitShift, 18, 24, 18);
    // SI logo accent
    g.fillStyle(BLUE);
    g.fillRect(cx - 5 + hitShift, 22, 10, 10);
    g.fillStyle(WHITE);
    g.fillRect(cx - 3 + hitShift, 24, 6, 6);

    // shoulder plates
    g.fillStyle(SILVER);
    g.fillRect(cx - 18 + hitShift, 16, 8, 6);
    g.fillRect(cx + 10 + hitShift, 16, 8, 6);

    // arms
    g.fillStyle(WHITE);
    g.fillRect(cx - 18 + hitShift, 20, 7, 14 + attackReach);
    g.fillRect(cx + 11 + hitShift, 20, 7, 14);

    // head — smooth dome
    g.fillStyle(WHITE);
    g.fillRect(cx - 9 + hitShift, 4, 18, 14);
    // full-face visor
    g.fillStyle(BLUE);
    g.fillRect(cx - 8 + hitShift, 6, 16, 9);
    g.fillStyle(DARK);
    g.fillRect(cx - 6 + hitShift, 8, 12, 5);
  }

  g.generateTexture('enemy_si_elite', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_si_elite');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

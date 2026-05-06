import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Converted Fighter — Special enemy type: human, formerly free.
 * 32×48, 4 frames (idle, advance, strike, cured/collapse).
 * Accent: civilian clothes, teal neural glow at temple, upright controlled posture.
 * Distinct from npc_converted: this is the combat version.
 */
export const generateConvertedFighterSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN   = 0xb88060;
  const GREY   = 0x5a5a6a;
  const PANTS  = 0x3a3a4a;
  const SHOE   = 0x1a1a1a;
  const GLOW   = 0x44ffcc;
  const CURED  = 0xffffff;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 1 : 0;
    // strike frame: slight lunge
    const strikeShift = f === 2 ? 2 : 0;
    // cured frame: slumped
    const slump = f === 3 ? 4 : 0;

    g.fillStyle(SHOE);
    g.fillRect(cx - 7 + strikeShift, 43 + slump, 6, 5);
    g.fillRect(cx + 1 + strikeShift, 43 + slump, 6, 5);

    g.fillStyle(PANTS);
    g.fillRect(cx - 6 + strikeShift, 29 + legLift + slump, 5, 14 - legLift);
    g.fillRect(cx + 1 + strikeShift, 29 + (2 - legLift) + slump, 5, 14 - (2 - legLift));

    g.fillStyle(f === 3 ? 0x808080 : GREY);
    g.fillRect(cx - 9 + strikeShift, 17 + slump, 18, 14);

    // arms — strike frame: right fist forward
    g.fillStyle(f === 3 ? 0x808080 : GREY);
    g.fillRect(cx - 13 + strikeShift, 18 + slump, 4, 10);
    const rightArmExt = f === 2 ? 5 : 0;
    g.fillRect(cx + 9 + strikeShift + rightArmExt, 18 + slump, 4, 10 - rightArmExt);
    g.fillStyle(SKIN);
    g.fillRect(cx + 9 + strikeShift + rightArmExt, 26 + slump - rightArmExt, 4, 4);
    g.fillRect(cx - 13 + strikeShift, 28 + slump, 4, 4);

    g.fillStyle(SKIN);
    g.fillCircle(cx + strikeShift, 11 + slump, 7);
    g.fillStyle(0x4a4a5a);
    g.fillRect(cx - 7 + strikeShift, 4 + slump, 14, 6);

    // neural glow — gone on cured frame (white flash instead)
    g.fillStyle(f === 3 ? CURED : GLOW);
    g.fillRect(cx + 4 + strikeShift, 8 + slump, 4, 4);

    // eyes — glowing teal normally, blank on cured
    g.fillStyle(f === 3 ? 0x888888 : GLOW);
    g.fillRect(cx - 3 + strikeShift, 11 + slump, 2, 2);
    g.fillRect(cx + 1 + strikeShift, 11 + slump, 2, 2);
  }

  g.generateTexture('enemy_converted_fighter', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_converted_fighter');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

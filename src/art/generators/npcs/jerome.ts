import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Jerome — former NFL lineman / preacher. 32×48, 4 frames (idle, walk-A, walk-B, inspire).
 * Accent: white collar band, enormous frame, gentle stance.
 */
export const generateJeromeSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN   = 0x4a2808;
  const SHIRT  = 0x1a1a22;
  const COLLAR = 0xeeeeee;
  const PANTS  = 0x222230;
  const SHOE   = 0x0a0a10;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    // inspire frame: arms raised
    const armRaise = f === 3 ? -8 : 0;

    // shoes — large
    g.fillStyle(SHOE);
    g.fillRect(cx - 10, 43, 9, 5);
    g.fillRect(cx + 1,  43, 9, 5);

    // pants — wide
    g.fillStyle(PANTS);
    g.fillRect(cx - 9, 28 + legLift, 7, 16 - legLift);
    g.fillRect(cx + 2, 28 + (2 - legLift), 7, 16 - (2 - legLift));

    // shirt — wide torso
    g.fillStyle(SHIRT);
    g.fillRect(cx - 12, 16, 24, 14);
    // white collar
    g.fillStyle(COLLAR);
    g.fillRect(cx - 3, 16, 6, 4);

    // massive arms
    g.fillStyle(SHIRT);
    g.fillRect(cx - 16, 17 + armRaise, 6, 12);
    g.fillRect(cx + 10, 17 + armRaise, 6, 12);
    g.fillStyle(SKIN);
    g.fillRect(cx - 16, 28 + armRaise, 6, 4);
    g.fillRect(cx + 10, 28 + armRaise, 6, 4);

    // head — large, broad
    g.fillStyle(SKIN);
    g.fillCircle(cx, 10, 9);

    // eyes — calm
    g.fillStyle(0x222222);
    g.fillRect(cx - 5, 10, 2, 2);
    g.fillRect(cx + 3, 10, 2, 2);
  }

  g.generateTexture('npc_jerome', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_jerome');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

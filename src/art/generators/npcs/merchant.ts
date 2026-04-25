import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Merchant NPC — traveling trader. 32×48, 4 frames (idle, walk-A, walk-B, offer).
 * Accent: brown trench coat, pack on back (green rect), offer frame: arm extended.
 */
export const generateMerchantSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN  = 0xc89060;
  const COAT  = 0x6a3a10;
  const PACK  = 0x2a4a1a;
  const PANTS = 0x3a2a10;
  const SHOE  = 0x1a0808;
  const HAIR  = 0x4a3010;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    const offerExt = f === 3 ? 5 : 0;

    g.fillStyle(SHOE);
    g.fillRect(cx - 8, 43, 7, 5);
    g.fillRect(cx + 1, 43, 7, 5);

    g.fillStyle(PANTS);
    g.fillRect(cx - 7, 29 + legLift, 5, 14 - legLift);
    g.fillRect(cx + 2, 29 + (2 - legLift), 5, 14 - (2 - legLift));

    // trench coat
    g.fillStyle(COAT);
    g.fillRect(cx - 10, 15, 20, 16);

    // pack on back (always visible)
    g.fillStyle(PACK);
    g.fillRect(cx - 8, 14, 6, 10);

    // arms
    g.fillStyle(COAT);
    g.fillRect(cx - 14, 16, 5, 11);
    g.fillRect(cx + 9, 16, 5 + offerExt, 11);
    g.fillStyle(SKIN);
    g.fillRect(cx - 14, 27, 5, 4);
    g.fillRect(cx + 9, 27, 5, 4);

    g.fillStyle(SKIN);
    g.fillCircle(cx, 10, 7);
    g.fillStyle(HAIR);
    g.fillRect(cx - 7, 3, 14, 5);

    g.fillStyle(0x111111);
    g.fillRect(cx - 3, 10, 2, 2);
    g.fillRect(cx + 1, 10, 2, 2);
  }

  g.generateTexture('npc_merchant', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_merchant');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Deja — New Orleans rogue/speedster, 19. 32×48, 4 frames (idle, walk-A, walk-B, dash).
 * Accent: bright teal hoodie, low stance, quick silhouette.
 */
export const generateDejaSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 32, FH = 48;
  const SKIN   = 0x7a4820;
  const HOODIE = 0x009090;
  const PANTS  = 0x1a1a1a;
  const SNEAK  = 0x2a1a1a;
  const HAIR   = 0x0a0808;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 3 : f === 2 ? 0 : 1;
    // dash frame: lean forward
    const bodyShift = f === 3 ? 3 : 0;

    // sneakers
    g.fillStyle(SNEAK);
    g.fillRect(cx - 8 + bodyShift, 43, 7, 5);
    g.fillRect(cx + 1 + bodyShift, 43, 7, 5);

    // pants — slim
    g.fillStyle(PANTS);
    g.fillRect(cx - 6 + bodyShift, 30 + legLift, 5, 13 - legLift);
    g.fillRect(cx + 1 + bodyShift, 30 + (3 - legLift), 5, 13 - (3 - legLift));

    // hoodie — slightly shorter torso
    g.fillStyle(HOODIE);
    g.fillRect(cx - 8 + bodyShift, 19, 16, 12);
    // hood detail
    g.fillStyle(0x007878);
    g.fillRect(cx - 4 + bodyShift, 19, 8, 4);

    // arms — loose sleeves
    g.fillStyle(HOODIE);
    g.fillRect(cx - 12 + bodyShift, 20, 4, 9);
    g.fillRect(cx + 8 + bodyShift, 20, 4, 9);
    g.fillStyle(SKIN);
    g.fillRect(cx - 12 + bodyShift, 29, 4, 4);
    g.fillRect(cx + 8 + bodyShift, 29, 4, 4);

    // head — small, quick
    g.fillStyle(SKIN);
    g.fillCircle(cx + bodyShift, 12, 7);
    g.fillStyle(HAIR);
    g.fillRect(cx - 7 + bodyShift, 5, 14, 6);

    // eyes — alert
    g.fillStyle(0x111111);
    g.fillRect(cx - 4 + bodyShift, 12, 2, 2);
    g.fillRect(cx + 2 + bodyShift, 12, 2, 2);
  }

  g.generateTexture('npc_deja', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_deja');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

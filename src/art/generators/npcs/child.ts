import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Child NPC — small survivor kid. 24×36, 4 frames (idle, walk-A, walk-B, hide).
 * Accent: oversized red shirt, smaller frame, scruffy hair.
 */
export const generateChildSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 24, FH = 36;
  const SKIN  = 0xd49060;
  const SHIRT = 0x882020;
  const PANTS = 0x2a3a4a;
  const SHOE  = 0x1a1008;
  const HAIR  = 0x1a0808;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const legLift = f === 1 ? 2 : f === 2 ? 0 : 1;
    // hide frame: crouched — shift body down 2px
    const crouch = f === 3 ? 3 : 0;

    g.fillStyle(SHOE);
    g.fillRect(cx - 6, 32 + crouch, 5, 4);
    g.fillRect(cx + 1, 32 + crouch, 5, 4);

    g.fillStyle(PANTS);
    g.fillRect(cx - 5, 22 + legLift + crouch, 4, 10 - legLift);
    g.fillRect(cx + 1, 22 + (2 - legLift) + crouch, 4, 10 - (2 - legLift));

    // oversized shirt
    g.fillStyle(SHIRT);
    g.fillRect(cx - 7, 13 + crouch, 14, 11);

    g.fillStyle(SKIN);
    g.fillRect(cx - 10, 14 + crouch, 3, 7);
    g.fillRect(cx + 7, 14 + crouch, 3, 7);

    g.fillStyle(SKIN);
    g.fillCircle(cx, 8 + crouch, 6);
    g.fillStyle(HAIR);
    g.fillRect(cx - 6, 2 + crouch, 12, 5);

    g.fillStyle(0x111111);
    g.fillRect(cx - 3, 8 + crouch, 2, 2);
    g.fillRect(cx + 1, 8 + crouch, 2, 2);
  }

  g.generateTexture('npc_child', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('npc_child');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

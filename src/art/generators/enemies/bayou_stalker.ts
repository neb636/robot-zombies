import type Phaser from 'phaser';
import type { SpriteGenerator } from '../types.js';

/**
 * Bayou Stalker — T3 amphibious ambush bot. 40×48, 4 frames (idle, lurk, lunge, hit).
 * Accent: matte black, green sensor cluster, low crouched silhouette.
 */
export const generateBayouStalkerSprite: SpriteGenerator = (scene: Phaser.Scene) => {
  const FW = 40, FH = 48;
  const BLACK  = 0x0a0a10;
  const DARK   = 0x1a1a22;
  const GREEN  = 0x00aa44;
  const METAL  = 0x2a2a3a;

  const g = scene.make.graphics({}, false);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + FW / 2;
    const lurk = f === 1 ? 4 : 0;      // body raised higher in lurk frame
    const lunge = f === 2 ? -4 : 0;    // body lunges forward/up

    const bodyY = 22 - lurk + lunge;

    // claw feet
    g.fillStyle(DARK);
    g.fillRect(cx - 16, 40, 8, 6);
    g.fillRect(cx + 8, 40, 8, 6);
    // toe claws
    g.fillStyle(METAL);
    g.fillRect(cx - 18, 43, 4, 3);
    g.fillRect(cx + 14, 43, 4, 3);

    // leg struts — articulated
    g.fillStyle(METAL);
    g.fillRect(cx - 14, bodyY + 14, 5, 26 - lurk);
    g.fillRect(cx + 9, bodyY + 14, 5, 26 - lurk);

    // body — low profile
    g.fillStyle(BLACK);
    g.fillRect(cx - 16, bodyY, 32, 16);
    // subtle panel seam
    g.fillStyle(DARK);
    g.fillRect(cx - 16, bodyY + 8, 32, 1);

    // sensor cluster — green eyes
    const sensorColor = f === 1 ? 0x00ff66 : (f === 3 ? 0x004422 : GREEN);
    g.fillStyle(sensorColor);
    g.fillRect(cx - 8, bodyY + 3, 4, 4);
    g.fillRect(cx - 1, bodyY + 3, 4, 4);
    g.fillRect(cx + 6, bodyY + 3, 4, 4);

    // head / frontal plate
    g.fillStyle(METAL);
    g.fillRect(cx - 10, bodyY - 6, 20, 8);
    g.fillStyle(BLACK);
    g.fillRect(cx - 10, bodyY - 6, 20, 2);
  }

  g.generateTexture('enemy_bayou_stalker', FW * 4, FH);
  g.destroy();

  const tex = scene.textures.get('enemy_bayou_stalker');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * FW, 0, FW, FH);
};

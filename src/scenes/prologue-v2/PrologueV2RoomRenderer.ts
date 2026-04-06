import Phaser from 'phaser';
import { PV2 } from './PrologueV2Assets.js';

// ─── Room layout constants (shared with PrologueV2Scene for physics / triggers)
export const MAP_W      = 704;
export const MAP_H      = 448;
export const WALL_T     = 16;      // one tile thick
export const DIVIDER_X  = 352;     // centre dividing wall
export const DOOR_TOP   = 176;
export const DOOR_BOT   = 272;
export const FDOOR_TOP  = 176;
export const FDOOR_BOT  = 272;

const BEDROOM_W  = DIVIDER_X - WALL_T;   // 336
const LIVING_W   = MAP_W - DIVIDER_X - WALL_T;  // 336

/**
 * Draws all static room geometry for the prologue apartment V2
 * using pixel-art sprites instead of Graphics primitives.
 */
export function drawPrologueRoomV2(scene: Phaser.Scene): void {
  // ── Floors ──────────────────────────────────────────────────────────────

  // Bedroom floor (wood)
  scene.add.tileSprite(
    WALL_T + BEDROOM_W / 2, WALL_T + (MAP_H - WALL_T * 2) / 2,
    BEDROOM_W, MAP_H - WALL_T * 2,
    PV2.FLOOR_WOOD,
  ).setDepth(0);

  // Living room floor (lighter wood)
  scene.add.tileSprite(
    DIVIDER_X + LIVING_W / 2 + 8, WALL_T + (MAP_H - WALL_T * 2) / 2,
    LIVING_W, MAP_H - WALL_T * 2,
    PV2.FLOOR_LIGHT,
  ).setDepth(0);

  // ── Walls (solid colored rectangles matching the pack palette) ──────────

  const g = scene.add.graphics().setDepth(1);

  // Bedroom walls — dark blue-grey
  g.fillStyle(0x2a3040);
  g.fillRect(0, 0, DIVIDER_X, WALL_T);               // top
  g.fillRect(0, MAP_H - WALL_T, DIVIDER_X, WALL_T);  // bottom
  g.fillRect(0, 0, WALL_T, MAP_H);                    // left

  // Living room walls — slightly warmer grey
  g.fillStyle(0x302a28);
  g.fillRect(DIVIDER_X, 0, MAP_W - DIVIDER_X, WALL_T);               // top
  g.fillRect(DIVIDER_X, MAP_H - WALL_T, MAP_W - DIVIDER_X, WALL_T);  // bottom

  // Right wall (with front door gap)
  g.fillRect(MAP_W - WALL_T, 0, WALL_T, FDOOR_TOP);
  g.fillRect(MAP_W - WALL_T, FDOOR_BOT, WALL_T, MAP_H - FDOOR_BOT);

  // Dividing wall (with doorway gap)
  g.fillStyle(0x2e2828);
  g.fillRect(DIVIDER_X - 4, 0, 8, DOOR_TOP);
  g.fillRect(DIVIDER_X - 4, DOOR_BOT, 8, MAP_H - DOOR_BOT);

  // Baseboard accent lines
  g.lineStyle(2, 0x4a3828, 0.6);
  g.moveTo(WALL_T, WALL_T);
  g.lineTo(DIVIDER_X - 4, WALL_T);
  g.moveTo(DIVIDER_X + 4, WALL_T);
  g.lineTo(MAP_W - WALL_T, WALL_T);
  g.strokePath();

  // ── Living room rug ────────────────────────────────────────────────────

  scene.add.image(DIVIDER_X + LIVING_W / 2 + 8, 270, PV2.RUG)
    .setDepth(1).setScale(1.8).setAlpha(0.7);

  // ── BEDROOM FURNITURE ──────────────────────────────────────────────────

  // Bed — top-left area
  scene.add.image(100, 80, PV2.BED).setDepth(3).setOrigin(0.5, 0.5);

  // Nightstand with alarm clock next to bed
  scene.add.image(170, 64, PV2.NIGHTSTAND).setDepth(3);
  scene.add.image(170, 54, PV2.CLOCK).setDepth(4);

  // Wardrobe — left wall
  scene.add.image(40, 160, PV2.WARDROBE).setDepth(3);

  // Computer desk + monitor — right side of bedroom
  scene.add.image(260, 170, PV2.DESK).setDepth(3);
  scene.add.image(260, 152, PV2.MONITOR).setDepth(4);

  // Bookshelf — bottom-left
  scene.add.image(50, 320, PV2.BOOKSHELF).setDepth(3);

  // Lamp on desk area
  scene.add.image(290, 148, PV2.LAMP).setDepth(4);

  // Bedroom window — top wall
  scene.add.image(160, 8, PV2.WINDOW).setDepth(2).setScale(1.2);

  // Poster — wall above bed area
  scene.add.image(100, 22, PV2.POSTER).setDepth(2);

  // ── LIVING ROOM FURNITURE ──────────────────────────────────────────────

  // TV — drawn with Graphics (not in asset pack)
  const tvX = 520, tvY = 40;
  g.fillStyle(0x111111);
  g.fillRect(tvX - 60, tvY - 16, 120, 56);
  g.fillStyle(0x1c1c1c);
  g.fillRect(tvX - 56, tvY - 12, 112, 48);
  g.fillStyle(0x050508);
  g.fillRect(tvX - 52, tvY - 8, 104, 40);
  // TV stand
  g.fillStyle(0x2a2a2a);
  g.fillRect(tvX - 16, tvY + 40, 32, 6);
  g.fillRect(tvX - 24, tvY + 46, 48, 4);
  // Power LED
  g.fillStyle(0x00cc44);
  g.fillRect(tvX - 2, tvY + 36, 4, 3);

  // Couch
  scene.add.image(520, 240, PV2.COUCH).setDepth(3).setScale(1.6);

  // Coffee table between TV and couch
  scene.add.image(520, 150, PV2.COFFEE_TABLE).setDepth(3).setScale(1.3);

  // Coffee mug on table — small Graphics detail
  g.fillStyle(0x8a4422);
  g.fillRect(500, 144, 10, 10);
  g.fillStyle(0x1a0c06);
  g.fillRect(501, 145, 8, 6);
  g.fillStyle(0xaa6622);
  g.fillRect(510, 146, 3, 6);

  // Remote on table
  g.fillStyle(0x222222);
  g.fillRect(530, 145, 16, 8);
  g.fillStyle(0x444444);
  g.fillRect(532, 147, 3, 3);
  g.fillRect(537, 147, 3, 3);

  // Plant — bottom-left of living room
  scene.add.image(375, 370, PV2.PLANT).setDepth(3).setScale(1.5);

  // Living room window — top wall
  scene.add.image(600, 8, PV2.WINDOW).setDepth(2).setScale(1.2);

  // Wall art — above couch area
  scene.add.image(480, 22, PV2.WALL_ART).setDepth(2).setScale(1.4);
  scene.add.image(560, 22, PV2.WALL_ART).setDepth(2).setScale(1.4).setFlipX(true);

  // Front door
  scene.add.image(MAP_W - 8, (FDOOR_TOP + FDOOR_BOT) / 2, PV2.DOOR)
    .setDepth(2).setScale(1.2);

  // Door handle highlight
  g.fillStyle(0xd4aa20);
  g.fillRect(MAP_W - 14, 220, 5, 5);
}

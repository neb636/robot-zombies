import Phaser from 'phaser';

// ─── Room layout constants (shared with PrologueScene for physics / triggers) ─
export const MAP_W      = 700;
export const MAP_H      = 440;
export const WALL_T     = 10;
export const DIVIDER_X  = 340;
export const DOOR_TOP   = 175;
export const DOOR_BOT   = 275;
export const FDOOR_TOP  = 178;
export const FDOOR_BOT  = 278;

/**
 * Draws all static room geometry (walls, floors, furniture) for the prologue
 * apartment.  Pure graphics — no physics bodies, no game objects.
 */
export function drawPrologueRoom(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  g.fillStyle(0x2a1f16);
  g.fillRect(WALL_T, WALL_T, DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);

  g.fillStyle(0x1a202e);
  g.fillRect(DIVIDER_X + WALL_T, WALL_T, MAP_W - DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);

  g.fillStyle(0x2a2438);
  g.fillRect(0, 0, MAP_W, WALL_T);
  g.fillRect(0, MAP_H - WALL_T, MAP_W, WALL_T);
  g.fillRect(0, 0, WALL_T, MAP_H);
  g.fillRect(MAP_W - WALL_T, 0, WALL_T, FDOOR_TOP);
  g.fillRect(MAP_W - WALL_T, FDOOR_BOT, WALL_T, MAP_H - FDOOR_BOT);
  g.fillRect(DIVIDER_X - 4, 0, 8, DOOR_TOP);
  g.fillRect(DIVIDER_X - 4, DOOR_BOT, 8, MAP_H - DOOR_BOT);

  g.fillStyle(0x5c3a1e);
  g.fillRect(DIVIDER_X - 6, DOOR_TOP - 4, 12, 6);
  g.fillRect(DIVIDER_X - 6, DOOR_BOT - 2, 12, 6);

  // ── BEDROOM FURNITURE ───────────────────────────────────────────────────────

  // Bed — dark wood frame, queen bed
  g.fillStyle(0x2e1a0a);              // frame base
  g.fillRect(24, 26, 120, 114);
  g.fillStyle(0x1a0e04);              // bottom edge depth shadow
  g.fillRect(24, 132, 120, 8);
  g.fillStyle(0x4a3020);              // side rails
  g.fillRect(24, 48, 8, 84);
  g.fillRect(136, 48, 8, 84);

  // Headboard
  g.fillStyle(0x5a3818);              // headboard face
  g.fillRect(24, 26, 120, 24);
  g.fillStyle(0x7a5028);              // top highlight
  g.fillRect(26, 26, 116, 6);
  g.fillStyle(0x3e2610);              // wood panel dividers
  g.fillRect(64, 30, 2, 20);
  g.fillRect(104, 30, 2, 20);

  // Mattress / base sheet
  g.fillStyle(0xe4dcc8);
  g.fillRect(32, 50, 104, 80);

  // Left pillow
  g.fillStyle(0xfaf6f0);
  g.fillRect(36, 54, 44, 32);
  g.fillStyle(0xe8e4dc);              // border shadow
  g.fillRect(36, 84, 44, 2);
  g.fillRect(78, 54, 2, 32);
  g.fillStyle(0xffffff);              // highlight
  g.fillRect(38, 56, 16, 8);

  // Right pillow
  g.fillStyle(0xf5f1eb);
  g.fillRect(84, 54, 44, 32);
  g.fillStyle(0xe2dedd);
  g.fillRect(84, 84, 44, 2);
  g.fillRect(126, 54, 2, 32);
  g.fillStyle(0xfafaf8);
  g.fillRect(86, 56, 16, 8);

  // Sheet fold (visible strip between pillows and blanket)
  g.fillStyle(0xd8d0bc);
  g.fillRect(32, 86, 104, 6);

  // Blanket / comforter
  g.fillStyle(0x6858a2);              // main color
  g.fillRect(32, 92, 104, 38);
  g.fillStyle(0x7a6ab4);              // highlight ridges
  g.fillRect(32, 94, 104, 4);
  g.fillRect(32, 106, 104, 4);
  g.fillRect(32, 118, 104, 4);
  g.fillStyle(0x584890);              // shadow valleys
  g.fillRect(32, 100, 104, 3);
  g.fillRect(32, 112, 104, 3);
  g.fillRect(32, 124, 104, 3);
  g.fillStyle(0x4a3880);              // bottom fold edge
  g.fillRect(32, 128, 104, 4);

  // Bed legs
  g.fillStyle(0x2e1a0a);
  g.fillRect(24, 132, 12, 8);
  g.fillRect(132, 132, 12, 8);

  g.fillStyle(0x3a3020);
  g.fillRect(224, 46, 36, 30);
  g.fillStyle(0xcc3300);
  g.fillRect(228, 50, 28, 20);
  g.fillStyle(0x111100);
  g.fillRect(231, 53, 22, 12);
  g.fillStyle(0x22ee44);
  g.fillRect(233, 55, 18, 8);

  g.fillStyle(0x4a3020);
  g.fillRect(214, 150, 100, 62);
  g.fillStyle(0x362815);
  g.fillRect(216, 210, 10, 14);
  g.fillRect(300, 210, 10, 14);
  g.fillStyle(0x111122);
  g.fillRect(224, 155, 64, 44);
  g.fillStyle(0x001a44);
  g.fillRect(228, 159, 56, 36);
  g.fillStyle(0x0044cc, 0.7);
  g.fillRect(232, 165, 48, 3);
  g.fillRect(232, 172, 36, 3);
  g.fillRect(232, 179, 44, 3);
  g.fillStyle(0x222233);
  g.fillRect(250, 199, 14, 8);
  g.fillRect(244, 207, 26, 4);

  g.fillStyle(0x2e2840);
  g.fillRect(226, 218, 50, 36);
  g.fillStyle(0x3a3454);
  g.fillRect(228, 220, 46, 22);

  g.fillStyle(0x2c1a0e);
  g.fillRect(16, 196, 56, 130);
  g.fillStyle(0x1a0c06);
  g.fillRect(20, 200, 48, 122);
  g.fillStyle(0x3c2414);
  g.fillRect(18, 240, 52, 5);
  g.fillRect(18, 278, 52, 5);
  g.fillRect(18, 316, 52, 5);

  const books: Array<[number, number]> = [
    [0xaa3322, 0], [0x3366aa, 1], [0x33aa66, 2], [0xaa8822, 3], [0x884466, 4],
    [0x4488aa, 0], [0xcc6600, 1], [0x226688, 2], [0x885522, 3],
    [0xaa4444, 0], [0x448833, 1], [0x6644aa, 2], [0xaa7722, 3],
  ];
  books.forEach(([col, shelf]) => {
    const bx = 22 + (shelf % 5) * 9;
    const by = 206 + shelf * 38 + Math.floor(shelf / 5) * 4;
    g.fillStyle(col);
    g.fillRect(bx, by, 7, 32);
  });

  g.fillStyle(0x4a6080);
  g.fillRect(100, 2, 120, 22);
  g.fillStyle(0x88ccff);
  g.fillRect(104, 4, 112, 18);
  g.fillStyle(0xffffff);
  g.fillRect(160, 4, 2, 18);
  g.fillStyle(0xaaddff, 0.3);
  g.fillRect(104, 4, 112, 6);

  // ── LIVING ROOM FURNITURE ──────────────────────────────────────────────────

  // TV — flat-screen widescreen
  g.fillStyle(0x111111);              // outer frame
  g.fillRect(370, 20, 214, 92);
  g.fillStyle(0x1c1c1c);              // inner bezel
  g.fillRect(374, 24, 206, 84);
  g.fillStyle(0x050508);              // screen glass
  g.fillRect(378, 28, 198, 72);
  g.fillStyle(0x0a0a12);              // off-screen dark reflection patch
  g.fillRect(380, 30, 64, 34);
  g.fillStyle(0x2a2a2a);              // side speaker grills
  g.fillRect(372, 34, 4, 60);
  g.fillRect(580, 34, 4, 60);
  g.fillStyle(0x2e2e2e);              // bezel top highlight
  g.fillRect(374, 24, 206, 3);
  g.fillStyle(0x00cc44);              // power LED
  g.fillRect(468, 100, 4, 4);
  g.fillStyle(0x2a2a2a);              // stand neck
  g.fillRect(456, 112, 52, 8);
  g.fillStyle(0x333333);              // stand foot
  g.fillRect(442, 120, 80, 6);
  g.fillStyle(0x222222);              // foot underside shadow
  g.fillRect(444, 126, 76, 3);

  // Living room window
  g.fillStyle(0x4a6080);
  g.fillRect(574, 2, 108, 22);
  g.fillStyle(0x88ccff);
  g.fillRect(578, 4, 100, 18);
  g.fillStyle(0xffffff);
  g.fillRect(628, 4, 2, 18);
  g.fillStyle(0xaaddff, 0.3);
  g.fillRect(578, 4, 100, 6);

  // COUCH — 3-seat sofa
  // Full body base / shadow
  g.fillStyle(0x3a2010);
  g.fillRect(358, 212, 224, 92);

  // Back cushions (upper section of sofa)
  g.fillStyle(0x6e4c32);             // left back cushion
  g.fillRect(376, 214, 84, 42);
  g.fillStyle(0x6a4a30);             // right back cushion
  g.fillRect(468, 214, 96, 42);
  // Back cushion top highlights
  g.fillStyle(0x8a6244);
  g.fillRect(376, 214, 84, 5);
  g.fillRect(468, 214, 96, 5);
  // Back cushion horizontal crease lines
  g.fillStyle(0x5a3c24);
  g.fillRect(376, 234, 84, 2);
  g.fillRect(468, 234, 96, 2);
  // Gap between back cushions
  g.fillStyle(0x2a1808);
  g.fillRect(460, 214, 8, 42);

  // Seat cushions (lower section)
  g.fillStyle(0x7a5838);             // left seat cushion
  g.fillRect(376, 258, 84, 38);
  g.fillStyle(0x906848);             // seat top highlight
  g.fillRect(376, 258, 84, 5);
  g.fillStyle(0x3e2010);             // seat front shadow
  g.fillRect(376, 292, 84, 4);
  g.fillStyle(0x5a3c24);             // seat stitching seam
  g.fillRect(396, 264, 2, 26);

  g.fillStyle(0x785636);             // right seat cushion
  g.fillRect(468, 258, 96, 38);
  g.fillStyle(0x8a6446);
  g.fillRect(468, 258, 96, 5);
  g.fillStyle(0x3e2010);
  g.fillRect(468, 292, 96, 4);
  g.fillStyle(0x583a22);             // seat stitching seam
  g.fillRect(488, 264, 2, 26);
  // Gap between seat cushions
  g.fillStyle(0x2a1808);
  g.fillRect(460, 258, 8, 38);

  // Left armrest
  g.fillStyle(0x3c2814);
  g.fillRect(358, 212, 18, 92);
  g.fillStyle(0x7a5a34);             // armrest top face
  g.fillRect(360, 212, 14, 16);
  g.fillStyle(0x2a1a08);             // armrest inner shadow line
  g.fillRect(374, 228, 2, 64);

  // Right armrest
  g.fillStyle(0x3c2814);
  g.fillRect(564, 212, 18, 92);
  g.fillStyle(0x7a5a34);             // armrest top face
  g.fillRect(566, 212, 14, 16);
  g.fillStyle(0x2a1a08);             // armrest inner shadow line
  g.fillRect(564, 228, 2, 64);

  // Front bottom edge (depth perspective)
  g.fillStyle(0x1e0e04);
  g.fillRect(376, 296, 186, 8);

  // COFFEE TABLE — between TV and couch
  g.fillStyle(0x5c3c24);             // table top surface
  g.fillRect(390, 148, 164, 32);
  g.fillStyle(0x6e4c30);             // top surface highlight
  g.fillRect(392, 150, 160, 10);
  g.fillStyle(0x3a2010);             // front edge shadow
  g.fillRect(392, 176, 160, 4);
  g.fillStyle(0x3a2416);             // legs
  g.fillRect(392, 180, 10, 8);
  g.fillRect(542, 180, 10, 8);
  // Remote control on table
  g.fillStyle(0x111111);
  g.fillRect(484, 153, 46, 18);
  g.fillStyle(0x333333);
  g.fillRect(487, 156, 5, 5);
  g.fillRect(497, 156, 5, 5);
  g.fillRect(507, 156, 5, 5);
  g.fillStyle(0x2244aa);             // remote top button
  g.fillRect(519, 156, 5, 5);
  // Mug on table
  g.fillStyle(0x8a4422);             // mug body
  g.fillRect(430, 152, 20, 18);
  g.fillStyle(0x6a2c12);             // mug rim/base
  g.fillRect(430, 168, 20, 4);
  g.fillStyle(0x1a0c06);             // coffee surface
  g.fillRect(432, 154, 16, 12);
  g.fillStyle(0xaa6622);             // mug handle
  g.fillRect(450, 156, 4, 10);

  // LIVING ROOM PLANT — tall potted plant in corner
  // Central stem
  g.fillStyle(0x4a2c12);
  g.fillRect(369, 314, 4, 28);
  // Back leaves (darker, behind stem)
  g.fillStyle(0x16782e);
  g.fillRect(359, 322, 10, 10);
  g.fillRect(373, 308, 10, 12);
  // Front-left leaf
  g.fillStyle(0x1a9038);
  g.fillRect(354, 326, 16, 10);
  // Upper-left leaf
  g.fillStyle(0x22aa44);
  g.fillRect(350, 314, 16, 11);
  // Front-right leaf
  g.fillStyle(0x1a9038);
  g.fillRect(372, 326, 16, 10);
  // Upper-right leaf
  g.fillStyle(0x22aa44);
  g.fillRect(374, 314, 16, 11);
  // Top center leaf
  g.fillStyle(0x28cc4c);
  g.fillRect(365, 304, 12, 16);
  // Leaf vein highlights
  g.fillStyle(0x44dd66);
  g.fillRect(366, 305, 4, 7);
  g.fillRect(351, 315, 4, 5);
  g.fillRect(376, 315, 4, 5);
  g.fillRect(355, 327, 4, 4);
  g.fillRect(374, 327, 4, 4);
  // Soil
  g.fillStyle(0x1a0c04);
  g.fillRect(360, 340, 22, 6);
  // Pot rim
  g.fillStyle(0x7a3a18);
  g.fillRect(358, 340, 26, 5);
  // Pot body
  g.fillStyle(0x8a4422);
  g.fillRect(360, 345, 22, 18);
  // Pot highlight
  g.fillStyle(0xaa5530);
  g.fillRect(361, 346, 5, 14);
  // Pot base taper
  g.fillStyle(0x7a3a18);
  g.fillRect(363, 363, 16, 5);

  g.fillStyle(0x5c3a1e);
  g.fillRect(MAP_W - WALL_T - 2, FDOOR_TOP, WALL_T + 2, FDOOR_BOT - FDOOR_TOP);
  g.fillStyle(0x7a5030);
  g.fillRect(MAP_W - WALL_T + 1, FDOOR_TOP + 4, WALL_T - 4, FDOOR_BOT - FDOOR_TOP - 8);
  g.fillStyle(0xd4aa20);
  g.fillRect(MAP_W - 14, 222, 6, 6);

  g.lineStyle(1, 0x000000, 0.06);
  for (let x = WALL_T; x < DIVIDER_X; x += 32) {
    g.moveTo(x, WALL_T);
    g.lineTo(x, MAP_H - WALL_T);
  }
  for (let x = DIVIDER_X + WALL_T; x < MAP_W - WALL_T; x += 32) {
    g.moveTo(x, WALL_T);
    g.lineTo(x, MAP_H - WALL_T);
  }
  for (let y = WALL_T; y < MAP_H - WALL_T; y += 32) {
    g.moveTo(WALL_T, y);
    g.lineTo(MAP_W - WALL_T, y);
  }
  g.strokePath();
}

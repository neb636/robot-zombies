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

  // ── BEDROOM FLOOR — warm wood planks ───────────────────────────────────────
  g.fillStyle(0x8a6842);                                                // warm wood base
  g.fillRect(WALL_T, WALL_T, DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);
  g.fillStyle(0x9e7a52);                                                // lighter highlight stripe
  for (let y = WALL_T + 6; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(WALL_T, y, DIVIDER_X - WALL_T * 2, 2);
  }
  g.fillStyle(0x5c4020);                                                // plank seam shadow
  for (let y = WALL_T + 40; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(WALL_T, y, DIVIDER_X - WALL_T * 2, 2);
  }
  g.fillStyle(0x6a4a28);                                                // subtle grain flecks
  for (let y = WALL_T + 18; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(WALL_T + 22, y, 38, 1);
    g.fillRect(WALL_T + 120, y, 54, 1);
    g.fillRect(WALL_T + 210, y, 42, 1);
  }

  // ── LIVING ROOM FLOOR — slightly warmer wood planks ────────────────────────
  g.fillStyle(0x94704a);
  g.fillRect(DIVIDER_X + WALL_T, WALL_T, MAP_W - DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);
  g.fillStyle(0xaa8460);
  for (let y = WALL_T + 6; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(DIVIDER_X + WALL_T, y, MAP_W - DIVIDER_X - WALL_T * 2, 2);
  }
  g.fillStyle(0x603e20);
  for (let y = WALL_T + 40; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(DIVIDER_X + WALL_T, y, MAP_W - DIVIDER_X - WALL_T * 2, 2);
  }
  g.fillStyle(0x7c5632);
  for (let y = WALL_T + 18; y < MAP_H - WALL_T; y += 40) {
    g.fillRect(DIVIDER_X + 30, y, 60, 1);
    g.fillRect(DIVIDER_X + 140, y, 80, 1);
    g.fillRect(DIVIDER_X + 260, y, 50, 1);
  }

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

  // Blanket / comforter — teal with cream stripe accents
  g.fillStyle(0x3a6a78);              // teal main color
  g.fillRect(32, 92, 104, 38);
  g.fillStyle(0x4a8092);              // highlight ridges
  g.fillRect(32, 94, 104, 3);
  g.fillRect(32, 108, 104, 2);
  g.fillRect(32, 120, 104, 2);
  g.fillStyle(0x285462);              // shadow valleys
  g.fillRect(32, 102, 104, 2);
  g.fillRect(32, 114, 104, 2);
  g.fillStyle(0xe4d6b0);              // cream accent stripe
  g.fillRect(32, 112, 104, 1);
  g.fillStyle(0x1c3e4a);              // bottom fold edge
  g.fillRect(32, 128, 104, 4);

  // Bed legs
  g.fillStyle(0x2e1a0a);
  g.fillRect(24, 132, 12, 8);
  g.fillRect(132, 132, 12, 8);

  // Nightstand — beside the bed, holds the lamp
  g.fillStyle(0x3a2412);                                                // body / front
  g.fillRect(152, 78, 54, 62);
  g.fillStyle(0x5c3c20);                                                // top surface
  g.fillRect(152, 78, 54, 6);
  g.fillStyle(0x6e4a28);                                                // top edge highlight
  g.fillRect(152, 78, 54, 1);
  g.fillStyle(0x2a1808);                                                // drawer seam
  g.fillRect(152, 108, 54, 1);
  g.fillStyle(0x8a6a40);                                                // drawer pulls
  g.fillRect(174, 94, 10, 2);
  g.fillRect(174, 122, 10, 2);

  // Bedside lamp — peach shade with brass stem
  g.fillStyle(0x281a10);                                                // base plate
  g.fillRect(170, 70, 20, 4);
  g.fillStyle(0x3a281a);                                                // base shadow
  g.fillRect(170, 73, 20, 2);
  g.fillStyle(0xb08a40);                                                // brass stem
  g.fillRect(178, 46, 4, 26);
  g.fillStyle(0xd4a858);                                                // stem highlight
  g.fillRect(178, 46, 1, 26);
  g.fillStyle(0xc47660);                                                // shade — lower/wider (shadow tone)
  g.fillRect(160, 36, 40, 14);
  g.fillStyle(0xe8977e);                                                // shade main face
  g.fillRect(162, 22, 36, 14);
  g.fillStyle(0xf4b094);                                                // shade highlight
  g.fillRect(164, 22, 28, 3);
  g.fillRect(164, 24, 6, 10);
  g.fillStyle(0xa45840);                                                // shade bottom rim shadow
  g.fillRect(160, 48, 40, 2);
  g.fillStyle(0xffe8c0);                                                // warm light spill under shade
  g.fillRect(170, 50, 20, 2);

  // Alarm clock — sits on the nightstand, next to the lamp
  g.fillStyle(0x2a1a0e);                                                // body
  g.fillRect(156, 60, 30, 18);
  g.fillStyle(0x3a2818);                                                // body top highlight
  g.fillRect(156, 60, 30, 2);
  g.fillStyle(0x080808);                                                // display bezel
  g.fillRect(159, 64, 24, 12);
  g.fillStyle(0x22ee44);                                                // LED display
  g.fillRect(161, 66, 20, 8);

  // Wooden desk
  g.fillStyle(0x5c3c20);                                                // desk top
  g.fillRect(214, 150, 100, 62);
  g.fillStyle(0x6e4a28);                                                // desk top highlight
  g.fillRect(214, 150, 100, 4);
  g.fillStyle(0x3a2412);                                                // desk legs
  g.fillRect(216, 210, 10, 14);
  g.fillRect(300, 210, 10, 14);
  g.fillStyle(0x2a1a0a);                                                // desk front shadow
  g.fillRect(214, 208, 100, 2);

  // Retro CRT monitor — beige/cream housing
  g.fillStyle(0xcab896);                                                // outer housing
  g.fillRect(224, 152, 64, 48);
  g.fillStyle(0xe2d2aa);                                                // top highlight
  g.fillRect(224, 152, 64, 3);
  g.fillStyle(0xa08c68);                                                // lower shadow
  g.fillRect(224, 197, 64, 3);
  g.fillStyle(0x2a2218);                                                // screen bezel
  g.fillRect(228, 156, 56, 38);
  g.fillStyle(0x0c1a24);                                                // screen glass
  g.fillRect(230, 158, 52, 34);
  g.fillStyle(0x3e9ac8);                                                // scanline glow
  g.fillRect(232, 162, 48, 2);
  g.fillRect(232, 168, 32, 2);
  g.fillRect(232, 174, 40, 2);
  g.fillRect(232, 180, 24, 2);
  g.fillStyle(0x1a3848);                                                // dim scanline
  g.fillRect(232, 166, 48, 1);
  g.fillRect(232, 172, 48, 1);
  g.fillStyle(0x6a5838);                                                // power indicator
  g.fillRect(280, 196, 4, 2);

  // Keyboard on desk
  g.fillStyle(0x1c140a);                                                // keyboard body
  g.fillRect(240, 202, 48, 8);
  g.fillStyle(0x302214);                                                // keyboard top
  g.fillRect(240, 202, 48, 2);

  // Desk chair — wood tone matching aesthetic
  g.fillStyle(0x3a2616);                                                // chair back
  g.fillRect(226, 218, 50, 36);
  g.fillStyle(0x5a3c22);                                                // chair seat cushion
  g.fillRect(228, 220, 46, 22);
  g.fillStyle(0x6e4a2c);                                                // seat highlight
  g.fillRect(228, 220, 46, 3);

  // Bookshelf — against left wall, 3/4 top-down (top surface visible, shelf tops catch light)
  g.fillStyle(0x2c1a0e);              // outer frame
  g.fillRect(16, 196, 56, 130);
  g.fillStyle(0x4a2e18);              // top surface (light from above hits it)
  g.fillRect(16, 196, 56, 4);
  g.fillStyle(0x6a4426);              // top front edge highlight
  g.fillRect(16, 196, 56, 1);
  g.fillStyle(0x1a0c06);              // shelf interior (deep shadow)
  g.fillRect(20, 202, 48, 120);
  // Shelf dividers — top face (light) + front face (shadow)
  g.fillStyle(0x5a3820);
  g.fillRect(20, 238, 48, 2);         // shelf 1 top
  g.fillRect(20, 276, 48, 2);         // shelf 2 top
  g.fillRect(20, 314, 48, 2);         // shelf 3 top
  g.fillStyle(0x3c2414);
  g.fillRect(20, 240, 48, 3);         // shelf 1 front lip
  g.fillRect(20, 278, 48, 3);         // shelf 2 front lip
  g.fillRect(20, 316, 48, 3);         // shelf 3 front lip

  const books: Array<[number, number]> = [
    [0xaa3322, 0], [0x3366aa, 1], [0x33aa66, 2], [0xaa8822, 3], [0x884466, 4],
    [0x4488aa, 0], [0xcc6600, 1], [0x226688, 2], [0x885522, 3],
    [0xaa4444, 0], [0x448833, 1], [0x6644aa, 2], [0xaa7722, 3],
  ];
  books.forEach(([col, shelf]) => {
    const bx = 22 + (shelf % 5) * 9;
    const by = 206 + shelf * 38 + Math.floor(shelf / 5) * 4;
    g.fillStyle(col);
    g.fillRect(bx, by, 7, 30);
    // Book top — lighten each RGB channel independently, clamp at 0xff
    const r = Math.min(0xff, ((col >> 16) & 0xff) + 0x30);
    const gc = Math.min(0xff, ((col >> 8) & 0xff) + 0x30);
    const b = Math.min(0xff, (col & 0xff) + 0x30);
    g.fillStyle((r << 16) | (gc << 8) | b);
    g.fillRect(bx, by, 7, 1);
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

  // TV — wall-mounted flat screen, flush against top wall (3/4 view)
  g.fillStyle(0x0a0a0a);              // mount shadow (TV sits slightly proud of wall)
  g.fillRect(372, 12, 214, 4);
  g.fillStyle(0x161616);              // outer frame
  g.fillRect(370, 12, 214, 64);
  g.fillStyle(0x242424);              // bezel top face (catches "light from above")
  g.fillRect(370, 12, 214, 4);
  g.fillStyle(0x1c1c1c);              // inner bezel
  g.fillRect(374, 20, 206, 52);
  g.fillStyle(0x050508);              // screen glass
  g.fillRect(378, 22, 198, 48);
  g.fillStyle(0x0a0a12);              // off-screen dark reflection patch
  g.fillRect(380, 24, 64, 22);
  g.fillStyle(0x2a2a2a);              // side speaker grills
  g.fillRect(372, 28, 4, 36);
  g.fillRect(580, 28, 4, 36);
  g.fillStyle(0x00cc44);              // power LED
  g.fillRect(476, 72, 3, 2);
  g.fillStyle(0x050404);              // bottom shelf shadow cast on wall (depth cue)
  g.fillRect(370, 76, 214, 2);

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

  // LIVING ROOM PLANT — potted plant, 3/4 top-down view (leaves radiate outward)
  // Pot (drawn first so leaves overhang it naturally)
  g.fillStyle(0x1a0c04);              // soil (visible through leaves)
  g.fillRect(360, 340, 22, 4);
  g.fillStyle(0x7a3a18);              // pot rim (top ellipse)
  g.fillRect(358, 340, 26, 5);
  g.fillStyle(0x8a4422);              // pot body front
  g.fillRect(360, 345, 22, 18);
  g.fillStyle(0xaa5530);               // pot left highlight (light from upper-left)
  g.fillRect(361, 346, 4, 14);
  g.fillStyle(0x5a2810);               // pot right shadow
  g.fillRect(378, 346, 4, 14);
  g.fillStyle(0x7a3a18);              // pot base taper
  g.fillRect(363, 363, 16, 4);

  // Foliage — radiates outward from center of pot (371, 332)
  // Shadow layer (dark green, back / lower)
  g.fillStyle(0x16782e);
  g.fillRect(354, 326, 14, 10);       // back-left
  g.fillRect(374, 326, 14, 10);       // back-right
  g.fillRect(362, 318, 18, 10);       // back-center
  g.fillRect(360, 336, 22, 6);        // front drooping leaves over pot rim

  // Mid layer
  g.fillStyle(0x1a9038);
  g.fillRect(356, 322, 10, 8);        // left fan
  g.fillRect(376, 322, 10, 8);        // right fan
  g.fillRect(366, 314, 12, 8);        // top-center cluster

  // Top highlights (brighter, as if light hits upper leaf faces)
  g.fillStyle(0x28cc4c);
  g.fillRect(358, 324, 6, 4);
  g.fillRect(378, 324, 6, 4);
  g.fillRect(368, 316, 8, 5);

  // Vein / leaf-tip highlights
  g.fillStyle(0x44dd66);
  g.fillRect(359, 325, 3, 2);
  g.fillRect(381, 325, 3, 2);
  g.fillRect(370, 317, 3, 3);

  g.fillStyle(0x5c3a1e);
  g.fillRect(MAP_W - WALL_T - 2, FDOOR_TOP, WALL_T + 2, FDOOR_BOT - FDOOR_TOP);
  g.fillStyle(0x7a5030);
  g.fillRect(MAP_W - WALL_T + 1, FDOOR_TOP + 4, WALL_T - 4, FDOOR_BOT - FDOOR_TOP - 8);
  g.fillStyle(0xd4aa20);
  g.fillRect(MAP_W - 14, 222, 6, 6);

}

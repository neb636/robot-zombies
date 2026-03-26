import Phaser from 'phaser';

// ─── Layout constants (shared with NewBostonScene for physics / triggers) ─────
export const MAP_W           = 1600;
export const MAP_H           = 1200;
export const WALL_T          = 12;
export const PLAYER_START_X  = 120;
export const PLAYER_START_Y  = 580;
export const MARCUS_START_X  = 320;
export const MARCUS_START_Y  = 580;
export const CHECKPOINT_X    = 1400;
export const CHECKPOINT_Y_TOP = 400;
export const CHECKPOINT_Y_BOT = 700;

/**
 * Draws all static environment geometry for the New Boston / Beacon Hill scene.
 * Pure graphics — no physics bodies, no game objects.
 * Two years after the Broadcast. The neighborhood is intact. Wrong.
 */
export function drawNewBoston(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  // ── BASE — full map background ──────────────────────────────────────────────
  g.fillStyle(0x161616);
  g.fillRect(0, 0, MAP_W, MAP_H);

  // ── STREET GRID ─────────────────────────────────────────────────────────────
  // Main horizontal street (center corridor where player walks)
  g.fillStyle(0x1e1e1e);
  g.fillRect(0, 420, MAP_W, 360);

  // Cross streets (vertical corridors)
  const crossStreetXs = [300, 600, 900, 1200];
  for (const sx of crossStreetXs) {
    g.fillStyle(0x1c1c1c);
    g.fillRect(sx, 0, 120, MAP_H);
  }

  // Sidewalk strips — slightly lighter than street
  g.fillStyle(0x262626);
  g.fillRect(0, 416, MAP_W, 12);    // north sidewalk edge
  g.fillRect(0, 772, MAP_W, 12);    // south sidewalk edge

  // Street grid lines (subtle — gives the cracked pavement texture)
  g.lineStyle(1, 0x2a2a2a, 0.6);
  for (let x = 0; x < MAP_W; x += 80) {
    g.moveTo(x, 420);
    g.lineTo(x, 780);
  }
  for (let y = 420; y < 780; y += 80) {
    g.moveTo(0, y);
    g.lineTo(MAP_W, y);
  }
  g.strokePath();

  // Crack lines — irregular dark lines across street surface
  g.lineStyle(1, 0x111111, 0.8);
  const cracks: Array<[number, number, number, number]> = [
    [80,  450, 220, 470], [340, 500, 580, 510], [620, 460, 820, 480],
    [900, 520, 1050, 505], [1100, 460, 1300, 490], [1350, 540, 1500, 525],
    [200, 680, 380, 700], [500, 650, 700, 670], [850, 690, 1000, 680],
    [1150, 660, 1380, 680],
  ];
  for (const [x1, y1, x2, y2] of cracks) {
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }
  g.strokePath();

  // ── SIDEWALKS — north and south of street ───────────────────────────────────
  // North sidewalk
  g.fillStyle(0x232323);
  g.fillRect(0, 360, MAP_W, 56);
  // South sidewalk
  g.fillStyle(0x222222);
  g.fillRect(0, 784, MAP_W, 56);

  // Sidewalk crack lines
  g.lineStyle(1, 0x181818, 0.9);
  for (let x = 60; x < MAP_W; x += 120) {
    g.moveTo(x, 360); g.lineTo(x, 416);
    g.moveTo(x, 784); g.lineTo(x, 840);
  }
  g.strokePath();

  // ── NORTH BUILDINGS (above street) ─────────────────────────────────────────
  // Brownstone rowhouses — dark reddish-brown bases with window grids
  const northBuildings = [
    { x: 0,    w: 140, h: 280 },
    { x: 148,  w: 140, h: 300 },
    { x: 316,  w: 140, h: 270 },
    { x: 464,  w: 128, h: 290 },
    { x: 728,  w: 144, h: 280 },
    { x: 880,  w: 136, h: 295 },
    { x: 1036, w: 148, h: 285 },
    { x: 1332, w: 140, h: 280 },
    { x: 1480, w: 120, h: 260 },
  ];

  for (let i = 0; i < northBuildings.length; i++) {
    const b = northBuildings[i]!;
    const bY = 360 - b.h;
    const charred = i % 3 === 2;

    // Building base
    g.fillStyle(charred ? 0x1a1210 : 0x4a2e22);
    g.fillRect(b.x, bY, b.w, b.h);

    // Charred section overlay
    if (charred) {
      g.fillStyle(0x111111);
      g.fillRect(b.x + 20, bY, b.w - 40, Math.floor(b.h * 0.4));
    }

    // Roofline
    g.fillStyle(0x352018);
    g.fillRect(b.x, bY, b.w, 8);

    // Windows — 2 columns × 3 rows
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 3; row++) {
        const wx = b.x + 18 + col * (Math.floor(b.w / 2) - 4);
        const wy = bY + 24 + row * 70;
        const ww = Math.floor(b.w / 2) - 22;
        const wh = 44;

        // Window frame
        g.fillStyle(0x2c1a10);
        g.fillRect(wx, wy, ww, wh);

        // Window glass — some dark (empty), some faint amber (occupied-converted)
        const glowAmber = (i + col + row) % 4 === 0;
        g.fillStyle(glowAmber ? 0x2a1a00 : 0x080606);
        g.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);

        if (glowAmber) {
          // Faint amber inner glow — just barely wrong
          g.fillStyle(0x1e1000);
          g.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
        }
      }
    }

    // Building foundation line
    g.fillStyle(0x201410);
    g.fillRect(b.x, 352, b.w, 8);
  }

  // ── SOUTH BUILDINGS (below street) ──────────────────────────────────────────
  const southBuildings = [
    { x: 0,    w: 136, h: 260 },
    { x: 144,  w: 148, h: 280 },
    { x: 310,  w: 136, h: 250 },
    { x: 466,  w: 128, h: 270 },
    { x: 614,  w: 140, h: 265 },
    { x: 736,  w: 148, h: 280 },
    { x: 904,  w: 128, h: 255 },
    { x: 1052, w: 144, h: 270 },
    { x: 1340, w: 140, h: 260 },
    { x: 1492, w: 108, h: 245 },
  ];

  for (let i = 0; i < southBuildings.length; i++) {
    const b = southBuildings[i]!;
    const bY = 840;
    const charred = i % 3 === 1;

    g.fillStyle(charred ? 0x181010 : 0x452a1e);
    g.fillRect(b.x, bY, b.w, b.h);

    if (charred) {
      g.fillStyle(0x0e0e0e);
      g.fillRect(b.x + 16, bY + Math.floor(b.h * 0.6), b.w - 32, Math.floor(b.h * 0.4));
    }

    g.fillStyle(0x301810);
    g.fillRect(b.x, bY, b.w, 8);

    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 2; row++) {
        const wx = b.x + 16 + col * (Math.floor(b.w / 2) - 4);
        const wy = bY + 22 + row * 64;
        const ww = Math.floor(b.w / 2) - 20;
        const wh = 40;

        g.fillStyle(0x2c1a10);
        g.fillRect(wx, wy, ww, wh);

        const glowAmber = (i + col * 2 + row) % 5 === 0;
        g.fillStyle(glowAmber ? 0x281800 : 0x060404);
        g.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
      }
    }
  }

  // ── STATE HOUSE RUIN (top of map, visible above north buildings) ─────────────
  // The golden dome — now dark, partially collapsed
  // Main building
  g.fillStyle(0xc8b890);
  g.fillRect(680, 0, 280, 120);
  // Column detail
  g.fillStyle(0xb8a880);
  for (let cx = 700; cx < 940; cx += 28) {
    g.fillRect(cx, 60, 8, 60);
  }
  // Collapsed left wing (rubble)
  g.fillStyle(0x222222);
  g.fillRect(580, 80, 120, 40);
  g.fillStyle(0x1a1a1a);
  g.fillRect(600, 90, 80, 30);
  // Dome base — still standing, dome smashed
  g.fillStyle(0xd4c8a0);
  g.fillRect(780, 0, 80, 80);
  // Collapsed dome (rubble heap)
  g.fillStyle(0x333328);
  g.fillRect(775, 60, 90, 28);
  g.fillStyle(0x222220);
  g.fillRect(785, 72, 70, 16);
  // Pale gold remnant of dome — just a stripe
  g.fillStyle(0x8a7040);
  g.fillRect(790, 56, 60, 8);

  // ── ABANDONED VEHICLES ──────────────────────────────────────────────────────
  // Post Apocalyptic pack sprites (64×48), scaled ×2 for visibility
  const vehicleSprites: Array<{ cx: number; cy: number; key: string }> = [
    { cx: 205, cy: 477, key: 'car_black' },
    { cx: 532, cy: 706, key: 'car_white' },
    { cx: 874, cy: 471, key: 'car_red'   },
    { cx: 1093, cy: 717, key: 'car_blue' },
    { cx: 1316, cy: 496, key: 'car_taxi' },
  ];

  for (const v of vehicleSprites) {
    scene.add.image(v.cx, v.cy, v.key).setScale(2).setDepth(2);
  }

  // ── OVERGROWTH — dark green patches reclaiming sidewalks ───────────────────
  const growthPatches: Array<[number, number, number, number]> = [
    [60,  370, 40, 20],  [380, 390, 30, 16],  [540, 375, 44, 18],
    [760, 382, 36, 14],  [1000, 372, 42, 20], [1160, 385, 34, 16],
    [1420, 374, 38, 18], [120, 800, 36, 14],  [450, 808, 40, 16],
    [780, 796, 44, 18],  [1080, 804, 32, 14], [1350, 800, 38, 16],
    // Some patches mid-road (severe cracking)
    [230, 600, 20, 12],  [720, 540, 18, 10],  [1180, 680, 22, 12],
  ];

  for (const [gx, gy, gw, gh] of growthPatches) {
    g.fillStyle(0x1a4a12);
    g.fillRect(gx, gy, gw, gh);
    // Lighter leaf tips
    g.fillStyle(0x226618);
    g.fillRect(gx + 4, gy, gw - 8, 4);
  }

  // ── STREET LIGHTS ────────────────────────────────────────────────────────────
  // Thin poles — some dead, some with faint amber glow (functioning-but-wrong)
  const lights: Array<{ x: number; alive: boolean }> = [
    { x: 140, alive: false }, { x: 440, alive: true  },
    { x: 740, alive: false }, { x: 1040, alive: true  },
    { x: 1340, alive: false },
  ];

  for (const light of lights) {
    // Pole
    g.fillStyle(0x222222);
    g.fillRect(light.x, 340, 4, 76);
    // Lamp head
    g.fillStyle(light.alive ? 0x3a2c10 : 0x252525);
    g.fillRect(light.x - 6, 334, 16, 8);
    if (light.alive) {
      // Faint amber glow — wrong color, too steady
      g.fillStyle(0x281e08);
      g.fillRect(light.x - 4, 336, 12, 4);
    }
  }

  // ── APARTMENT BUILDING EXIT — left edge ──────────────────────────────────────
  // The building the player just left (the prologue apartment)
  g.fillStyle(0x3e2618);
  g.fillRect(0, 300, 80, 360);
  // Door opening
  g.fillStyle(0x0c0a08);
  g.fillRect(24, 520, 44, 58);
  // Door frame
  g.fillStyle(0x5c3a20);
  g.fillRect(20, 516, 6, 66);
  g.fillRect(66, 516, 6, 66);
  g.fillRect(20, 514, 52, 6);
  // Door number — 14 (apartment building)
  g.fillStyle(0x8a6030);
  g.fillRect(42, 522, 4, 4);
  g.fillRect(50, 522, 4, 4);

  // ── HARBOR DIRECTION — right edge (implies open water) ─────────────────────
  // Dark blue-gray color suggesting waterfront
  g.fillStyle(0x0e1420);
  g.fillRect(1520, 350, 80, 500);
  g.fillStyle(0x0a1018);
  g.fillRect(1560, 380, 40, 440);

  // Harbor-side sign — radioactive warning (Post Apocalyptic pack sprites)
  scene.add.image(1490, 466, 'sign_base').setScale(2).setDepth(3);      // pole (16×32 → 32×64)
  scene.add.image(1490, 438, 'sign_radioact').setScale(2).setDepth(3);  // sign face (16×16 → 32×32)

  // ── CHECKPOINT BARRIER — near right edge ────────────────────────────────────
  // Post Apocalyptic pack barrier sprites (16×16, scale ×2 = 32×32)
  const barrierX = CHECKPOINT_X - 40;
  let useRed = true;
  for (let by = CHECKPOINT_Y_TOP; by < CHECKPOINT_Y_BOT; by += 32) {
    scene.add.image(barrierX + 8, by + 16, useRed ? 'prop_barrier_red' : 'prop_barrier_yel')
      .setScale(2).setDepth(3);
    useRed = !useRed;
  }
  // Horizontal crossbar (kept as graphic)
  g.fillStyle(0xcc6600);
  g.fillRect(barrierX - 10, 540, 80, 8);
  g.fillStyle(0x222200);
  g.fillRect(barrierX - 8, 542, 76, 4);

  // ── STREET PROP DRESSING ─────────────────────────────────────────────────────
  // Trash cans along north sidewalk (scale ×2 = 32×32 or 32×64)
  const northTrashXs = [200, 490, 760, 1050, 1400];
  for (let i = 0; i < northTrashXs.length; i++) {
    const tx = northTrashXs[i]!;
    const trashKey = i % 3 === 1 ? 'prop_trash2' : i % 3 === 2 ? 'prop_trash3' : 'prop_trash1';
    scene.add.image(tx, 390, trashKey).setScale(2).setDepth(3);
  }
  // Trash cans along south sidewalk
  const southTrashXs = [350, 650, 950, 1250];
  for (let i = 0; i < southTrashXs.length; i++) {
    const tx = southTrashXs[i]!;
    const trashKey = i % 2 === 0 ? 'prop_trash1' : 'prop_trash2';
    scene.add.image(tx, 814, trashKey).setScale(2).setDepth(3);
  }

  // Barrels near checkpoint approach
  scene.add.image(1340, 468, 'prop_barrel').setScale(2).setDepth(3);
  scene.add.image(1340, 714, 'prop_barrel').setScale(2).setDepth(3);
  scene.add.image(1370, 540, 'prop_crate').setScale(2).setDepth(3);
  scene.add.image(1370, 640, 'prop_crate').setScale(2).setDepth(3);

  // Traffic cones mid-street (abandoned road work)
  scene.add.image(440, 458, 'prop_cone').setScale(2).setDepth(3);
  scene.add.image(790, 705, 'prop_cone').setScale(2).setDepth(3);
  scene.add.image(1130, 462, 'prop_cone').setScale(2).setDepth(3);

  // Danger sign at scene entrance, stop sign near checkpoint
  scene.add.image(200, 374, 'sign_base').setScale(2).setDepth(3);
  scene.add.image(200, 346, 'sign_danger').setScale(2).setDepth(3);
  scene.add.image(1200, 374, 'sign_base').setScale(2).setDepth(3);
  scene.add.image(1200, 346, 'sign_stop').setScale(2).setDepth(3);

  // ── GROUND DETAILS — distant background blocks ───────────────────────────────
  // Upper map area (above north buildings) — featureless dark suggesting sky / rubble
  g.fillStyle(0x0e0e0e);
  g.fillRect(0, 0, MAP_W, 60);
  // Lower map area
  g.fillStyle(0x0c0c0c);
  g.fillRect(0, MAP_H - 60, MAP_W, 60);
}

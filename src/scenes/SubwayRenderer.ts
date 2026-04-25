import Phaser from 'phaser';

// ─── Layout constants ──────────────────────────────────────────────────────
export const MAP_W          = 800;
export const MAP_H          = 600;
export const PLAYER_START_X = 60;
export const PLAYER_START_Y = 360;
export const MAYA_X         = 660;
export const MAYA_Y         = 340;
export const EXIT_X         = 80;
export const EXIT_Y_TOP     = 280;
export const EXIT_Y_BOT     = 440;

/** NPC spawn positions for the survivor cell. Dialogue lines live in src/data/dialogue/subway.json. */
export const SURVIVOR_NPCS = [
  { x: 280, y: 280 },
  { x: 400, y: 420 },
  { x: 520, y: 300 },
] as const;

/**
 * Draws the Red Line Tunnels safe house.
 * Underground, dim, makeshift. Survivors live here.
 */
export function drawSubway(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  // ── Tunnel walls and floor ──────────────────────────────────────────────
  // Ceiling
  g.fillStyle(0x0d0d0d);
  g.fillRect(0, 0, MAP_W, 180);

  // Floor
  g.fillStyle(0x1a1410);
  g.fillRect(0, 180, MAP_W, MAP_H - 180);

  // Concrete floor pattern
  g.fillStyle(0x1e1814);
  for (let x = 0; x < MAP_W; x += 60) {
    g.fillRect(x, 460, 58, 140);
  }

  // Tunnel walls (dark strip at top and bottom)
  g.fillStyle(0x111111);
  g.fillRect(0, 0, MAP_W, 20);
  g.fillRect(0, MAP_H - 20, MAP_W, 20);

  // ── Ceiling pipes ───────────────────────────────────────────────────────
  g.lineStyle(3, 0x333333);
  g.lineBetween(0, 40, MAP_W, 40);
  g.lineBetween(0, 60, MAP_W, 60);
  g.lineStyle(2, 0x2a2a2a);
  g.lineBetween(0, 80, 500, 80);
  g.lineBetween(550, 75, MAP_W, 75);

  // Pipe brackets
  g.fillStyle(0x444444);
  for (let x = 100; x < MAP_W; x += 180) {
    g.fillRect(x - 2, 35, 4, 50);
  }

  // ── Flickering amber lights ─────────────────────────────────────────────
  const lightPositions = [150, 380, 600];
  for (const lx of lightPositions) {
    // Light fixture
    g.fillStyle(0x555555);
    g.fillRect(lx - 6, 90, 12, 8);

    // Light cone (amber glow on floor)
    g.fillStyle(0x332200, 0.15);
    g.fillTriangle(lx - 80, 460, lx + 80, 460, lx, 100);

    // Light bulb
    g.fillStyle(0xcc8822, 0.7);
    g.fillRect(lx - 3, 98, 6, 6);
  }

  // ── Makeshift camp furniture ────────────────────────────────────────────
  // Sleeping bags (thin colored rectangles on ground)
  const sleepingBags: Array<[number, number, number]> = [
    [200, 440, 0x334455],
    [240, 450, 0x443344],
    [520, 430, 0x335544],
  ];
  for (const [sx, sy, color] of sleepingBags) {
    g.fillStyle(color);
    g.fillRect(sx, sy, 40, 16);
  }

  // Table (supply station)
  g.fillStyle(0x3d2b1a);
  g.fillRect(340, 340, 70, 30);
  // Items on table
  g.fillStyle(0x556655);
  g.fillRect(345, 342, 12, 10);
  g.fillStyle(0x665544);
  g.fillRect(365, 344, 16, 8);
  g.fillStyle(0x445566);
  g.fillRect(390, 343, 10, 10);

  // Crates
  g.fillStyle(0x2d2010);
  g.fillRect(100, 380, 30, 24);
  g.fillRect(140, 370, 26, 30);
  g.lineStyle(1, 0x3d3020);
  g.strokeRect(100, 380, 30, 24);
  g.strokeRect(140, 370, 26, 30);

  // ── Left entrance (subway tunnel opening) ──────────────────────────────
  // Tunnel mouth (wider, fully black opening)
  g.fillStyle(0x000000);
  g.fillRect(0, EXIT_Y_TOP - 40, 80, EXIT_Y_BOT - EXIT_Y_TOP + 80);
  // Tunnel arch highlight
  g.lineStyle(3, 0x556677, 0.9);
  g.strokeRect(0, EXIT_Y_TOP - 40, 80, EXIT_Y_BOT - EXIT_Y_TOP + 80);
  // Glowing amber border to draw the eye
  g.lineStyle(2, 0xcc8822, 0.6);
  g.strokeRect(4, EXIT_Y_TOP - 36, 72, EXIT_Y_BOT - EXIT_Y_TOP + 72);

  // Arrow hint (larger, brighter)
  g.fillStyle(0xcc8822, 0.95);
  g.fillTriangle(60, 360, 30, 340, 30, 380);
  g.fillStyle(0xcc8822, 0.95);
  g.fillRect(60, 354, 14, 12);

  // "EXIT" label above tunnel
  scene.add.text(40, EXIT_Y_TOP - 56, 'EXIT', {
    fontFamily: 'monospace', fontSize: '14px', color: '#ffcc66',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(8);

  // ── Old subway signage ─────────────────────────────────────────────────
  g.fillStyle(0x880000, 0.4);
  g.fillRect(680, 190, 80, 20);

  // ── Maya's corner — slightly lit ───────────────────────────────────────
  g.fillStyle(0x1a2020, 0.4);
  g.fillRect(620, 280, 140, 120);
  // Her workbench
  g.fillStyle(0x2a3a3a);
  g.fillRect(700, 310, 50, 20);
  // Wires / components on bench
  g.lineStyle(1, 0x44aaaa, 0.5);
  g.lineBetween(705, 315, 740, 325);
  g.lineBetween(710, 320, 745, 318);
}

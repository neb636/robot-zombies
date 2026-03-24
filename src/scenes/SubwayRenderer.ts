import Phaser from 'phaser';

// ─── Layout constants ──────────────────────────────────────────────────────
export const MAP_W          = 800;
export const MAP_H          = 600;
export const PLAYER_START_X = 60;
export const PLAYER_START_Y = 360;
export const MAYA_X         = 660;
export const MAYA_Y         = 340;
export const EXIT_X         = 40;
export const EXIT_Y_TOP     = 300;
export const EXIT_Y_BOT     = 420;

/** NPC positions for the survivor cell. */
export const SURVIVOR_NPCS = [
  { x: 280, y: 280, line: "Another one? From topside?" },
  { x: 400, y: 420, line: 'Keep your voice down.' },
  { x: 520, y: 300, line: "We don't go above street level after dark." },
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
  g.fillStyle(0x080808);
  g.fillRect(0, EXIT_Y_TOP - 30, 30, EXIT_Y_BOT - EXIT_Y_TOP + 60);
  // Arrow hint
  g.fillStyle(0x334455, 0.5);
  g.fillTriangle(20, 350, 8, 340, 8, 360);

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

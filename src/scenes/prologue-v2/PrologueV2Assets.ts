/**
 * Asset keys and preload helper for the Prologue V2 scene.
 */

export const PV2 = {
  // Floors / walls
  FLOOR_WOOD:    'pv2-floor-wood',
  FLOOR_LIGHT:   'pv2-floor-light',
  WALL_DARK:     'pv2-wall-dark',
  WALL_BROWN:    'pv2-wall-brown',

  // Furniture
  BED:           'pv2-bed',
  NIGHTSTAND:    'pv2-nightstand',
  DESK:          'pv2-desk',
  MONITOR:       'pv2-monitor',
  BOOKSHELF:     'pv2-bookshelf',
  WARDROBE:      'pv2-wardrobe',
  COUCH:         'pv2-couch',
  COFFEE_TABLE:  'pv2-coffee-table',

  // Decorations
  PLANT:         'pv2-plant',
  CLOCK:         'pv2-clock',
  WALL_ART:      'pv2-wall-art',
  POSTER:        'pv2-poster',
  LAMP:          'pv2-lamp',
  RUG:           'pv2-rug',

  // Structure
  DOOR:          'pv2-door',
  WINDOW:        'pv2-window',
} as const;

const BASE = 'assets/sprites/prologue';

export function preloadPrologueV2(scene: Phaser.Scene): void {
  scene.load.image(PV2.FLOOR_WOOD,   `${BASE}/floor_wood.png`);
  scene.load.image(PV2.FLOOR_LIGHT,  `${BASE}/floor_light.png`);
  scene.load.image(PV2.WALL_DARK,    `${BASE}/wall_dark.png`);
  scene.load.image(PV2.WALL_BROWN,   `${BASE}/wall_brown.png`);

  scene.load.image(PV2.BED,          `${BASE}/bed.png`);
  scene.load.image(PV2.NIGHTSTAND,   `${BASE}/nightstand.png`);
  scene.load.image(PV2.DESK,         `${BASE}/desk.png`);
  scene.load.image(PV2.MONITOR,      `${BASE}/monitor.png`);
  scene.load.image(PV2.BOOKSHELF,    `${BASE}/bookshelf.png`);
  scene.load.image(PV2.WARDROBE,     `${BASE}/wardrobe.png`);
  scene.load.image(PV2.COUCH,        `${BASE}/couch.png`);
  scene.load.image(PV2.COFFEE_TABLE, `${BASE}/coffee_table.png`);

  scene.load.image(PV2.PLANT,        `${BASE}/plant.png`);
  scene.load.image(PV2.CLOCK,        `${BASE}/clock.png`);
  scene.load.image(PV2.WALL_ART,     `${BASE}/wall_art.png`);
  scene.load.image(PV2.POSTER,       `${BASE}/poster.png`);
  scene.load.image(PV2.LAMP,         `${BASE}/lamp.png`);
  scene.load.image(PV2.RUG,          `${BASE}/rug.png`);

  scene.load.image(PV2.DOOR,         `${BASE}/door.png`);
  scene.load.image(PV2.WINDOW,       `${BASE}/window.png`);
}

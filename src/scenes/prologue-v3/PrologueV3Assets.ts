/**
 * Asset keys and preload helper for Prologue V3 scenes (bedroom + living room).
 */

export const PV3 = {
  // Floors
  FLOOR_WOOD:    'pv3-floor-wood',
  FLOOR_LIGHT:   'pv3-floor-light',

  // Bedroom furniture
  BED:           'pv3-bed',
  WARDROBE:      'pv3-wardrobe',
  DRESSER:       'pv3-dresser',
  NIGHTSTAND:    'pv3-nightstand',
  DESK:          'pv3-desk',
  DESK_CHAIR:    'pv3-desk-chair',
  MONITOR:       'pv3-monitor',
  BOOKSHELF:     'pv3-bookshelf',

  // Living room furniture
  COUCH:         'pv3-couch',
  ARMCHAIR:      'pv3-armchair',
  TV_STAND:      'pv3-tv-stand',
  CABINET:       'pv3-cabinet',
  COFFEE_TABLE:  'pv3-coffee-table',

  // Decorations
  LAMP:          'pv3-lamp',
  FLOOR_LAMP:    'pv3-floor-lamp',
  WALL_FRAMES:   'pv3-wall-frames',
  SMALL_FRAMES:  'pv3-small-frames',
  PLANT:         'pv3-plant',
  PLANT_TALL:    'pv3-plant-tall',
  RUG_BLUE:      'pv3-rug-blue',
  RUG_GREEN:     'pv3-rug-green',

  // Structure
  DOORWAY:       'pv3-doorway',
  DOOR_WOOD:     'pv3-door-wood',
  WINDOW:        'pv3-window',
  WINDOW_LIGHT:  'pv3-window-light',
} as const;

const BASE = 'assets/sprites/prologue-v3';

export function preloadPrologueV3(scene: Phaser.Scene): void {
  scene.load.image(PV3.FLOOR_WOOD,    `${BASE}/floor_wood.png`);
  scene.load.image(PV3.FLOOR_LIGHT,   `${BASE}/floor_light.png`);

  scene.load.image(PV3.BED,           `${BASE}/bed.png`);
  scene.load.image(PV3.WARDROBE,      `${BASE}/wardrobe.png`);
  scene.load.image(PV3.DRESSER,       `${BASE}/dresser.png`);
  scene.load.image(PV3.NIGHTSTAND,    `${BASE}/nightstand.png`);
  scene.load.image(PV3.DESK,          `${BASE}/desk.png`);
  scene.load.image(PV3.DESK_CHAIR,    `${BASE}/desk_chair.png`);
  scene.load.image(PV3.MONITOR,       `${BASE}/monitor.png`);
  scene.load.image(PV3.BOOKSHELF,     `${BASE}/bookshelf.png`);

  scene.load.image(PV3.COUCH,         `${BASE}/couch.png`);
  scene.load.image(PV3.ARMCHAIR,      `${BASE}/armchair.png`);
  scene.load.image(PV3.TV_STAND,      `${BASE}/tv_stand.png`);
  scene.load.image(PV3.CABINET,       `${BASE}/cabinet.png`);
  scene.load.image(PV3.COFFEE_TABLE,  `${BASE}/coffee_table.png`);

  scene.load.image(PV3.LAMP,          `${BASE}/lamp.png`);
  scene.load.image(PV3.FLOOR_LAMP,    `${BASE}/floor_lamp.png`);
  scene.load.image(PV3.WALL_FRAMES,   `${BASE}/wall_frames.png`);
  scene.load.image(PV3.SMALL_FRAMES,  `${BASE}/small_frames.png`);
  scene.load.image(PV3.PLANT,         `${BASE}/plant.png`);
  scene.load.image(PV3.PLANT_TALL,    `${BASE}/plant_tall.png`);
  scene.load.image(PV3.RUG_BLUE,      `${BASE}/rug_blue.png`);
  scene.load.image(PV3.RUG_GREEN,     `${BASE}/rug_green.png`);

  scene.load.image(PV3.DOORWAY,       `${BASE}/doorway.png`);
  scene.load.image(PV3.DOOR_WOOD,     `${BASE}/door_wood.png`);
  scene.load.image(PV3.WINDOW,        `${BASE}/window.png`);
  scene.load.image(PV3.WINDOW_LIGHT,  `${BASE}/window_light.png`);
}

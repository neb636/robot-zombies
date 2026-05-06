/**
 * Player (hero) art — rotation sprites + action animations + animation
 * metadata. Vite resolves these `import.meta.glob` calls at build time;
 * each `?url` import yields a hashed asset URL string.
 *
 * Cache keys keep the legacy `hero_*` prefix (entities/Player.ts,
 * BattleManager, animation keys like `hero-walking-south`).
 */
import type Phaser from 'phaser';

const ROTATION_GLOBS = import.meta.glob<string>('./assets/rotations/*.png', {
  eager:  true,
  query:  '?url',
  import: 'default',
});

const ANIM_GLOBS = import.meta.glob<string>('./assets/animations/**/*.png', {
  eager:  true,
  query:  '?url',
  import: 'default',
});

const DIRS_8 = [
  'south', 'south-east', 'east', 'north-east',
  'north', 'north-west', 'west', 'south-west',
] as const;
const DIRS_4 = ['south', 'east', 'north', 'west'] as const;

export type PlayerAnimAction =
  | 'walking' | 'running' | 'jumping' | 'crouching' | 'poking';

export interface PlayerAnimationDef {
  /** PixelLab job id used as the on-disk folder name. */
  folder:    string;
  frames:    number;
  dirs:      readonly string[];
  frameRate: number;
  /** Phaser repeat count: -1 = infinite, 0 = play once. */
  repeat:    number;
}

/**
 * Single source of truth for player action animations. Frame counts must
 * match the on-disk `frame_NNN.png` count exactly.
 */
export const PLAYER_ANIMATION_DEFS: Record<PlayerAnimAction, PlayerAnimationDef> = {
  walking:   { folder: 'Walking-b5ada3a1',                                            frames: 6, dirs: DIRS_8, frameRate: 10, repeat: -1 },
  running:   { folder: 'Running-4263a14a',                                            frames: 6, dirs: DIRS_8, frameRate: 14, repeat: -1 },
  jumping:   { folder: 'Jumping-3b85dd59',                                            frames: 9, dirs: DIRS_8, frameRate: 12, repeat:  0 },
  crouching: { folder: 'Crouching-b9994c7c',                                          frames: 5, dirs: DIRS_4, frameRate:  8, repeat: -1 },
  poking:    { folder: 'poke_someone._similar_to_punching_but_less_violent-ebf05df7', frames: 4, dirs: DIRS_4, frameRate: 10, repeat:  0 },
};

/**
 * Cache-key → URL map for the 8-direction rotation sprites.
 * Key shape: `hero_<dir>` (e.g. `hero_south`, `hero_north-east`).
 */
export const PLAYER_ROTATION_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(ROTATION_GLOBS)) {
    // path: ./assets/rotations/south.png
    const m = path.match(/^\.\/assets\/rotations\/([^.]+)\.png$/);
    if (m && m[1]) out[`hero_${m[1]}`] = url;
  }
  return out;
})();

/**
 * Cache-key → URL map for action animation frames.
 * Key shape: `hero_<action>_<dir>_<frameIdx>` (e.g. `hero_walking_south_0`).
 *
 * The on-disk folder is the long PixelLab job id; this map normalizes the
 * action prefix to the friendly name used by the rest of the engine.
 */
export const PLAYER_ANIM_URLS: Record<string, string> = (() => {
  const folderToAction: Record<string, PlayerAnimAction> = {};
  for (const [action, def] of Object.entries(PLAYER_ANIMATION_DEFS) as Array<[PlayerAnimAction, PlayerAnimationDef]>) {
    folderToAction[def.folder] = action;
  }
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(ANIM_GLOBS)) {
    // path: ./assets/animations/<folder>/<dir>/frame_NNN.png
    const m = path.match(/^\.\/assets\/animations\/([^/]+)\/([^/]+)\/frame_(\d+)\.png$/);
    if (!m || !m[1] || !m[2] || !m[3]) continue;
    const action = folderToAction[m[1]];
    if (action === undefined) continue;
    const frameIdx = parseInt(m[3], 10);
    out[`hero_${action}_${m[2]}_${frameIdx}`] = url;
  }
  return out;
})();

/** Phaser preload helper — registers all player sprites with the loader. */
export function preloadPlayerAssets(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(PLAYER_ROTATION_URLS)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
  for (const [key, url] of Object.entries(PLAYER_ANIM_URLS)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}

/**
 * Cross-scene character art (rotation sprites + animations).
 *
 * Loaded once by `_core/preload/PreloadScene` and accessed via cache keys
 * `<character>_<dir>` for static rotations, `hero_<action>_<dir>_<frame>` for
 * hero animations.
 *
 * Vite resolves these `import.meta.glob` calls at build time; each `?url`
 * import yields a hashed asset URL string.
 */
const ROTATION_GLOBS = import.meta.glob<string>('./*/rotations/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const HERO_ANIM_GLOBS = import.meta.glob<string>('./hero/animations/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * Map of cache-key → URL for static character rotation sprites.
 * Key shape: `<character>_<dir>` (e.g. `hero_south`, `maya_north-east`).
 */
export const CHARACTER_ROTATION_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(ROTATION_GLOBS)) {
    // path: ./hero/rotations/south.png
    const m = path.match(/^\.\/([^/]+)\/rotations\/([^.]+)\.png$/);
    if (!m) continue;
    out[`${m[1]}_${m[2]}`] = url;
  }
  return out;
})();

/**
 * Map of cache-key → URL for hero action animation frames.
 * Key shape: `hero_<action>_<dir>_<frameIdx>` (e.g. `hero_walking_south_0`).
 *
 * The action folder name is the long PixelLab job id (e.g.
 * `Walking-b5ada3a1`); this map normalizes the action prefix to match the
 * key shape PreloadScene expects. Callers must supply an ACTION_FOLDERS map
 * to translate back from the cache-key action name to the on-disk folder.
 */
export type HeroAnimAction = 'walking' | 'running' | 'jumping' | 'crouching' | 'poking';

export const HERO_ANIM_FOLDERS: Record<HeroAnimAction, string> = {
  walking:   'Walking-b5ada3a1',
  running:   'Running-4263a14a',
  jumping:   'Jumping-3b85dd59',
  crouching: 'Crouching-b9994c7c',
  poking:    'poke_someone._similar_to_punching_but_less_violent-ebf05df7',
};

export function heroAnimUrl(action: HeroAnimAction, dir: string, frameIdx: number): string | undefined {
  const folder = HERO_ANIM_FOLDERS[action];
  const f = frameIdx.toString().padStart(3, '0');
  const path = `./hero/animations/${folder}/${dir}/frame_${f}.png`;
  return HERO_ANIM_GLOBS[path];
}

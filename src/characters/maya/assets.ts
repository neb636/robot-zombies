/**
 * Maya art — rotation sprites only. Vite resolves the `import.meta.glob`
 * call at build time; each `?url` import yields a hashed asset URL string.
 *
 * Cache keys use the `maya_*` prefix (the legacy 4-direction walk/idle
 * aliases registered in PreloadScene pull from this rotation sheet).
 */
import type Phaser from 'phaser';

const ROTATION_GLOBS = import.meta.glob<string>('./assets/rotations/*.png', {
  eager:  true,
  query:  '?url',
  import: 'default',
});

/**
 * Cache-key → URL map for Maya's rotation sprites.
 * Key shape: `maya_<dir>` (e.g. `maya_south`, `maya_north-east`).
 */
export const MAYA_ROTATION_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(ROTATION_GLOBS)) {
    const m = path.match(/^\.\/assets\/rotations\/([^.]+)\.png$/);
    if (m && m[1]) out[`maya_${m[1]}`] = url;
  }
  return out;
})();

/** Phaser preload helper — registers Maya's sprites with the loader. */
export function preloadMayaAssets(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(MAYA_ROTATION_URLS)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}

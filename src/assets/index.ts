/**
 * Cross-scene asset URL maps. These are loaded globally by
 * `_core/preload/PreloadScene` because they're used across multiple scenes
 * (party characters travel; UI and audio are scene-agnostic).
 *
 * Scene-specific assets live in `src/scenes/<chapter>/<scene>/assets/`
 * with a sibling `assets.ts` that exports their URL maps.
 */
export * from './characters/index.js';
export * from './world/index.js';

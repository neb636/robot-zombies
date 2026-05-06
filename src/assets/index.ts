/**
 * Cross-scene asset URL maps for assets that aren't tied to a single
 * feature folder (currently just the world tilemap).
 *
 * Scene-specific assets live in `src/scenes/<chapter>/<scene>/assets/`
 * with a sibling `assets.ts`. Character art is colocated with each
 * character's definition: `src/characters/<name>/assets/` + sibling
 * `assets.ts`.
 */
export * from './world/index.js';

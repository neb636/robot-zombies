/**
 * Chapter 3 — Great Plains scene bundle.
 *
 * Scenes (in story order):
 *   1. OpenHighwayScene   — Kansas highway, Aerial Sentinels, stealth movement
 *   2. HarvestTownScene   — Voluntary conversion settlement; Marcus beat; Cora/Child choices
 *   3. StormCorridorScene — Tornado; Warden Six return (SIX_BEATEN_CH3)
 *   4. RadioTowerScene    — Jerome recruitment; Ghost reveal; Sentinel Spire boss; Sam cameo; Tilly scene
 *
 * Register these in src/config.ts to wire into the scene list.
 * (Per constraint: this file does NOT edit config.ts — caller must do so.)
 */

import Phaser from 'phaser';
import { OpenHighwayScene }   from './OpenHighwayScene.js';
import { HarvestTownScene }   from './HarvestTownScene.js';
import { StormCorridorScene } from './StormCorridorScene.js';
import { RadioTowerScene }    from './RadioTowerScene.js';

export { OpenHighwayScene, HarvestTownScene, StormCorridorScene, RadioTowerScene };
export { CH3_FLAGS } from './HarvestTownScene.js';

/** Alias used by src/config.ts aggregator. */
export const CHAPTER3_SCENES: Phaser.Types.Scenes.SceneType[] = [
  OpenHighwayScene,
  HarvestTownScene,
  StormCorridorScene,
  RadioTowerScene,
];

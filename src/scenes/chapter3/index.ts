/**
 * Chapter 3 — Great Plains scene bundle.
 *
 * Scenes (in story order):
 *   1. OpenHighwayScene   — Kansas highway, Aerial Sentinels, stealth movement
 *   2. HarvestTownScene   — Voluntary conversion settlement; Marcus beat; Cora/Child choices
 *   3. StormCorridorScene — Tornado; Warden Six return (SIX_BEATEN_CH3)
 *   4. RadioTowerScene    — Jerome recruitment; Ghost reveal; Sentinel Spire boss; Sam cameo; Tilly scene
 */

import Phaser from 'phaser';
import { OpenHighwayScene }   from './openHighway/OpenHighwayScene.js';
import { HarvestTownScene }   from './harvestTown/HarvestTownScene.js';
import { StormCorridorScene } from './stormCorridor/StormCorridorScene.js';
import { RadioTowerScene }    from './radioTower/RadioTowerScene.js';

export { OpenHighwayScene, HarvestTownScene, StormCorridorScene, RadioTowerScene };
export { CH3_FLAGS } from './harvestTown/HarvestTownScene.js';

export const CHAPTER3_SCENES: Phaser.Types.Scenes.SceneType[] = [
  OpenHighwayScene,
  HarvestTownScene,
  StormCorridorScene,
  RadioTowerScene,
];

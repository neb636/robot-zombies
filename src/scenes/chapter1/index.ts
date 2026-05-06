/**
 * Chapter 1 scene bundle — Appalachia.
 *
 * Scene flow:
 *   BlueRidgePassageScene → RidgeCampScene → HarlanMineScene → MountainPassScene → WorldMapScene
 */

export { BlueRidgePassageScene } from './blueRidgePassage/BlueRidgePassageScene.js';
export { RidgeCampScene }        from './ridgeCamp/RidgeCampScene.js';
export { HarlanMineScene }       from './harlanMine/HarlanMineScene.js';
export { MountainPassScene }     from './mountainPass/MountainPassScene.js';

import { BlueRidgePassageScene } from './blueRidgePassage/BlueRidgePassageScene.js';
import { RidgeCampScene }        from './ridgeCamp/RidgeCampScene.js';
import { HarlanMineScene }       from './harlanMine/HarlanMineScene.js';
import { MountainPassScene }     from './mountainPass/MountainPassScene.js';

/** All Chapter 1 scene classes in flow order. */
export const CHAPTER1_SCENES = [
  BlueRidgePassageScene,
  RidgeCampScene,
  HarlanMineScene,
  MountainPassScene,
] as const;

/**
 * Chapter 1 scene bundle — Appalachia.
 *
 * Exported as CHAPTER1_SCENES for registration in src/config.ts (done by orchestrator).
 * Scene flow:
 *   BlueRidgePassageScene → RidgeCampScene → HarlanMineScene → MountainPassScene → WorldMapScene
 */

export { BlueRidgePassageScene } from './BlueRidgePassageScene.js';
export { RidgeCampScene }        from './RidgeCampScene.js';
export { HarlanMineScene }       from './HarlanMineScene.js';
export { MountainPassScene }     from './MountainPassScene.js';

import { BlueRidgePassageScene } from './BlueRidgePassageScene.js';
import { RidgeCampScene }        from './RidgeCampScene.js';
import { HarlanMineScene }       from './HarlanMineScene.js';
import { MountainPassScene }     from './MountainPassScene.js';

/** All Chapter 1 scene classes in flow order. */
export const CHAPTER1_SCENES = [
  BlueRidgePassageScene,
  RidgeCampScene,
  HarlanMineScene,
  MountainPassScene,
] as const;

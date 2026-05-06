/**
 * Chapter 4 — "Above the Cloud"
 * Region: Colorado Rockies / Utah Desert
 *
 * Scene order:
 *   HighAltitudeCampScene → GhostTownScene → HermitsPeakScene → ThePassScene
 */

import Phaser from 'phaser';
import { HighAltitudeCampScene } from './highAltitudeCamp/HighAltitudeCampScene.js';
import { GhostTownScene }        from './ghostTown/GhostTownScene.js';
import { HermitsPeakScene }      from './hermitsPeak/HermitsPeakScene.js';
import { ThePassScene }          from './thePass/ThePassScene.js';

export { HighAltitudeCampScene, GhostTownScene, HermitsPeakScene, ThePassScene };

export const CHAPTER4_SCENES: Phaser.Types.Scenes.SceneType[] = [
  HighAltitudeCampScene,
  GhostTownScene,
  HermitsPeakScene,
  ThePassScene,
];

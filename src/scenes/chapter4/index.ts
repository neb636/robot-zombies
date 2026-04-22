/**
 * Chapter 4 — "Above the Cloud"
 * Region: Colorado Rockies / Utah Desert
 *
 * Scene order:
 *   HighAltitudeCampScene → GhostTownScene → HermitsPeakScene → ThePassScene
 *
 * Critical beats:
 *   - Altitude sickness: –10% stats on first entry until rested (HighAltitudeCampScene)
 *   - Echo subplot: optional Converted NPC (HighAltitudeCampScene, requires DR_CHEN_RECRUITED)
 *   - Ghost Town: story-only, no combat. Three journals + morale event (GhostTownScene)
 *   - Dr. Chen recruitment: PartyManager.addMember('drchen', 4) (HermitsPeakScene)
 *   - Gate Colossus boss: 3-phase BossConfig fight (ThePassScene, Room 3)
 *   - Deja loss: permanent. Bad luck. Sets DEJA_LOST + SMOKE_LOST (ThePassScene, Room 4)
 *
 * Scenes are NOT registered in config.ts by this file — the constraint says
 * "don't edit config.ts". Add scenes to config.ts when integrating Ch.4 into
 * the full scene list.
 */

import Phaser from 'phaser';
import { HighAltitudeCampScene } from './HighAltitudeCampScene.js';
import { GhostTownScene }        from './GhostTownScene.js';
import { HermitsPeakScene }      from './HermitsPeakScene.js';
import { ThePassScene }          from './ThePassScene.js';

export { HighAltitudeCampScene, GhostTownScene, HermitsPeakScene, ThePassScene };

/** Alias used by src/config.ts aggregator. */
export const CHAPTER4_SCENES: Phaser.Types.Scenes.SceneType[] = [
  HighAltitudeCampScene,
  GhostTownScene,
  HermitsPeakScene,
  ThePassScene,
];

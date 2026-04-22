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

export { HighAltitudeCampScene } from './HighAltitudeCampScene.js';
export { GhostTownScene }        from './GhostTownScene.js';
export { HermitsPeakScene }      from './HermitsPeakScene.js';
export { ThePassScene }          from './ThePassScene.js';

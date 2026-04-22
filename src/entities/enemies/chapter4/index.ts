/**
 * Chapter 4 enemies — Rockies / Utah Desert.
 *
 * Enemy stat configurations for use in BattleScene init data.
 * The global Enemy class in src/entities/Enemy.ts resolves 'gate_colossus' from
 * its internal BOSS_CONFIGS map (already registered there).
 *
 * blockade_sentry and desert_scavenger configs are exported here for scenes
 * that want to pass custom stat overrides into the Enemy constructor.
 */

export { GATE_COLOSSUS_KEY, GATE_COLOSSUS_BOSS_CONFIG } from './gateColossus.js';
export { BLOCKADE_SENTRY_KEY, BLOCKADE_SENTRY_CONFIG }  from './blockadeSentry.js';
export { DESERT_SCAVENGER_KEY, DESERT_SCAVENGER_CONFIG } from './desertScavenger.js';

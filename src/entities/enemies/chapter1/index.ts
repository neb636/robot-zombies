/**
 * Chapter 1 enemy aggregator.
 * Exports all enemy definitions used in the Appalachian chapter.
 * The Enemy.ts BOSS_CONFIGS map uses string keys — these defs document
 * the canonical shapes so scenes can reference them without duplicating data.
 */

export { EXCAVATOR_PRIME_DEF, EXCAVATOR_PRIME_KEY, EXCAVATOR_PRIME_PHASES } from './excavatorPrime.js';
export { WARDEN_SIX_DEF, WARDEN_SIX_KEY, SIX_BEATEN_CH1_FLAG }            from './wardenSixCh1.js';
export { COMPLIANCE_SWARM_DEF, COMPLIANCE_SWARM_KEY }                       from './complianceSwarm.js';

/**
 * All Chapter 1 enemy keys — useful for registering configs or iterating.
 */
export const CHAPTER1_ENEMY_KEYS = [
  'excavator_prime',
  'warden_six_ch1',
  'compliance_swarm',
] as const;

export type Chapter1EnemyKey = typeof CHAPTER1_ENEMY_KEYS[number];

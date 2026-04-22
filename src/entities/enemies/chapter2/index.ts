/**
 * Chapter 2 — Deep South enemy aggregator.
 * Import from this file to reference any Ch.2 enemy config.
 */
import { GOVERNOR_CONFIG }        from './theGovernor.js';
import { BRIDGE_ENFORCER_CONFIG } from './bridgeEnforcer.js';
import { BAYOU_SWIMMER_CONFIG }   from './bayouSwimmer.js';
import type { EnemyConfigMap }    from '../types.js';

export { GOVERNOR_CONFIG, BRIDGE_ENFORCER_CONFIG, BAYOU_SWIMMER_CONFIG };

/** Aggregated registry map consumed by src/entities/enemies/index.ts. */
export const CHAPTER2_ENEMIES: EnemyConfigMap = {
  the_governor:     GOVERNOR_CONFIG,
  bridge_enforcer:  BRIDGE_ENFORCER_CONFIG,
  bayou_swimmer:    BAYOU_SWIMMER_CONFIG,
};

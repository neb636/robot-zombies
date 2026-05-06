/**
 * Chapter 3 enemy bundle.
 */
import { AERIAL_SENTINEL_DEF }   from './aerialSentinel.js';
import { SENTINEL_SPIRE_DEF, SENTINEL_SPIRE_PHASES } from './sentinelSpire.js';
import { WARDEN_SIX_CH3_DEF, WARDEN_SIX_CH3_PHASES } from './wardenSixCh3.js';
import { CONVERTED_CITIZEN_DEF } from './convertedCitizen.js';
import type { EnemyConfig, EnemyConfigMap, EnemyTier } from '../types.js';

export { AERIAL_SENTINEL_DEF, SENTINEL_SPIRE_DEF, SENTINEL_SPIRE_PHASES,
         WARDEN_SIX_CH3_DEF, WARDEN_SIX_CH3_PHASES, CONVERTED_CITIZEN_DEF };
export type { Ch3EnemyDef } from './aerialSentinel.js';
export type { SpirePhase }  from './sentinelSpire.js';

interface Ch3Shape {
  name: string;
  hp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
  tags: readonly import('../../../types.js').EnemyTag[];
  width: number;
  height: number;
  color: number;
  taunts?: readonly string[];
  tier?: EnemyTier;
}

function adapt(def: Ch3Shape, tier: EnemyTier = 'enforcer'): EnemyConfig {
  return {
    name:   def.name,
    hp:     def.hp,
    str:    def.str,
    def:    def.def,
    int:    def.int,
    spd:    def.spd,
    lck:    def.lck,
    tags:   def.tags,
    tier:   def.tier ?? tier,
    width:  def.width,
    height: def.height,
    color:  def.color,
    taunts: def.taunts ?? [],
  };
}

/** Aggregated registry map consumed by src/entities/enemies/index.ts. */
export const CHAPTER3_ENEMIES: EnemyConfigMap = {
  aerial_sentinel:   adapt(AERIAL_SENTINEL_DEF as unknown as Ch3Shape, 'sentinel'),
  sentinel_spire:    adapt(SENTINEL_SPIRE_DEF as unknown as Ch3Shape, 'boss'),
  warden_six_ch3:    adapt(WARDEN_SIX_CH3_DEF as unknown as Ch3Shape, 'boss'),
  converted_citizen: adapt(CONVERTED_CITIZEN_DEF as unknown as Ch3Shape, 'converted'),
};

import type { EnemyTag } from '../../../types.js';

/** Stats for the Excavator Prime — Ch.1 boss (Harlan Mine, floor 4). */
export const EXCAVATOR_PRIME_KEY = 'excavator_prime' as const;

export interface EnemyBossEntry {
  key: string;
  name: string;
  hp: number;
  atk: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
  tags: readonly EnemyTag[];
  tier: 'boss';
  width: number;
  height: number;
  color: number;
  taunts: readonly string[];
}

/**
 * Excavator Prime — massive mining bot repurposed as guardian.
 * Two-phase boss: phase 1 at 60% HP, phase 2 at 30% HP.
 * Tags: Electronic + Armored → EMP deals 1.5×, Fire 1.3×, Physical 0.7×.
 */
export const EXCAVATOR_PRIME_DEF: EnemyBossEntry = {
  key:    EXCAVATOR_PRIME_KEY,
  name:   'EXCAVATOR PRIME',
  hp:     480,
  atk:    28,
  str:    28,
  def:    18,
  int:    4,
  spd:    5,
  lck:    4,
  tags:   ['Electronic', 'Armored'],
  tier:   'boss',
  width:  80,
  height: 96,
  color:  0x7a5533,
  taunts: [
    'MINERAL EXTRACTION PROCEEDING. INTRUDERS RECLASSIFIED AS ORE.',
    'YIELD QUOTA UNAFFECTED. ADDING YOUR MASS TO CALCULATIONS.',
    'RESISTANCE IS STATISTICALLY NEGLIGIBLE.',
    'INITIATING DEEP EXCAVATION PROTOCOL.',
  ],
};

/**
 * BossPhase entries for use in BattleInitData.bossConfig.phases.
 * Phase 1 triggers at 60% HP — extended drill array, +8 ATK.
 * Phase 2 triggers at 30% HP — overdrive mode, +14 ATK total.
 */
export const EXCAVATOR_PRIME_PHASES = [
  {
    hpThreshold: 0.6,
    atkBoost:    8,
    dialogue:    [
      'EFFICIENCY THRESHOLD EXCEEDED.',
      'ACTIVATING SECONDARY DRILL ARRAY.',
    ],
  },
  {
    hpThreshold: 0.3,
    atkBoost:    6,
    dialogue:    [
      'YOUR RESISTANCE IS MATHEMATICALLY INCOHERENT.',
      'OVERDRIVE PROTOCOL: ENGAGED.',
    ],
  },
] as const;

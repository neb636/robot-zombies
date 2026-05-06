import type { BossConfig } from '../../../types.js';

/**
 * Gate Colossus — titan-class blockade unit guarding the Nevada-California border.
 * Chapter 4 final boss. Three-phase fight.
 *
 * Enemy key for BOSS_CONFIGS in Enemy.ts: 'gate_colossus'
 * (already registered in the global Enemy BOSS_CONFIGS map).
 *
 * Stats:
 *   HP: 680  STR: 38  DEF: 30  INT: 10  SPD: 8  LCK: 6
 *   Tags: Electronic, Armored
 *   Tier: boss
 */
export const GATE_COLOSSUS_KEY = 'gate_colossus' as const;

/**
 * Three-phase BossConfig.
 *
 * Phase triggers (hpThreshold = HP% at which phase activates):
 *   Phase 0 → Phase 1: drops below 70%  (475 HP)
 *   Phase 1 → Phase 2: drops below 40%  (272 HP)
 *   Phase 2 → Phase 3: drops below 15%  (102 HP) — desperate final push
 *
 * Dialogue lines are shown via BossPhaseTransitionState and are intentionally
 * short — the Colossus speaks in system-message fragments, not sentences.
 */
export const GATE_COLOSSUS_BOSS_CONFIG: BossConfig = {
  phases: [
    {
      hpThreshold: 0.70,
      atkBoost:    6,
      dialogue: [
        'THREAT ASSESSMENT: ELEVATED.',
        'RECALIBRATING TARGETING ARRAY.',
        'PASSAGE DENIED.',
      ],
    },
    {
      hpThreshold: 0.40,
      atkBoost:    10,
      dialogue: [
        'CRITICAL SYSTEMS: COMPROMISED.',
        'LOCKDOWN PROTOCOL: ENGAGED.',
        'YOU WILL NOT PASS.',
      ],
    },
    {
      hpThreshold: 0.15,
      atkBoost:    14,
      dialogue: [
        'FINAL MEASURE AUTHORIZED.',
        'BORDER INTEGRITY WILL BE MAINTAINED.',
        'THIS IS NOT A THREAT. THIS IS A FACT.',
      ],
    },
  ],
};

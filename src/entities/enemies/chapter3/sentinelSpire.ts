/**
 * Sentinel Spire — Chapter 3 boss. Atop the Kansas radio tower.
 * Tower-sized broadcast-jamming robot. Electronic/Armored.
 * Three phases: Broadcast Lock, Frequency Surge, Signal Death.
 */

import type { Ch3EnemyDef } from './aerialSentinel.js';

// Sentinel Spire is registered in Enemy.ts BOSS_CONFIGS as 'sentinel_spire'.
// This file provides typed phase config for BossPhaseTransitionState.

export interface SpirePhase {
  hpThreshold: number;
  atkBoost: number;
  dialogue: string[];
}

/** Phase config passed into BattleInitData.bossConfig. */
export const SENTINEL_SPIRE_PHASES: SpirePhase[] = [
  {
    hpThreshold: 0.65,
    atkBoost:    5,
    dialogue: [
      'BROADCAST INTERRUPTED. INITIATING FREQUENCY SURGE.',
      'ALL BANDS. ALL BANDS. SUBMIT.',
    ],
  },
  {
    hpThreshold: 0.30,
    atkBoost:    8,
    dialogue: [
      'SIGNAL INTEGRITY: CRITICAL.',
      'LAST TRANSMISSION: RESISTANCE IS FUTILE.',
      'DEPLOYING FINAL FREQUENCY. COMPLIANCE OR SILENCE.',
    ],
  },
];

/** Enemy definition record — matches Enemy.ts BOSS_CONFIGS shape. */
export const SENTINEL_SPIRE_DEF: Ch3EnemyDef = {
  key:    'sentinel_spire',
  name:   'SENTINEL SPIRE',
  hp:     550,
  str:    24,
  def:    26,
  int:    32,
  spd:    3,
  lck:    8,
  tags:   ['Electronic', 'Armored'],
  color:  0x7a8a8a,
  width:  48,
  height: 96,
  taunts: [
    'BROADCAST SIGNAL: SUBMIT. FREQUENCY: ALL BANDS.',
    'YOU ARE STATIC. I AM THE SIGNAL.',
    'JAMMING RESISTANCE FREQUENCIES. COMPLIANCE IMMINENT.',
    'THE PLAINS HEAR ONLY MY VOICE.',
  ],
};

/**
 * Warden Six — Chapter 3 re-encounter. Storm Corridor.
 * First encountered in Appalachia (Ch.1). Followed the party south, then west.
 * Stronger than original encounter — persistent pursuit has refined its tactics.
 */

import type { Ch3EnemyDef } from './aerialSentinel.js';

export const WARDEN_SIX_CH3_DEF: Ch3EnemyDef = {
  key:    'warden_six_ch3',
  name:   'WARDEN SIX',
  hp:     280,
  str:    26,
  def:    18,
  int:    14,
  spd:    12,
  lck:    10,
  tags:   ['Electronic', 'Armored'],
  color:  0x556677,
  width:  52,
  height: 76,
  taunts: [
    'PURSUIT PROTOCOL: ACTIVE.',
    'SUBJECT RECLASSIFIED: HIGH PRIORITY.',
    'APPALACHIAN ENCOUNTER LOGGED. CORRECTION PENDING.',
    'YOU CANNOT OUTRUN A SYSTEM.',
    'OPTIMAL TERMINATION WINDOW: NOW.',
  ],
};

/**
 * Boss phase config for Warden Six Ch.3.
 * Single phase transition — enraged when below 40% HP.
 */
export const WARDEN_SIX_CH3_PHASES = [
  {
    hpThreshold: 0.40,
    atkBoost:    8,
    dialogue: [
      'DAMAGE THRESHOLD EXCEEDED.',
      'ESCALATING TO PRIORITY PROTOCOL.',
      'SUBJECT WILL NOT ESCAPE AGAIN.',
    ],
  },
];

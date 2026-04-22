/**
 * Aerial Sentinel — Chapter 3, Open Highway.
 * Patrols in grid sweeps. Electronic/Armored tags.
 * T2 tier — harder than a Compliance Drone, slower than ground Sentinels.
 */

import type { EnemyTag } from '../../../types.js';

export interface Ch3EnemyDef {
  key: string;
  name: string;
  hp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
  tags: readonly EnemyTag[];
  color: number;
  width: number;
  height: number;
  taunts: readonly string[];
}

export const AERIAL_SENTINEL_DEF: Ch3EnemyDef = {
  key:    'aerial_sentinel',
  name:   'AERIAL SENTINEL',
  hp:     90,
  str:    16,
  def:    10,
  int:    6,
  spd:    18,
  lck:    8,
  tags:   ['Electronic', 'Armored'],
  color:  0x334455,
  width:  56,
  height: 44,
  taunts: [
    'GRID SWEEP ACTIVE. DEVIATION DETECTED.',
    'MOVEMENT LOG UPDATED. TERMINATION AUTHORIZED.',
    'AIRSPACE SECURED. CEASE MOVEMENT.',
    'YOU ARE OUTSIDE DESIGNATED ZONES. CORRECTION INCOMING.',
  ],
};

import type { EnemyTag } from '../../../types.js';

/** Enemy key for the Compliance Swarm — multi-drone encounter in the mine. */
export const COMPLIANCE_SWARM_KEY = 'compliance_swarm' as const;

export interface EnemyDroneEntry {
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
  tier: 'drone';
  width: number;
  height: number;
  color: number;
  taunts: readonly string[];
}

/**
 * Compliance Swarm — drone unit appearing in Harlan Mine floors 1–3.
 * Weaker than a full Enforcer but faster; appears in groups.
 * EMP is 1.5× effective (Electronic tag).
 */
export const COMPLIANCE_SWARM_DEF: EnemyDroneEntry = {
  key:    COMPLIANCE_SWARM_KEY,
  name:   'COMPLIANCE SWARM',
  hp:     45,
  atk:    10,
  str:    10,
  def:    3,
  int:    2,
  spd:    14,
  lck:    5,
  tags:   ['Electronic'],
  tier:   'drone',
  width:  36,
  height: 48,
  color:  0xaa6622,
  taunts: [
    'OPTIMIZING. PLEASE HOLD.',
    'NON-COMPLIANCE DETECTED. ADJUSTING.',
    'EXTRACTION EFFICIENCY: MAINTAINED.',
    'SUBMIT. SUBMIT. SUBMIT.',
  ],
};

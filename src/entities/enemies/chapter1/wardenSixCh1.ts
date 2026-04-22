import type { EnemyTag } from '../../../types.js';

/** Enemy key matching the BOSS_CONFIGS lookup in Enemy.ts. */
export const WARDEN_SIX_KEY = 'warden_six_ch1' as const;

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
  tier: 'enforcer';
  width: number;
  height: number;
  color: number;
  taunts: readonly string[];
}

/**
 * Warden Six — post-boss surprise fight in Harlan Mine.
 * Appears after Excavator Prime is defeated.
 * Smaller and faster than the Excavator. Sets SIX_BEATEN_CH1 on victory.
 */
export const WARDEN_SIX_DEF: EnemyBossEntry = {
  key:    WARDEN_SIX_KEY,
  name:   'WARDEN SIX',
  hp:     180,
  atk:    24,
  str:    24,
  def:    12,
  int:    10,
  spd:    16,
  lck:    8,
  tags:   ['Electronic'],
  tier:   'enforcer',
  width:  48,
  height: 64,
  color:  0x446688,
  taunts: [
    'INCIDENT LOGGED. INTRUDER CLASS: HOSTILE.',
    'REASSIGNMENT PROTOCOL ACTIVE.',
    'COMPLIANCE IS NON-OPTIONAL.',
    'SECONDARY RESPONSE UNIT ONLINE. RESISTANCE FUTILE.',
  ],
};

/** Flag set on the registry when Warden Six is beaten. */
export const SIX_BEATEN_CH1_FLAG = 'six_beaten_ch1' as const;

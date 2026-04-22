/**
 * Converted Citizen — Chapter 3, Harvest Town.
 * Special enemy type. Attack menu SUPPRESSED.
 * Cure requires medicine >= 2. If insufficient, cure option is disabled.
 * No XP. Curing increments convertedCured in SaveData.
 *
 * NOTE: Attack suppression is enforced in HarvestTownScene / BattleScene
 * by checking enemy tier === 'converted' before rendering the attack option.
 */

import type { Ch3EnemyDef } from './aerialSentinel.js';

export const CONVERTED_CITIZEN_DEF: Ch3EnemyDef = {
  key:    'converted_citizen',
  name:   'CONVERTED CITIZEN',
  hp:     50,
  str:    8,
  def:    4,
  int:    6,
  spd:    8,
  lck:    12,
  tags:   ['Organic'],
  color:  0x667799,
  width:  24,
  height: 40,
  taunts: [
    'Please. It really does stop hurting.',
    'I remember being angry too.',
    'You don\'t have to fight.',
    'Join us. It\'s so much quieter.',
  ],
};

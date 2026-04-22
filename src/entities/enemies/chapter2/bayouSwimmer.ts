import type { EnemyTag } from '../../../types.js';

/**
 * Bayou Swimmer — Chapter 2 bayou encounter.
 * Repurposed SI Inc. aquatic scout unit. Organic chassis, water-adapted.
 * Slower on land, devastating in water. No drone coverage down here.
 *
 * Note: Organic tag means EMP/Hack techs have no bonus multiplier.
 * Fire is effective (1.3×). Physical is standard.
 */
export const BAYOU_SWIMMER_CONFIG = {
  key:    'bayou_swimmer',
  name:   'BAYOU SWIMMER',
  hp:     90,
  str:    22,
  def:    8,
  int:    4,
  spd:    16,
  lck:    6,
  tags:   ['Organic'] as readonly EnemyTag[],
  tier:   'enforcer' as const,
  width:  52,
  height: 36,
  color:  0x226644,
  taunts: [
    'Sensors detect warmth.',
    'Movement optimized for wet terrain.',
    'You are slower in the water.',
    'I am not.',
    '...',
  ],
} as const;

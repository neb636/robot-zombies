import type { EnemyTag } from '../../../types.js';

/**
 * Bridge Enforcer — Chapter 2 standard enemy (Mississippi Crossing).
 * T2 Enforcer variant assigned to the Governor's registry checkpoints.
 * Wired to the registry — can flag player names. Electronic + Armored.
 */
export const BRIDGE_ENFORCER_CONFIG = {
  key:    'bridge_enforcer',
  name:   'BRIDGE ENFORCER',
  hp:     110,
  str:    18,
  def:    14,
  int:    6,
  spd:    8,
  lck:    5,
  tags:   ['Electronic', 'Armored'] as readonly EnemyTag[],
  tier:   'enforcer' as const,
  width:  56,
  height: 72,
  color:  0x334466,
  taunts: [
    'REGISTRY CHECK. STAND BY.',
    'YOUR DESIGNATION IS NOT RECOGNIZED.',
    'CROSSING REQUIRES AUTHORIZATION CLEARANCE LEVEL 2.',
    'COMPLIANCE IS OPTIMAL. RESISTANCE IS LOGGED.',
    'INITIATING HOLD PROTOCOL. DO NOT MOVE.',
  ],
} as const;

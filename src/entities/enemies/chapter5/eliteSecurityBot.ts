/**
 * Elite Security Bot — Chapter 5 standard enemy.
 * SI Inc. campus interior guard. T3 sentinel tier but hardened.
 * Appears throughout MainframeCoreScene in scripted encounters.
 */
export const ELITE_SECURITY_BOT_KEY = 'elite_security_bot' as const;

export const ELITE_SECURITY_BOT_CONFIG = {
  name:   'ELITE SECURITY BOT',
  hp:     140,
  atk:    26,
  str:    26,
  def:    20,
  int:    14,
  spd:    12,
  lck:    8,
  tags:   ['Electronic', 'Armored'] as const,
  tier:   'sentinel' as const,
  width:  52,
  height: 70,
  color:  0x223344,
  taunts: [
    'CAMPUS INTEGRITY: PRIORITY ONE.',
    'YOU HAVE EXCEEDED YOUR AUTHORIZED ACCESS LEVEL.',
    'PACIFICATION PROTOCOL ACTIVE.',
    'THIS IS A RESTRICTED AREA. COMPLY OR BE REMOVED.',
  ],
};

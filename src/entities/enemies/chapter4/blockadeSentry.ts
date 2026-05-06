/**
 * Blockade Sentry — mid-tier Electronic/Armored enemy found throughout The Pass.
 *
 * These are standard patrol units deployed in the Gate Colossus blockade.
 * Encountered in rooms 1–2 of The Pass before the Gate Colossus fight.
 *
 * Enemy key for BOSS_CONFIGS in Enemy.ts: 'blockade_sentry'
 *
 * Stats (T2 Enforcer class):
 *   HP: 130  STR: 22  DEF: 18  INT: 6  SPD: 9  LCK: 5
 *   Tags: Electronic, Armored
 *   Tier: enforcer
 *
 * Taunts are clipped and procedural — sentries communicate status, not sentiment.
 */
export const BLOCKADE_SENTRY_KEY = 'blockade_sentry' as const;

export const BLOCKADE_SENTRY_CONFIG = {
  name:   'BLOCKADE SENTRY',
  hp:     130,
  atk:    22,
  str:    22,
  def:    18,
  int:    6,
  spd:    9,
  lck:    5,
  tags:   ['Electronic', 'Armored'] as const,
  tier:   'enforcer' as const,
  width:  52,
  height: 70,
  color:  0x334466,
  taunts: [
    'PASSAGE DENIED.',
    'INTRUDER CLASSIFIED: HOSTILE.',
    'BORDER PROTOCOL: ACTIVE.',
    'COMPLIANCE REQUIRED.',
    'ROUTE BLOCKED. RETURN TO ORIGIN POINT.',
  ] as const,
} as const;

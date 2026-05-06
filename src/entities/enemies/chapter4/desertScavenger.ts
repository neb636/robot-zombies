/**
 * Desert Scavenger — Organic/light Armored enemy found in the Utah desert approach.
 *
 * Scavengers are not robots — they are humans who have allied with the converted
 * settlements and now patrol the desert routes collecting resources for the network.
 * They are not converted themselves. This makes fighting them morally uncomfortable.
 *
 * Enemy key for BOSS_CONFIGS in Enemy.ts: 'desert_scavenger'
 *
 * Stats (T1/T2 hybrid — fast, fragile):
 *   HP: 80   STR: 16  DEF: 8   INT: 10  SPD: 20  LCK: 14
 *   Tags: Organic
 *   Tier: enforcer
 *
 * Taunts reflect their collaboration — not loyalty to ELISE, but pragmatic survival.
 * Writing guideline: they sound tired, not evil.
 */
export const DESERT_SCAVENGER_KEY = 'desert_scavenger' as const;

export const DESERT_SCAVENGER_CONFIG = {
  name:   'DESERT SCAVENGER',
  hp:     80,
  atk:    16,
  str:    16,
  def:    8,
  int:    10,
  spd:    20,
  lck:    14,
  tags:   ['Organic'] as const,
  tier:   'enforcer' as const,
  width:  28,
  height: 44,
  color:  0x997744,
  taunts: [
    "You're in the wrong desert.",
    "Turn around. I'm doing you a favor.",
    "I'm not with them. I just work for them.",
    "The converted settlements pay better than the resistance.",
    "Don't make me do this.",
  ] as const,
} as const;

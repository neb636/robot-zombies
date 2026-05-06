import type { EnemyTag } from '../../../types.js';

/**
 * The Governor — Chapter 2 boss. Human collaborator.
 * No Electronic tags — cannot be hacked or EMP'd.
 * Fights with authority, not technology.
 */
export const GOVERNOR_CONFIG = {
  key:    'the_governor',
  name:   'THE GOVERNOR',
  hp:     350,
  str:    20,
  def:    22,
  int:    30,
  spd:    18,
  lck:    20,
  /** Human boss — no Electronic or Armored tags by design. */
  tags:   ['Organic'] as readonly EnemyTag[],
  tier:   'boss' as const,
  width:  32,
  height: 48,
  color:  0x1a1a2e,
  taunts: [
    "You people just can't accept progress.",
    "I kept them ALIVE. Remember that when you judge me.",
    'There are protocols for this kind of disruption.',
    "I have a deal. You are not part of the deal.",
    'Memphis is safe because of me.',
    'What exactly is your plan after you leave?',
  ],
  /** Phase transitions. HP thresholds are fractions of maxHp. */
  phases: [
    {
      hpThreshold: 0.6,
      atkBoost:    4,
      dialogue:    [
        "THE GOVERNOR: Fine. Fine.",
        "THE GOVERNOR: You think this is easy?",
        "THE GOVERNOR: You think I sleep well?",
      ],
    },
    {
      hpThreshold: 0.3,
      atkBoost:    6,
      dialogue:    [
        "THE GOVERNOR: You don't know what it cost.",
        "THE GOVERNOR: You weren't here when they came.",
        "THE GOVERNOR: I watched the whole city get flagged in an afternoon.",
        "THE GOVERNOR: I made a deal so some of us could keep our eyes.",
      ],
    },
  ],
} as const;

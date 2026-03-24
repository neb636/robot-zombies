import type { CharacterDef } from '../types.js';

/**
 * Elias — Hunter/Tank. Joins Ch.1 (Blue Ridge Passage).
 * Lost permanently in Ch.2 (The Bayou). Slowest character in the party.
 */
export const ELIAS_DEF: CharacterDef = {
  id:          'elias',
  name:        'ELIAS',
  color:       0x886644,
  joinChapter: 1,
  chapterStats: [
    { hp: 280, maxHp: 280, str: 78, def: 65, int: 28, spd: 38, lck: 50 }, // ch1
    { hp: 310, maxHp: 310, str: 84, def: 70, int: 30, spd: 40, lck: 52 }, // ch2
  ],
  techs: [
    {
      id:        'heavy_strike',
      label:     'Heavy Strike',
      atbCost:   50,
      targeting: 'single_enemy',
      effect:    { kind: 'damage', skillType: 'Physical', multiplier: 1.8 },
    },
    {
      id:        'steady_shot',
      label:     'Steady Shot',
      atbCost:   50,
      targeting: 'single_enemy',
      // Ignores enemy DEF — multiplier 1.0, but DEF bypass logic in M2
      effect:    { kind: 'special', description: 'Ranged: STR×1.0 damage, ignores enemy DEF entirely' },
    },
    {
      id:        'cover',
      label:     'Cover',
      atbCost:   20,
      targeting: 'single_ally',
      // Redirects next hit aimed at an ally to Elias — full logic in M2
      effect:    { kind: 'special', description: 'Redirect next incoming hit on target ally to Elias' },
    },
    {
      id:        'last_hunt',
      label:     'Last Hunt',
      atbCost:   80,
      targeting: 'single_enemy',
      // Ch.2 loss scene only — auto-triggers in the scripted loss sequence
      effect:    { kind: 'special', description: 'Ch.2 only: triggers automatically in Elias loss scene' },
    },
  ],
  passive: 'Hunting Instinct: Hunting mini-game +2 tiers success rate. Survival food drain −50% while alive.',
  lostAtChapter: 2,
};

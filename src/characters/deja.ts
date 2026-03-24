import type { CharacterDef } from '../types.js';

/**
 * Deja — Rogue/Speedster. Joins Ch.2 (New Memphis).
 * Lost permanently in Ch.4 (The Pass). Fastest ATB in the party.
 */
export const DEJA_DEF: CharacterDef = {
  id:          'deja',
  name:        'DEJA',
  color:       0xcc4488,
  joinChapter: 2,
  chapterStats: [
    { hp: 145, maxHp: 145, str: 44, def: 32, int: 50, spd: 88, lck: 72 }, // ch2
    { hp: 160, maxHp: 160, str: 48, def: 36, int: 54, spd: 90, lck: 76 }, // ch3
    { hp: 174, maxHp: 174, str: 52, def: 40, int: 58, spd: 92, lck: 80 }, // ch4
  ],
  techs: [
    {
      id:        'steal',
      label:     'Steal',
      atbCost:   20,
      targeting: 'single_enemy',
      // Takes one item from enemy's drop table immediately — full logic in M2
      effect:    { kind: 'special', description: 'Take one item from enemy drop table immediately' },
    },
    {
      id:        'smoke',
      label:     'Smoke',
      atbCost:   0,
      targeting: 'self',
      // Guaranteed escape from any encounter — full logic in M2
      effect:    { kind: 'special', description: 'Guaranteed escape from any encounter' },
    },
    {
      id:        'dirty_hit',
      label:     'Dirty Hit',
      atbCost:   50,
      targeting: 'single_enemy',
      // STR × 2.5 crit if enemy is Stunned, 0 damage otherwise
      effect:    { kind: 'special', description: 'STR×2.5 if enemy Stunned, 0 damage otherwise' },
    },
    {
      id:        'dead_drop',
      label:     'Dead Drop',
      atbCost:   80,
      targeting: 'all_enemies',
      // Hit all enemies, then auto-evade next incoming attack
      effect:    { kind: 'special', description: 'Hit all enemies, then auto-evade next incoming attack' },
    },
  ],
  passive: 'Lucky Break: LCK also adds 0.5× to crit rate. Highest innate crit in the party.',
  lostAtChapter: 4,
};

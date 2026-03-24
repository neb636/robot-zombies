import type { CharacterDef } from '../types.js';

/**
 * Dr. Chen — Engineer. Joins Ch.4 (Hermit's Peak).
 * INT-scaling like Maya. Rewire is the strongest situational ability in the game.
 */
export const DR_CHEN_DEF: CharacterDef = {
  id:          'drchen',
  name:        'DR. CHEN',
  color:       0x5588aa,
  joinChapter: 4,
  chapterStats: [
    { hp: 195, maxHp: 195, str: 35, def: 48, int: 90, spd: 56, lck: 44 }, // ch4
    { hp: 215, maxHp: 215, str: 38, def: 54, int: 96, spd: 60, lck: 48 }, // ch5
  ],
  techs: [
    {
      id:        'rewire',
      label:     'Rewire',
      atbCost:   80,
      targeting: 'single_enemy',
      effect:    { kind: 'control', turnsAsAlly: 2 },
    },
    {
      id:        'overclock',
      label:     'Overclock',
      atbCost:   50,
      targeting: 'single_ally',
      // Double ally's ATB fill speed for 3 turns
      effect:    { kind: 'special', description: 'One ally: ATB fill speed ×2 for 3 turns' },
    },
    {
      id:        'shield_drone',
      label:     'Shield Drone',
      atbCost:   50,
      targeting: 'single_ally',
      // Absorbs the next incoming hit for target
      effect:    { kind: 'status', apply: 'Shielded', targetEnemy: false },
    },
    {
      id:        'master_override',
      label:     'Master Override',
      atbCost:   100,
      targeting: 'all_enemies',
      // Ch.5 only: disable all Electronic enemies for 1 turn
      effect:    { kind: 'special', description: 'Ch.5 only: disable all Electronic enemies for 1 turn' },
    },
  ],
  passive: 'Field Engineer: Vehicle breakdown events auto-resolve. Schematics: 15% chance to collect scrap after battle.',
};

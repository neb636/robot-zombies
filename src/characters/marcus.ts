import type { CharacterDef } from '../types.js';

/**
 * Marcus — Civilian. Prologue only.
 * Converted during the Compliance Warden Alpha encounter. Not recoverable.
 */
export const MARCUS_DEF: CharacterDef = {
  id:          'marcus',
  name:        'MARCUS',
  color:       0xddaa44,
  joinChapter: 0,
  chapterStats: [
    { hp: 160, maxHp: 160, str: 38, def: 35, int: 30, spd: 52, lck: 60 }, // prologue
  ],
  techs: [],
  passive: 'Old Friend: While Marcus is in the party, the player\'s LCK +8. Removed permanently after conversion.',
  lostAtChapter: 0,
};

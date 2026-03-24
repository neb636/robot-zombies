import type { CharacterDef } from '../types.js';

/**
 * Jerome — Support/Bruiser. Joins Ch.3 (Radio Tower, Kansas).
 * Morale anchor. Second-slowest ATB. Inspire is the most efficient heal in the game.
 */
export const JEROME_DEF: CharacterDef = {
  id:          'jerome',
  name:        'JEROME',
  color:       0x885522,
  joinChapter: 3,
  chapterStats: [
    { hp: 340, maxHp: 340, str: 80, def: 70, int: 42, spd: 36, lck: 38 }, // ch3
    { hp: 370, maxHp: 370, str: 86, def: 74, int: 46, spd: 38, lck: 42 }, // ch4
    { hp: 400, maxHp: 400, str: 90, def: 78, int: 50, spd: 40, lck: 46 }, // ch5
  ],
  techs: [
    {
      id:        'inspire',
      label:     'Inspire',
      atbCost:   50,
      targeting: 'all_allies',
      // 15 HP/turn regen for 3 turns — approximated as a 45 HP heal split over turns
      effect:    { kind: 'heal', amount: 45, allAllies: true },
    },
    {
      id:        'smite',
      label:     'Smite',
      atbCost:   100,
      targeting: 'single_enemy',
      effect:    { kind: 'damage', skillType: 'Physical', multiplier: 2.2 },
    },
    {
      id:        'preach',
      label:     'Preach',
      atbCost:   20,
      targeting: 'all_allies',
      // Removes Panicked from all allies; morale +5 out-of-battle
      effect:    { kind: 'special', description: 'Remove Panicked from all allies; morale +5 out-of-battle' },
    },
    {
      id:        'testify',
      label:     'Testify',
      atbCost:   80,
      targeting: 'all_allies',
      // Ch.5 only: all allies STR and DEF +20% for 4 turns
      effect:    { kind: 'special', description: 'Ch.5 only: all allies STR and DEF +20% for 4 turns' },
    },
  ],
  passive: 'Anchor: Party morale never drops below 20 while Jerome is alive. Drop Blessing: ammo drop rate +20%.',
};

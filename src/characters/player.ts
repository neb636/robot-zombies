import type { CharacterDef } from '../types.js';

/**
 * Player (Protagonist) — Survivor class.
 * Active all chapters. Adapts to what the party needs.
 */
export const PLAYER_DEF: CharacterDef = {
  id:          'player',
  name:        'Arlo',
  color:       0x4488ff,
  joinChapter: 0,
  chapterStats: [
    { hp: 180, maxHp: 180, str: 42, def: 38, int: 35, spd: 55, lck: 40 }, // prologue
    { hp: 210, maxHp: 210, str: 50, def: 44, int: 40, spd: 58, lck: 42 }, // ch1
    { hp: 240, maxHp: 240, str: 56, def: 50, int: 44, spd: 60, lck: 45 }, // ch2
    { hp: 265, maxHp: 265, str: 62, def: 55, int: 48, spd: 63, lck: 47 }, // ch3
    { hp: 290, maxHp: 290, str: 68, def: 60, int: 52, spd: 66, lck: 50 }, // ch4
    { hp: 320, maxHp: 320, str: 74, def: 65, int: 56, spd: 70, lck: 54 }, // ch5
  ],
  techs: [
    {
      id:        'steady_aim',
      label:     'Steady Aim',
      atbCost:   50,
      targeting: 'single_enemy',
      effect:    { kind: 'damage', skillType: 'Physical', multiplier: 1.3 },
    },
    {
      id:        'grit',
      label:     'Grit',
      atbCost:   30,
      targeting: 'self',
      // Absorbs the next hit — approximated as Shielded until M2 implements the full effect
      effect:    { kind: 'status', apply: 'Shielded', targetEnemy: false },
    },
    {
      id:        'rally',
      label:     'Rally',
      atbCost:   50,
      targeting: 'single_ally',
      // Fills one ally's ATB gauge — full logic requires M2 ATB system
      effect:    { kind: 'special', description: 'One ally: full ATB gauge immediately' },
    },
    {
      id:        'overrun',
      label:     'Overrun',
      atbCost:   80,
      targeting: 'all_enemies',
      effect:    { kind: 'damage', skillType: 'Physical', multiplier: 1.4 },
    },
    {
      id:        'last_stand',
      label:     'Last Stand',
      atbCost:   0,
      targeting: 'self',
      // Auto-triggers at <20% HP: STR and SPD +25% — passive, implemented in M2
      effect:    { kind: 'special', description: 'Auto at HP<20%: STR and SPD +25%' },
    },
  ],
  passive: 'Adaptable: Equip bonus is +5% to lowest stat when a new weapon is found.',
};

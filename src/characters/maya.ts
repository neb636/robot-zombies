import type { CharacterDef } from '../types.js';

/**
 * Maya — Tech Specialist. Joins prologue (Red Line Tunnels).
 * INT-scaling damage. Keep in back row against non-Electronic enemies.
 */
export const MAYA_DEF: CharacterDef = {
  id:          'maya',
  name:        'MAYA',
  color:       0x44aaaa,
  joinChapter: 0,
  chapterStats: [
    { hp: 130, maxHp: 130, str: 28, def: 30, int: 72, spd: 70, lck: 45 }, // prologue
    { hp: 148, maxHp: 148, str: 32, def: 34, int: 80, spd: 74, lck: 48 }, // ch1
    { hp: 165, maxHp: 165, str: 36, def: 38, int: 86, spd: 76, lck: 50 }, // ch2
    { hp: 178, maxHp: 178, str: 38, def: 42, int: 90, spd: 78, lck: 52 }, // ch3
    { hp: 192, maxHp: 192, str: 40, def: 46, int: 94, spd: 80, lck: 54 }, // ch4
    { hp: 210, maxHp: 210, str: 42, def: 50, int: 99, spd: 84, lck: 56 }, // ch5
  ],
  techs: [
    {
      id:        'hack',
      label:     'Hack',
      atbCost:   50,
      targeting: 'single_enemy',
      effect:    { kind: 'status', apply: 'Stunned', targetEnemy: true },
    },
    {
      id:        'analyze',
      label:     'Analyze',
      atbCost:   20,
      targeting: 'single_enemy',
      effect:    { kind: 'reveal' },
    },
    {
      id:        'emp_grenade',
      label:     'EMP Grenade',
      atbCost:   80,
      targeting: 'all_enemies',
      // 1.5× INT damage to all Electronic enemies — skillType EMP for type multiplier
      effect:    { kind: 'damage', skillType: 'EMP', multiplier: 1.5 },
    },
    {
      id:        'overclock',
      label:     'Overclock',
      atbCost:   50,
      targeting: 'single_ally',
      // Double ally's ATB fill speed for 3 turns — full logic in M2
      effect:    { kind: 'special', description: 'One ally: ATB fill speed ×2 for 3 turns' },
    },
    {
      id:        'system_crash',
      label:     'System Crash',
      atbCost:   100,
      targeting: 'single_enemy',
      // Instantly force boss to Phase 2 — full logic in M2
      effect:    { kind: 'special', description: 'Boss-tier only: skip directly to Phase 2' },
    },
  ],
  passive: 'Field Medic: Uses 1 fewer medicine kit per heal action (minimum 0).',
};

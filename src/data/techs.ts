/**
 * Character tech definitions.
 *
 * Prologue player has no techs (joins Maya after Ch.1 starts).
 * Maya techs are here for wiring 2D; they become available after she recruits.
 */
import type { Tech } from '../types.js';

export const MAYA_TECHS: readonly Tech[] = [
  {
    id:        'hack',
    label:     'HACK',
    atbCost:   40,
    targeting: 'single_enemy',
    effect:    { kind: 'status', apply: 'Stunned', targetEnemy: true },
  },
  {
    id:        'analyze',
    label:     'ANALYZE',
    atbCost:   20,
    targeting: 'single_enemy',
    effect:    { kind: 'reveal' },
  },
  {
    id:        'emp_grenade',
    label:     'EMP GRENADE',
    atbCost:   70,
    targeting: 'all_enemies',
    effect:    { kind: 'damage', skillType: 'EMP', multiplier: 1 },
  },
];

export const JEROME_TECHS: readonly Tech[] = [
  {
    id:        'inspire',
    label:     'INSPIRE',
    atbCost:   30,
    targeting: 'single_ally',
    effect:    { kind: 'heal', amount: 40, allAllies: false },
  },
  {
    id:        'preach',
    label:     'PREACH',
    atbCost:   25,
    targeting: 'single_ally',
    // Cures Panicked — special casing handled in TechExecutor
    effect:    { kind: 'status', apply: 'Panicked', targetEnemy: false },
  },
  {
    id:        'stand_firm',
    label:     'STAND FIRM',
    atbCost:   35,
    targeting: 'self',
    effect:    { kind: 'status', apply: 'Shielded', targetEnemy: false },
  },
];

export const DR_CHEN_TECHS: readonly Tech[] = [
  {
    id:        'rewire',
    label:     'REWIRE',
    atbCost:   80,
    targeting: 'single_enemy',
    effect:    { kind: 'control', turnsAsAlly: 2 },
  },
  {
    id:        'patch',
    label:     'PATCH',
    atbCost:   20,
    targeting: 'single_ally',
    // Cures Burning
    effect:    { kind: 'status', apply: 'Burning', targetEnemy: false },
  },
  {
    id:        'overclock',
    label:     'OVERCLOCK',
    atbCost:   45,
    targeting: 'single_ally',
    effect:    { kind: 'status', apply: 'Shielded', targetEnemy: false },
  },
];

export const PLAYER_TECHS_CH1: readonly Tech[] = [
  {
    id:        'adapt',
    label:     'ADAPT',
    atbCost:   30,
    targeting: 'single_enemy',
    effect:    { kind: 'reveal' },
  },
  {
    id:        'endure',
    label:     'ENDURE',
    atbCost:   40,
    targeting: 'self',
    effect:    { kind: 'status', apply: 'Shielded', targetEnemy: false },
  },
];

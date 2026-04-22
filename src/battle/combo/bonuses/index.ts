import type { ComboBonusEffect } from '../../../types.js';
import { BLACKOUT_BONUS }        from './Blackout.js';
import { RIGHTEOUS_FIRE_BONUS }  from './RighteousFire.js';
import { DEAD_WEIGHT_BONUS }     from './DeadWeight.js';
import { GHOST_AND_SHELL_BONUS } from './GhostAndShell.js';
import { THE_SERMON_BONUS }      from './TheSermon.js';

/**
 * Combo id → bonus effect. ComboSystem.checkCombo() dispatches here when
 * it detects a combo; Phase B returns no-ops so HUD flash still fires.
 */
export const COMBO_BONUS_REGISTRY: Readonly<Record<string, ComboBonusEffect>> = {
  BLACKOUT:        BLACKOUT_BONUS,
  RIGHTEOUS_FIRE:  RIGHTEOUS_FIRE_BONUS,
  DEAD_WEIGHT:     DEAD_WEIGHT_BONUS,
  GHOST_AND_SHELL: GHOST_AND_SHELL_BONUS,
  THE_SERMON:      THE_SERMON_BONUS,
};

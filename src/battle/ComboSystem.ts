/**
 * ComboSystem — detects two-character combo actions within a 200ms window.
 *
 * When two party members act within 200ms of each other and their names match
 * a combo table entry, the combo fires (triggering a HUD flash and optional
 * enhanced effects).
 *
 * Combo table:
 *   BLACKOUT        — Maya + Player   (EMP stun → Player gets guaranteed crit)
 *   RIGHTEOUS FIRE  — Jerome + Elias  (heal mid-swing for full HP output)
 *   DEAD WEIGHT     — Deja + Player   (Player strikes uncountered)
 *   GHOST & SHELL   — Deja + Dr.Chen  (enemy stunned + hacked simultaneously)
 *   THE SERMON      — Jerome + Maya   (full debuff clear + enemy tags revealed)
 */
import {
  executeBlackout,
  executeRighteousFire,
  executeDeadWeight,
  executeGhostAndShell,
  executeTheSermon,
}                           from './combo/bonuses/index.js';
import type { ATBCombatant } from '../types.js';
import type { Enemy }        from '../entities/Enemy.js';
import type { BattleManager } from './BattleManager.js';

export interface ComboDefinition {
  readonly id:    string;
  readonly label: string;
  /** Two character name fragments (lowercase) that trigger this combo. */
  readonly chars: readonly [string, string];
}

export const COMBO_TABLE: readonly ComboDefinition[] = [
  { id: 'blackout',       label: 'BLACKOUT',       chars: ['maya', 'player'] },
  { id: 'righteous_fire', label: 'RIGHTEOUS FIRE', chars: ['jerome', 'elias'] },
  { id: 'dead_weight',    label: 'DEAD WEIGHT',    chars: ['deja', 'player'] },
  { id: 'ghost_shell',    label: 'GHOST & SHELL',  chars: ['deja', 'chen'] },
  { id: 'the_sermon',     label: 'THE SERMON',     chars: ['jerome', 'maya'] },
];

/** Time window in milliseconds for combo detection. */
export const COMBO_WINDOW_MS = 200;

/**
 * Check if the new action + previous action form a combo.
 *
 * @param newName  Lowercase name fragment of the character who just acted
 * @param newTs    performance.now() timestamp of the new action
 * @param lastName Lowercase name fragment of the previous party action (or null)
 * @param lastTs   Timestamp of the previous action (or null)
 * @returns The combo definition if detected, or null
 */
export function checkCombo(
  newName:  string,
  newTs:    number,
  lastName: string | null,
  lastTs:   number | null,
): ComboDefinition | null {
  if (lastName === null || lastTs === null) return null;
  if (newTs - lastTs > COMBO_WINDOW_MS)    return null;

  for (const combo of COMBO_TABLE) {
    const [a, b] = combo.chars;
    const pairMatch =
      (newName.includes(a) && lastName.includes(b)) ||
      (newName.includes(b) && lastName.includes(a));
    if (pairMatch) return combo;
  }

  return null;
}

/**
 * Dispatch the bonus effect for a detected combo.
 *
 * Finds the two combatants from manager by name fragment,
 * then calls the appropriate bonus executor.
 *
 * @param combo    The detected combo definition
 * @param manager  The active BattleManager
 * @param enemy    The current enemy target
 */
export function dispatchComboBonus(
  combo:   ComboDefinition,
  manager: BattleManager,
  enemy:   Enemy,
): void {
  switch (combo.id) {
    case 'blackout': {
      const player = manager.player as ATBCombatant;
      executeBlackout(player, enemy, manager);
      break;
    }
    case 'righteous_fire': {
      const jerome = _findAlly('jerome', manager);
      const elias  = _findAlly('elias',  manager);
      if (jerome && elias) {
        executeRighteousFire(jerome, elias, enemy, manager);
      }
      break;
    }
    case 'dead_weight': {
      const player = manager.player as ATBCombatant;
      executeDeadWeight(player, enemy, manager);
      break;
    }
    case 'ghost_shell': {
      const deja = _findAlly('deja', manager);
      const chen = _findAlly('chen', manager);
      if (deja && chen) {
        executeGhostAndShell(deja, chen, enemy, manager);
      }
      break;
    }
    case 'the_sermon': {
      const jerome = _findAlly('jerome', manager);
      const maya   = _findAlly('maya',   manager);
      if (jerome && maya) {
        executeTheSermon(jerome, maya, enemy, manager);
      }
      break;
    }
    default:
      break;
  }
}

/** Find an ally by lowercase name fragment; returns null if not found. */
function _findAlly(fragment: string, manager: BattleManager): ATBCombatant | null {
  const found = manager.allies.find(a =>
    a.name.toLowerCase().includes(fragment),
  );
  return found ?? null;
}

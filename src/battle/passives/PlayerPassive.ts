/**
 * PlayerPassive — Adaptable.
 * When a new weapon is equipped, grant +5% to the player's lowest stat.
 * Called by the equipment system on weapon equip.
 * Integer math: floor.
 */
import type { ATBCombatant } from '../../types.js';

/**
 * Apply the Adaptable equip bonus.
 * Identifies the lowest of (str, def, int, spd, lck) and adds 5% (floor).
 */
export function applyAdaptable(combatant: ATBCombatant): void {
  type StatKey = 'str' | 'def' | 'int' | 'spd' | 'lck';
  const stats: StatKey[] = ['str', 'def', 'int', 'spd', 'lck'];

  let lowestKey: StatKey = 'str';
  let lowestVal = combatant.str;

  for (const key of stats) {
    if (combatant[key] < lowestVal) {
      lowestVal = combatant[key];
      lowestKey = key;
    }
  }

  const bonus = Math.max(1, Math.floor(lowestVal * 0.05));
  combatant[lowestKey] = lowestVal + bonus;
}

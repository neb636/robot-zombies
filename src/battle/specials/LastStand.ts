/**
 * LastStand — Player Ch.5 passive-auto tech.
 * Triggers automatically when player HP drops below 20%.
 * Grants STR and SPD +25% (integer: floor) until the end of battle.
 *
 * The BattleManager stores boosts in lastStandActive so it only fires once.
 */
import type { ATBCombatant }  from '../../types.js';
import type { BattleManager } from '../BattleManager.js';

/**
 * Call this once when the player's HP first crosses the 20% threshold.
 * Mutates the combatant's str and spd stats directly (integer math).
 *
 * @returns true if the buff was applied (first call only), false if already active.
 */
export function tryLastStand(
  combatant:     ATBCombatant,
  manager:       BattleManager,
  alreadyActive: boolean,
): boolean {
  if (alreadyActive) return false;

  const hpPct = combatant.maxHp > 0
    ? combatant.hp / combatant.maxHp
    : 1;

  if (hpPct >= 0.20) return false;

  // +25% to STR and SPD — floor to keep integers
  combatant.str = Math.floor(combatant.str * 1.25);
  combatant.spd = Math.floor(combatant.spd * 1.25);

  manager.dialogueManager.show(
    combatant.name,
    ['LAST STAND! Refusing to go down — STR and SPD surge!'],
  );
  return true;
}

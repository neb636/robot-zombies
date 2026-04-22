/**
 * Blackout — Maya + Player combo.
 * EMP stun from Maya → Player's next attack is a guaranteed crit (×2 dmg).
 *
 * Applies Stunned to the enemy (or refreshes it), then marks the Player
 * combatant for a guaranteed crit on their very next attack.
 *
 * The pending-crit flag lives in a WeakMap keyed on the player combatant.
 * PlayerTurnState should call consumeBlackoutCrit() before each attack roll.
 */
import * as SE              from '../../StatusEffectSystem.js';
import type { ATBCombatant } from '../../../types.js';
import type { Enemy }        from '../../../entities/Enemy.js';
import type { BattleManager } from '../../BattleManager.js';

/** Set of combatants with a pending Blackout guaranteed crit. */
const _pendingCrit = new WeakSet<ATBCombatant>();

export function executeBlackout(
  player:  ATBCombatant,
  enemy:   Enemy,
  manager: BattleManager,
): void {
  // Stun (or refresh stun) on the enemy
  SE.apply(enemy as unknown as ATBCombatant, 'Stunned');

  // Mark player for guaranteed crit on next attack
  _pendingCrit.add(player);

  manager.dialogueManager.show('COMBO', [
    'BLACKOUT! Enemy stunned — next strike is guaranteed critical!',
  ]);
}

/**
 * Check and consume the Blackout guaranteed crit for this combatant.
 * Returns true (and clears the flag) if a crit is pending.
 */
export function consumeBlackoutCrit(combatant: ATBCombatant): boolean {
  if (_pendingCrit.has(combatant)) {
    _pendingCrit.delete(combatant);
    return true;
  }
  return false;
}

/**
 * MarcusPassive — Old Friend.
 * While Marcus is in the party, the player's LCK +8.
 * Removed permanently after Marcus is converted.
 *
 * applyOldFriend:  call on battle start if Marcus is present.
 * removeOldFriend: call when Marcus is removed from the party.
 */
import type { ATBCombatant } from '../../types.js';

const OLD_FRIEND_LCK_BONUS = 8;

export function applyOldFriend(player: ATBCombatant): void {
  player.lck += OLD_FRIEND_LCK_BONUS;
}

export function removeOldFriend(player: ATBCombatant): void {
  player.lck = Math.max(0, player.lck - OLD_FRIEND_LCK_BONUS);
}

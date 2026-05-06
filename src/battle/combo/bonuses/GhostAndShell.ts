/**
 * GhostAndShell — Deja + Dr. Chen combo.
 * Smoke + Rewire: Deja vanishes; Dr. Chen simultaneously rewires an enemy.
 * Chaos combo — the enemy is both controlled AND stunned for 1 turn.
 *
 * Effect:
 *   1. Apply Stunned to the enemy (confusion from simultaneous attack).
 *   2. Apply Hacked to the enemy (enemy attacks its own side next turn).
 *   3. Apply Shielded to Deja (she's gone, can't be hit).
 */
import * as SE               from '../../StatusEffectSystem.js';
import type { ATBCombatant } from '../../../types.js';
import type { Enemy }        from '../../../entities/Enemy.js';
import type { BattleManager } from '../../BattleManager.js';

export function executeGhostAndShell(
  deja:  ATBCombatant,
  chen:  ATBCombatant,
  enemy: Enemy,
  manager: BattleManager,
): void {
  // Enemy is both stunned and hacked — chaos
  SE.apply(enemy as unknown as ATBCombatant, 'Stunned');
  SE.apply(enemy as unknown as ATBCombatant, 'Hacked');

  // Deja is untouchable this turn
  SE.apply(deja, 'Shielded');

  manager.dialogueManager.show('COMBO', [
    `GHOST & SHELL! ${deja.name} vanishes as ${chen.name} rewires ${enemy.name} — chaos erupts!`,
  ]);
}

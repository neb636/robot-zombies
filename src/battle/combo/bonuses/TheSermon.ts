/**
 * TheSermon — Jerome + Maya combo.
 * Preach + Analyze: Full party debuff-clear + all enemy weaknesses revealed.
 *
 * Effect:
 *   1. Remove Panicked and Burning from all living allies.
 *   2. Reveal the enemy's tags permanently (tagsRevealed = true).
 *   3. Heal all allies for 20 HP (Jerome's words carry weight).
 */
import * as SE               from '../../StatusEffectSystem.js';
import type { ATBCombatant } from '../../../types.js';
import type { Enemy }        from '../../../entities/Enemy.js';
import type { BattleManager } from '../../BattleManager.js';

export function executeTheSermon(
  jerome: ATBCombatant,
  maya:   ATBCombatant,
  enemy:  Enemy,
  manager: BattleManager,
): void {
  const allAllies: ATBCombatant[] = [
    manager.player as ATBCombatant,
    ...manager.allies,
  ];

  // 1. Cleanse Panicked and Burning from every living ally
  for (const ally of allAllies) {
    if (ally.isAlive()) {
      SE.remove(ally, 'Panicked');
      SE.remove(ally, 'Burning');
    }
  }

  // 2. Reveal the enemy's weakness tags
  enemy.tagsRevealed = true;

  // 3. Small heal for all — 20 HP
  for (const ally of allAllies) {
    if (ally.isAlive()) {
      ally.heal(20);
    }
  }

  const tagList = enemy.tags.join(', ') || 'unknown type';
  manager.dialogueManager.show('COMBO', [
    `THE SERMON! ${jerome.name} and ${maya.name} — all debuffs cleared, ${enemy.name} revealed as ${tagList}!`,
  ]);
}

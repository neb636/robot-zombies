/**
 * RighteousFire — Jerome + Elias combo.
 * Inspire + Heavy Strike: Jerome heals Elias mid-swing so Elias deals
 * full-HP damage output.
 *
 * Effect:
 *   1. Restore Elias to full HP.
 *   2. Elias strikes the enemy for STR × 1.8 damage (Heavy Strike multiplier)
 *      calculated against full HP / full STR — the heal happens first.
 */
import { calcDamage }        from '../../CombatEngine.js';
import type { ATBCombatant } from '../../../types.js';
import type { Enemy }        from '../../../entities/Enemy.js';
import type { BattleManager } from '../../BattleManager.js';

export function executeRighteousFire(
  jerome: ATBCombatant,
  elias:  ATBCombatant,
  enemy:  Enemy,
  manager: BattleManager,
): void {
  // Step 1: Jerome heals Elias to full
  elias.heal(elias.maxHp);

  // Step 2: Elias strikes at full STR × 1.8
  const baseDmg = calcDamage(elias.str, enemy.def, 'Physical', enemy.tags);
  const dmg     = Math.floor(baseDmg * 1.8);
  const dead    = enemy.takeDamage(dmg);

  manager.dialogueManager.show('COMBO', [
    `RIGHTEOUS FIRE! ${jerome.name} steadies ${elias.name} — ${dmg} damage at full strength!`,
  ]);

  if (dead) {
    manager.goTo('VICTORY');
  }
}

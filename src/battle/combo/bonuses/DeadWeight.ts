/**
 * DeadWeight — Deja + Player combo.
 * Smoke + Attack: Player strikes while Deja vanishes; enemy cannot counter.
 *
 * Effect:
 *   1. Apply Shielded to the Player (enemy can't counter = absorb next hit).
 *   2. Player deals STR × 1.5 damage (enhanced strike while enemy is confused).
 */
import { calcDamage }        from '../../CombatEngine.js';
import type { ATBCombatant } from '../../../types.js';
import type { Enemy }        from '../../../entities/Enemy.js';
import type { BattleManager } from '../../BattleManager.js';
import * as SE               from '../../StatusEffectSystem.js';

export function executeDeadWeight(
  player:  ATBCombatant,
  enemy:   Enemy,
  manager: BattleManager,
): void {
  // Player is shielded against the counter (absorbs next incoming hit)
  SE.apply(player, 'Shielded');

  // Enhanced strike × 1.5 while enemy is off-balance
  const baseDmg = calcDamage(player.str, enemy.def, 'Physical', enemy.tags);
  const dmg     = Math.floor(baseDmg * 1.5);
  const dead    = enemy.takeDamage(dmg);

  manager.dialogueManager.show('COMBO', [
    `DEAD WEIGHT! Deja vanishes — you strike for ${dmg} with no fear of counter!`,
  ]);

  if (dead) {
    manager.goTo('VICTORY');
  }
}

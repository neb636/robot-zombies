/**
 * SystemCrash — Maya Ch.5 tech (atbCost 100).
 * Boss-tier only: instantly forces the enemy to Phase 2 of the boss fight.
 *
 * If the current enemy is not a boss, or the fight is already in Phase 2+,
 * the tech deals heavy INT-based damage instead (fallback behaviour).
 */
import { calcDamage }        from '../CombatEngine.js';
import { BATTLE_STATES }     from '../../utils/constants.js';
import type { ATBCombatant } from '../../types.js';
import type { BattleManager } from '../BattleManager.js';

export function executeSystemCrash(
  caster:  ATBCombatant,
  manager: BattleManager,
): void {
  const { enemy, dialogueManager } = manager;

  // Only effective against boss-tier enemies with phases defined
  if (enemy.tier === 'boss' && manager.bossConfig && manager.currentBossPhase === 0) {
    // Jump straight to Phase 1 threshold (index 0 in phases array = first transition)
    manager.dialogueManager.show(caster.name, [
      'SYSTEM CRASH! Critical fault injected — boss systems destabilise!',
    ]);
    manager.goTo(BATTLE_STATES.BOSS_PHASE_TRANSITION);
    return;
  }

  // Fallback: deal significant INT damage (multiplier 2.0 via calcDamage)
  const baseDmg = calcDamage(caster.int, enemy.def, 'EMP', enemy.tags);
  const dmg = Math.floor(baseDmg * 2.0);
  const dead = enemy.takeDamage(dmg);
  dialogueManager.show(caster.name, [
    `SYSTEM CRASH! ${dmg} EMP damage to ${enemy.name}!`,
  ]);
  if (dead) {
    manager.goTo(BATTLE_STATES.VICTORY);
  }
}

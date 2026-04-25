/**
 * Rally — Player Ch.3 tech.
 * Fills one ally's ATB gauge to 100 immediately (their turn comes next).
 */
import type { ATBCombatant }  from '../../types.js';
import type { BattleManager } from '../BattleManager.js';

export function executeRally(
  caster:  ATBCombatant,
  target:  ATBCombatant,
  manager: BattleManager,
): void {
  target.atb = 100;
  manager.dialogueManager.show(
    caster.name,
    [`RALLY! ${target.name}'s initiative surges — they're ready to act!`],
  );
}

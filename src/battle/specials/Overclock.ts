/**
 * Overclock — Dr. Chen / Maya Ch.4 tech.
 * Doubles one ally's ATB fill speed for 3 turns.
 *
 * Implemented by applying a timed multiplier tracked on the combatant via a
 * dedicated optional field. ATBTickingState's fill-rate path checks this.
 *
 * Because ATBCombatant is a lean interface we track the boost via a WeakMap
 * keyed on the combatant object. BattleManager exposes a helper to query it.
 */
import type { ATBCombatant }  from '../../types.js';
import type { BattleManager } from '../BattleManager.js';

/** Remaining overclock ticks (turns) per combatant. */
const _overclockTurns = new WeakMap<ATBCombatant, number>();

/**
 * Apply the Overclock effect: double ATB fill rate for 3 turns.
 */
export function applyOverclock(
  caster:  ATBCombatant,
  target:  ATBCombatant,
  manager: BattleManager,
): void {
  _overclockTurns.set(target, 3);
  manager.dialogueManager.show(
    caster.name,
    [`OVERCLOCK! ${target.name}'s systems run at double speed for 3 turns!`],
  );
}

/**
 * Returns the ATB fill multiplier for this combatant.
 * Returns 2 while Overclock is active, 1 otherwise.
 */
export function getOverclockMultiplier(combatant: ATBCombatant): number {
  const turns = _overclockTurns.get(combatant) ?? 0;
  return turns > 0 ? 2 : 1;
}

/**
 * Decrement one turn of Overclock for the combatant.
 * Should be called once per ATB fill cycle (when their turn fires).
 */
export function tickOverclock(combatant: ATBCombatant): void {
  const turns = _overclockTurns.get(combatant) ?? 0;
  if (turns > 0) {
    _overclockTurns.set(combatant, turns - 1);
  }
}

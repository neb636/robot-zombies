/**
 * Control — Dr. Chen's Rewire tech (kind: 'control').
 * Turns one Electronic enemy into a temporary party ally for 2 turns.
 *
 * During those turns the rewired enemy attacks the main enemy each turn
 * using its own str stat. We model this as a temporary ATBCombatant added to
 * manager.allies. A WeakMap tracks the remaining turns.
 *
 * The controlled combatant is removed automatically after its turns expire via
 * tickControl(), called at the start of each of its simulated actions.
 */
import type { ATBCombatant }  from '../../types.js';
import type { Enemy }         from '../../entities/Enemy.js';
import type { BattleManager } from '../BattleManager.js';

/** remaining turns as ally per enemy reference */
const _controlTurns = new WeakMap<ATBCombatant, number>();

/**
 * Apply Rewire: register the enemy as controlled for `turnsAsAlly` turns.
 * Adds the enemy as a synthetic ATBCombatant in manager.allies.
 */
export function applyControl(
  caster:      ATBCombatant,
  enemy:       Enemy,
  turnsAsAlly: number,
  manager:     BattleManager,
): void {
  // Only works on Electronic enemies
  if (!enemy.tags.includes('Electronic')) {
    manager.dialogueManager.show(caster.name, [
      `REWIRE FAILED — ${enemy.name} has no accessible circuitry.`,
    ]);
    return;
  }

  // Build a minimal ATBCombatant wrapper around the enemy for use as an ally
  const rewired: ATBCombatant = {
    sprite:       enemy.sprite,
    name:         `${enemy.name} [REWIRED]`,
    hp:           enemy.hp,
    maxHp:        enemy.maxHp,
    attack:       enemy.str,
    row:          'front',
    str:          enemy.str,
    def:          enemy.def,
    int:          enemy.int,
    spd:          enemy.spd,
    lck:          enemy.lck,
    atb:          50,   // start at half so it acts soon
    statuses:     [],
    techs:        [],
    tags:         [],
    tagsRevealed: false,
    takeDamage(amount: number): boolean {
      this.hp = Math.max(0, this.hp - amount);
      return this.hp <= 0;
    },
    heal(amount: number): void {
      this.hp = Math.min(this.maxHp, this.hp + amount);
    },
    isAlive(): boolean { return this.hp > 0; },
  };

  _controlTurns.set(rewired, turnsAsAlly);
  manager.allies.push(rewired);

  manager.dialogueManager.show(caster.name, [
    `REWIRE! ${enemy.name} now fights for your side — for ${turnsAsAlly} turns!`,
  ]);
}

/**
 * Decrement one turn for a controlled ally.
 * Returns true if the ally should be removed (turns expired).
 */
export function tickControl(ally: ATBCombatant): boolean {
  const turns = _controlTurns.get(ally) ?? 0;
  if (turns <= 1) {
    _controlTurns.delete(ally);
    return true;  // remove
  }
  _controlTurns.set(ally, turns - 1);
  return false;
}

/** Returns true if this ally is a rewired/controlled combatant. */
export function isControlled(ally: ATBCombatant): boolean {
  return _controlTurns.has(ally);
}

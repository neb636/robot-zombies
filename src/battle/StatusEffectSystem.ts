/**
 * StatusEffectSystem — pure module for applying, ticking, and removing
 * status effects on ATBCombatants. No Phaser dependency.
 *
 * Effects:
 *   Stunned  — skip next turn (1 turn)
 *   Burning  — -10 HP when the combatant acts (3 turns)
 *   Hacked   — attacks own allies instead of enemies (2 turns)
 *   Shielded — absorbs one incoming hit (turnsRemaining = -1 = until triggered)
 *   Panicked — random action each turn (cured by Jerome's Preach)
 */
import type { ATBCombatant, StatusEffectKey } from '../types.js';

/** Canonical duration in turns for each effect (where applicable). */
const DEFAULT_DURATION: Record<StatusEffectKey, number> = {
  Stunned:  1,
  Burning:  3,
  Hacked:   2,
  Shielded: -1,   // -1 = permanent until triggered
  Panicked: 3,
};

/**
 * Apply a status effect to a combatant. If the effect is already active
 * the duration is refreshed (not stacked).
 */
export function apply(
  combatant: ATBCombatant,
  key:       StatusEffectKey,
  duration?: number,
): void {
  const dur = duration ?? DEFAULT_DURATION[key];
  const existing = combatant.statuses.find(s => s.key === key);
  if (existing) {
    existing.turnsRemaining = dur;
  } else {
    combatant.statuses.push({ key, turnsRemaining: dur });
  }
}

/**
 * Decrement all active effects by 1 turn. Remove those that have expired.
 * Returns the keys of effects that expired this call (so callers can show
 * "X wore off" dialogue if desired).
 *
 * Shielded (turnsRemaining = -1) is NOT decremented here — it is consumed
 * by the damage-dealing path when a hit lands.
 */
export function tickAll(combatant: ATBCombatant): StatusEffectKey[] {
  const expired: StatusEffectKey[] = [];

  combatant.statuses = combatant.statuses.filter(s => {
    if (s.turnsRemaining === -1) return true;   // shield — skip
    s.turnsRemaining -= 1;
    if (s.turnsRemaining <= 0) {
      expired.push(s.key);
      return false;
    }
    return true;
  });

  return expired;
}

export function hasStatus(combatant: ATBCombatant, key: StatusEffectKey): boolean {
  return combatant.statuses.some(s => s.key === key);
}

export function remove(combatant: ATBCombatant, key: StatusEffectKey): void {
  combatant.statuses = combatant.statuses.filter(s => s.key !== key);
}

/**
 * Check if a Shielded combatant should absorb an incoming hit.
 * If shielded, removes the Shielded status and returns true (hit absorbed).
 * Otherwise returns false (hit lands normally).
 */
export function tryAbsorbWithShield(combatant: ATBCombatant): boolean {
  if (hasStatus(combatant, 'Shielded')) {
    remove(combatant, 'Shielded');
    return true;
  }
  return false;
}

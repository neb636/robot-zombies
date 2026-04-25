/**
 * DejaPassive — Lucky Break.
 * LCK also adds 0.5× to crit rate. Highest innate crit rate in the party.
 *
 * critChance is expressed as an integer percentage (0–100).
 * CombatEngine rolls 0–99; if roll < critChance the hit is a crit (×1.5 dmg).
 *
 * Usage: call computeCritChance(lck) during Deja's attack resolution
 * to get the bonus crit probability to add on top of a base crit rate.
 */

/** Base crit rate for all characters (integer %). */
export const BASE_CRIT_RATE = 5;

/**
 * Returns Deja's total crit chance (integer %) given her current LCK.
 * Formula: BASE_CRIT_RATE + floor(lck * 0.5)
 */
export function computeDejaCritChance(lck: number): number {
  return BASE_CRIT_RATE + Math.floor(lck * 0.5);
}

/**
 * Roll a crit for Deja. Returns true if the attack crits.
 */
export function rollDejaCrit(lck: number): boolean {
  const chance = computeDejaCritChance(lck);
  return Math.floor(Math.random() * 100) < chance;
}

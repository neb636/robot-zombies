/**
 * JeromePassive — Anchor + Drop Blessing.
 *
 * Anchor:       Party morale never drops below 20 while Jerome is alive.
 * Drop Blessing: Ammo drop rate from enemies +20% (floor).
 *
 * enforceMoraleFloor: clamp morale at 20 minimum while Jerome is alive.
 * getAmmoDrop:        apply the +20% bonus to a base ammo drop (integer math).
 */

/** Minimum morale enforced while Jerome is alive. */
export const JEROME_MORALE_FLOOR = 20;

/**
 * Clamp morale to the Anchor minimum while Jerome is alive.
 * The survival layer should call this after any morale drain calculation.
 *
 * @param morale     Current morale value.
 * @param jeromeAlive Whether Jerome is currently alive in the party.
 * @returns           Clamped morale (integer).
 */
export function enforceMoraleFloor(morale: number, jeromeAlive: boolean): number {
  if (jeromeAlive) {
    return Math.max(JEROME_MORALE_FLOOR, Math.floor(morale));
  }
  return Math.floor(morale);
}

/**
 * Apply the Drop Blessing ammo bonus.
 * @param baseAmmo Base ammo count dropped.
 * @returns        Boosted amount (floor of baseAmmo × 1.2).
 */
export function getAmmoDrop(baseAmmo: number): number {
  return Math.floor(baseAmmo * 1.2);
}

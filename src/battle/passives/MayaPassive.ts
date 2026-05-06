/**
 * MayaPassive — Field Medic.
 * Uses 1 fewer medicine kit per heal action (minimum 0).
 *
 * In the current build, item costs are tracked as counts. This helper
 * calculates the effective medicine kit cost for Maya's heal actions.
 */

/**
 * Returns the effective medicine kit cost for Maya (minimum 0).
 * Standard cost is 1 kit; Maya uses 0.
 */
export function getMedicineCost(baseCost: number): number {
  return Math.max(0, baseCost - 1);
}

/**
 * DrChenPassive — Field Engineer + Schematics.
 *
 * Field Engineer:  Vehicle breakdown survival events auto-resolve (no penalty).
 *                  Checked by the survival event system — if Dr. Chen is alive,
 *                  skip the breakdown penalty entirely.
 *
 * Schematics:      After battle, 15% chance to auto-collect robot parts as scrap.
 *                  rollSchematics() is called by VictoryState (or similar)
 *                  after each battle in which Dr. Chen participated.
 */

/** Scrap collection roll (integer %). */
const SCHEMATICS_CHANCE = 15;

/**
 * Roll the Schematics passive after victory.
 * Returns true if scrap is collected (15% chance).
 */
export function rollSchematics(): boolean {
  return Math.floor(Math.random() * 100) < SCHEMATICS_CHANCE;
}

/**
 * Returns true if a vehicle breakdown event should be auto-resolved.
 * Pass whether Dr. Chen is currently in the active party.
 */
export function autoResolveBreakdown(drChenInParty: boolean): boolean {
  return drChenInParty;
}

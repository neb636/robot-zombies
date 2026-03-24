/**
 * ComboSystem — detects two-character combo actions within a 200ms window.
 *
 * When two party members act within 200ms of each other and their names match
 * a combo table entry, the combo fires (triggering a HUD flash and optional
 * enhanced effects).
 *
 * Combo table (first three implemented):
 *   BLACKOUT        — Maya + Player   (EMP stun → Player gets 2× crit on stunned target)
 *   RIGHTEOUS FIRE  — Jerome + Elias
 *   DEAD WEIGHT     — Deja + Player
 */

export interface ComboDefinition {
  readonly id:    string;
  readonly label: string;
  /** Two character name fragments (lowercase) that trigger this combo. */
  readonly chars: readonly [string, string];
}

export const COMBO_TABLE: readonly ComboDefinition[] = [
  { id: 'blackout',       label: 'BLACKOUT',       chars: ['maya', 'player'] },
  { id: 'righteous_fire', label: 'RIGHTEOUS FIRE', chars: ['jerome', 'elias'] },
  { id: 'dead_weight',    label: 'DEAD WEIGHT',    chars: ['deja', 'player'] },
  { id: 'ghost_shell',    label: 'GHOST & SHELL',  chars: ['deja', 'chen'] },
  { id: 'the_sermon',     label: 'THE SERMON',     chars: ['jerome', 'maya'] },
];

/** Time window in milliseconds for combo detection. */
export const COMBO_WINDOW_MS = 200;

/**
 * Check if the new action + previous action form a combo.
 *
 * @param newName  Lowercase name fragment of the character who just acted
 * @param newTs    performance.now() timestamp of the new action
 * @param lastName Lowercase name fragment of the previous party action (or null)
 * @param lastTs   Timestamp of the previous action (or null)
 * @returns The combo definition if detected, or null
 */
export function checkCombo(
  newName:  string,
  newTs:    number,
  lastName: string | null,
  lastTs:   number | null,
): ComboDefinition | null {
  if (lastName === null || lastTs === null) return null;
  if (newTs - lastTs > COMBO_WINDOW_MS)    return null;

  for (const combo of COMBO_TABLE) {
    const [a, b] = combo.chars;
    const pairMatch =
      (newName.includes(a) && lastName.includes(b)) ||
      (newName.includes(b) && lastName.includes(a));
    if (pairMatch) return combo;
  }

  return null;
}

import type { CharacterDef } from '../types.js';
import { npcStub } from './_npcStub.js';

/**
 * Tomas Reyes — New Memphis underground fixer / Deja's past. NPC (Ch.2).
 * Not a party member. See planning/side_characters.md.
 */
export const TOMAS_DEF: CharacterDef = npcStub('tomas', 'TOMAS', 0x332255, 2);

// Stream C2 scene-level constants (re-exported for chapter2 scripts).
export const TOMAS_META = {
  acceptFlag:           'TOMAS_DEBT_CLEARED',
  declineFlag:          'TOMAS_REFUSED',
  dejaAcceptMoralBonus: 15,
} as const;

/** Legacy alias used by MississippiCrossingScene. */
export const TOMAS = TOMAS_META;

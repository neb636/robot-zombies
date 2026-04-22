import type { CharacterDef } from '../types.js';
import { npcStub } from './_npcStub.js';

/**
 * Elena Ortega — UN climate envoy, Elise's dissenting colleague.
 * Archival only (Vault 49 Ch.2). NPC.
 */
export const ELENA_DEF: CharacterDef = npcStub('elena', 'ELENA', 0x997766, 2);

// Stream C2 terminal metadata — flags used by Vault 49 terminal puzzle.
export const ELENA_META = {
  terminalFlags: {
    seq1:        'VAULT49_TERMINAL_SEQ1_READ',
    seq2:        'VAULT49_TERMINAL_SEQ2_READ',
    seq3:        'VAULT49_TERMINAL_SEQ3_READ',
    tillyFather: 'VAULT49_TERMINAL_TILLY_READ',
  },
  completionFlag:  'VAULT49_TERMINALS_READ',
  tillyFatherFlag: 'TILLY_FATHER_HEARD',
} as const;

/** Legacy alias used by Vault49Scene. */
export const ELENA_ORTEGA = ELENA_META;

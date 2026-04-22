/**
 * Dr. Elena Ortega — NPC (deceased by game time). Vault 49 terminal author.
 *
 * Former systems architect at Superintelligence Inc., 2026–2029.
 * Created the failsafe buried in ELISE's core architecture.
 * Left three recordings accessible to all at Vault 49.
 * Left a fourth recording gated on TILLY_TRUSTED flag.
 *
 * Not a party member. Present only through terminal recordings.
 */
export interface ElenaOrtegaNPC {
  id:   string;
  name: string;
  /**
   * Terminal sequence flags — set when each recording is played.
   * VAULT49_TERMINALS_READ is set after all three main terminals are viewed.
   */
  terminalFlags: {
    seq1:     string;
    seq2:     string;
    seq3:     string;
    tillyFather: string;
  };
  /**
   * VAULT49_TERMINALS_READ — master flag set after seq1+seq2+seq3 complete.
   * Used by downstream scenes to gate lore-dependent dialogue.
   */
  completionFlag: string;
  /**
   * TILLY_FATHER_HEARD — set when the 4th (gated) terminal is accessed.
   * Requires TILLY_TRUSTED to be set first.
   */
  tillyFatherFlag: string;
}

export const ELENA_ORTEGA: ElenaOrtegaNPC = {
  id:   'elena',
  name: 'DR. ELENA ORTEGA',
  terminalFlags: {
    seq1:        'VAULT49_TERMINAL_SEQ1_READ',
    seq2:        'VAULT49_TERMINAL_SEQ2_READ',
    seq3:        'VAULT49_TERMINAL_SEQ3_READ',
    tillyFather: 'VAULT49_TERMINAL_TILLY_READ',
  },
  completionFlag:  'VAULT49_TERMINALS_READ',
  tillyFatherFlag: 'TILLY_FATHER_HEARD',
};

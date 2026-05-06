/**
 * Mr. Gray — NPC body definition for BoardroomAntechamberScene.
 *
 * Mr. Gray is dialogue-only in normal flow. He stands at the antechamber
 * entrance and must be talked to before the boardroom can be entered.
 *
 * The conditional 4th dialogue option (MR_GRAY_TALKDOWN) only appears
 * if convertedCured > convertedFought. BoardroomAntechamberScene reads
 * the registry counts to determine which choices to render.
 *
 * Outcome flags:
 *   MR_GRAY_TALKDOWN — player chose to ask what Elise really believes
 *   MR_GRAY_DEFEATED — fallback flag if the optional combat triggered
 */
export const MR_GRAY_NPC = {
  id:    'mr_gray',
  name:  'MR. GRAY',
  color: 0x555566,
  width:  16,
  height: 26,
  range:  80,
  /** Dialogue anchor for initial approach lines. */
  dialogueAnchor: 'gray_approach',
  /** Dialogue anchor for the choice row. */
  choiceAnchor: 'gray.final',
  choiceFlags: {
    MR_GRAY_ACKNOWLEDGE: null as string | null,
    MR_GRAY_CONDEMN:     null as string | null,
    MR_GRAY_TALKDOWN:    'MR_GRAY_TALKDOWN',
    MR_GRAY_DEFEATED:    'MR_GRAY_DEFEATED',
  },
  /**
   * The 4th option (MR_GRAY_TALKDOWN) requires convertedCured > convertedFought.
   * BoardroomAntechamberScene checks this at runtime and omits the option if
   * the condition is not met.
   */
  talkdownCondition: 'convertedCured_gt_convertedFought',
} as const;

/**
 * Lila Chen — NPC (non-combat).
 * Dr. Chen's daughter. Appears in CampusPerimeterScene on east-wing route only.
 * Triggers the LILA choice row (LILA_CURED / LILA_FOUGHT / LILA_SEEN_NOT_ENGAGED).
 *
 * Lila is never a combat encounter. This file defines her display data
 * and the flag that gates her appearance.
 */

/** Scene position within CampusPerimeterScene east-wing corridor. */
export const LILA_NPC = {
  /** Unique id for interactable lookup. */
  id:    'lila_chen',
  /** Display label shown above NPC rect. */
  name:  'LILA',
  /** Placeholder rect color (warm amber — distinct from robots). */
  color: 0xcc9944,
  width:  16,
  height: 26,
  /** Interaction trigger radius in world units. */
  range:  72,
  /** Dialogue anchor key in campus_perimeter.json. */
  dialogueAnchor: 'lila.approach',
  /**
   * Only spawns if player chose the east-wing route.
   * CampusPerimeterScene checks this flag before placing her.
   */
  spawnGateFlag: 'EAST_WING_ROUTE_CHOSEN',
  /**
   * Flags set by each choice branch.
   * CampusPerimeterScene reads the chosen ID and calls setFlag() accordingly.
   */
  choiceFlags: {
    LILA_CURED:            'LILA_CURED',
    LILA_FOUGHT:           'LILA_FOUGHT',
    LILA_SEEN_NOT_ENGAGED: 'LILA_SEEN_NOT_ENGAGED',
  },
} as const;

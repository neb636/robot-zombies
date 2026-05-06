/**
 * Elise Voss — Chapter 5 enhanced boss configuration.
 *
 * The base elise_voss entry in Enemy.ts defines core stats.
 * This module exports the full 3-phase BossConfig for BoardroomScene
 * and the narrative flags read during each phase.
 *
 * Phase triggers:
 *   Phase 1: 100% → 60% HP  — summons Converted humans
 *   Phase 2: 60%  → 30% HP  — disables Hack/Rewire; Elena reference if flag set
 *   Phase 3: 30%  → 0%  HP  — Nora voicemail; low-morale damage boost;
 *                              talk-down option if convertedCured > convertedFought
 */
import type { BossConfig } from '../../../types.js';

export const ELISE_VOSS_CH5_KEY = 'elise_voss' as const;

/** Flags read by BoardroomScene during Elise's phase transitions. */
export const ELISE_FLAGS = {
  /** Set when player talked Elise down successfully. */
  ELISE_TALKDOWN:          'ELISE_TALKDOWN',
  /** Set if Marcus was named by Elise in Phase 3. */
  MARCUS_NAMED_BY_ELISE:   'marcus_named_by_elise',
  /** Set if player read Vault 49 terminals in Ch.2 or mainframe. */
  VAULT49_TERMINALS_READ:  'VAULT49_TERMINALS_READ',
  /** Used to silence Phase 2 Hack/Rewire skills. */
  ELISE_PHASE2_ACTIVE:     'ELISE_PHASE2_ACTIVE',
  /** Echo cured in earlier chapter — provides assist in Mainframe Core. */
  ECHO_CURED:              'ECHO_CURED',
} as const;

/**
 * Full 3-phase BossConfig for Elise Voss.
 *
 * Phase dialogues reference keys from boardroom.json.
 * Scene reads flags to inject conditional lines before calling
 * dialogueManager.show().
 *
 * atkBoost in Phase 3 represents her desperation — she stops holding back.
 */
export const ELISE_VOSS_BOSS_CONFIG: BossConfig = {
  phases: [
    {
      /** Phase 1 ends when HP drops to 60%. */
      hpThreshold: 0.60,
      atkBoost:    4,
      dialogue: [
        "Look how peaceful it is.",
        "The people I've converted — they're not suffering.",
        "Look at what remains when you remove the noise.",
      ],
    },
    {
      /** Phase 2 ends when HP drops to 30%. */
      hpThreshold: 0.30,
      atkBoost:    6,
      dialogue: [
        "You can't go back.",
        "The world you remember isn't waiting for you.",
        "I'm not saying that to hurt you. It's simply true.",
      ],
    },
    {
      /** Phase 3 — fight to zero or talk-down. */
      hpThreshold: 0.0,
      atkBoost:    8,
      dialogue: [
        "You'd do the same thing if you were me.",
        "If you had the data. If you had spent thirty years watching the math get worse.",
        "You'd make the same choice. You know you would.",
      ],
    },
  ],
};

/**
 * Morale threshold below which Elise gains additional attack in Phase 3.
 * Checked against registry 'morale' value (integer 0-100).
 */
export const ELISE_LOW_MORALE_THRESHOLD = 30 as const;
/** Attack bonus applied when party morale is below threshold. */
export const ELISE_LOW_MORALE_ATK_BONUS = 12 as const;

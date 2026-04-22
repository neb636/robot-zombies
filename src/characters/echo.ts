/**
 * Echo — a Converted human NPC encountered at the High Altitude Camp.
 *
 * Echo is not a party member and has no combat stats. She is a "Special" enemy
 * type (Converted human) with a unique interaction — the player can cure her
 * (costs 1 medicine kit) or refuse and leave.
 *
 * Real name: Rachel. Former teacher. She remembers.
 *
 * Curing Echo sets the ECHO_CURED flag, which unlocks a Hack Assist bonus
 * in Chapter 5 — she accesses SI Inc. systems remotely once restored.
 * Refusing sets ECHO_REFUSED. Both flags are read by Ch.5 scenes.
 *
 * Requires: DR_CHEN_RECRUITED flag (Chen explains the reversal process).
 *
 * TTS / robot profile: Echo speaks in the cadence of a Converted human —
 * flat affect, present tense, occasional flickers of her former self.
 * She is not aggressive. She is asking.
 *
 * Visual: Converted human color palette (0x6688aa), same dimensions as
 * the base 'converted' entry in Enemy.ts BOSS_CONFIGS.
 */

export const ECHO_NPC = {
  id:    'echo',
  name:  'ECHO',
  /** Display name before the player learns her real name. */
  displayName: 'ECHO',
  /** Her actual name, revealed during the cure sequence. */
  realName: 'Rachel',
  color: 0x6688aa,
  width: 32,
  height: 48,

  /**
   * TTS voice profile — matches the Converted human tone:
   * slow, precise, affectless. Moments of self break through.
   */
  ttsProfile: {
    rate:   0.82,
    pitch:  0.95,
    volume: 0.9,
    voice:  'female',
  },

  /** Required game flag before the Echo interaction triggers. */
  requiresFlag: 'DR_CHEN_RECRUITED',

  /** Flag set when player cures Echo. Enables Ch.5 Hack Assist. */
  curedFlag:   'ECHO_CURED',
  /** Flag set when player refuses to cure Echo. */
  refusedFlag: 'ECHO_REFUSED',

  /** Medicine kit cost to cure. */
  medicineCost: 1,
} as const;

export type EchoNpc = typeof ECHO_NPC;

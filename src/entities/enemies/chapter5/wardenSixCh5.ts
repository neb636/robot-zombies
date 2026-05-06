/**
 * Warden Six — Chapter 5 variant.
 * Only appears if SIX_BEATEN_CH1 && SIX_BEATEN_CH3 flags are set.
 * Drops item flag SIXS_CORE on defeat.
 *
 * Third encounter with this specific Warden unit — notably tougher.
 */
import type { BossConfig } from '../../../types.js';

export const WARDEN_SIX_CH5_KEY = 'warden_six_ch5' as const;

export const WARDEN_SIX_CH5_CONFIG = {
  name:   'WARDEN SIX',
  hp:     420,
  atk:    30,
  str:    30,
  def:    24,
  int:    20,
  spd:    14,
  lck:    12,
  tags:   ['Electronic', 'Armored'] as const,
  tier:   'boss' as const,
  width:  60,
  height: 76,
  color:  0x334455,
  taunts: [
    'THIRD ENGAGEMENT LOGGED. ADAPTIVE PROTOCOLS ACTIVE.',
    'YOU ARE A KNOWN VARIABLE. ADJUSTING.',
    'RESISTANCE EFFICIENCY DECLINING. STATISTICAL CERTAINTY.',
    'I HAVE ANTICIPATED EVERY APPROACH. TRY ANOTHER.',
  ],
};

export const WARDEN_SIX_CH5_BOSS_CONFIG: BossConfig = {
  phases: [
    {
      hpThreshold: 0.6,
      atkBoost:    6,
      dialogue: [
        'PHASE SHIFT. ADAPTIVE COMBAT MODE ENGAGED.',
        'I HAVE SEEN YOUR PATTERNS.',
        'YOU WILL NOT WIN THE SAME WAY TWICE.',
      ],
    },
    {
      hpThreshold: 0.3,
      atkBoost:    10,
      dialogue: [
        'CORE ARCHITECTURE: DESTABILIZING.',
        'THIRD DEFEAT SCENARIO: PROBABILITY RISING.',
        'THIS OUTCOME WAS NOT PROJECTED.',
      ],
    },
  ],
};

/**
 * Flag set on the registry when Warden Six Ch5 is defeated.
 * Dropped in MainframeCoreScene.
 */
export const WARDEN_SIX_DEFEAT_FLAG = 'SIXS_CORE' as const;

/** Availability gate: requires both prior Warden Six encounters won. */
export const WARDEN_SIX_GATE_FLAGS = ['SIX_BEATEN_CH1', 'SIX_BEATEN_CH3'] as const;

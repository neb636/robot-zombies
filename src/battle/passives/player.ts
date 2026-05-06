import type { PassiveEffect } from '../../types.js';

/** Adaptable — +5% to lowest stat on equipment change. Stream D fills. */
export const PLAYER_PASSIVE: PassiveEffect = {
  characterId: 'player',
  description: 'Adaptable: +5% to lowest stat based on current equipment.',
};

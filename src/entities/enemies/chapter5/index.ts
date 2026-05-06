/**
 * Chapter 5 enemies — barrel exports for all chapter-5-specific enemy
 * configurations and related constants.
 */
export { MR_GRAY_ENEMY_KEY, MR_GRAY_BOSS_CONFIG, MR_GRAY_BATTLE_DATA } from './mrGray.js';
export {
  WARDEN_SIX_CH5_KEY,
  WARDEN_SIX_CH5_CONFIG,
  WARDEN_SIX_CH5_BOSS_CONFIG,
  WARDEN_SIX_DEFEAT_FLAG,
  WARDEN_SIX_GATE_FLAGS,
} from './wardenSixCh5.js';
export { ELITE_SECURITY_BOT_KEY, ELITE_SECURITY_BOT_CONFIG } from './eliteSecurityBot.js';
export {
  ELISE_VOSS_CH5_KEY,
  ELISE_FLAGS,
  ELISE_VOSS_BOSS_CONFIG,
  ELISE_LOW_MORALE_THRESHOLD,
  ELISE_LOW_MORALE_ATK_BONUS,
} from './eliseVossCh5.js';

/** Aggregated registry map. Ch.5 canonical elise_voss is already in base.ts. */
import type { EnemyConfigMap } from '../types.js';
export const CHAPTER5_ENEMIES: EnemyConfigMap = {};

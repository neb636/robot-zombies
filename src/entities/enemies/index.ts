import type { EnemyConfigMap } from './types.js';
import { BASE_ENEMY_CONFIGS } from './base.js';
import { CHAPTER1_ENEMIES }   from './chapter1/index.js';
import { CHAPTER2_ENEMIES }   from './chapter2/index.js';
import { CHAPTER3_ENEMIES }   from './chapter3/index.js';
import { CHAPTER4_ENEMIES }   from './chapter4/index.js';
import { CHAPTER5_ENEMIES }   from './chapter5/index.js';

export * from './types.js';

/**
 * Global enemy registry. Enemy.ts reads from here when instantiating by key.
 *
 * Duplicate keys are resolved in later-chapter's favor — a chapter stream
 * that wants to shadow a base enemy (e.g. a re-skinned Warden) should
 * pick a distinct key. Don't rely on override order.
 */
export const ENEMY_REGISTRY: EnemyConfigMap = {
  ...BASE_ENEMY_CONFIGS,
  ...CHAPTER1_ENEMIES,
  ...CHAPTER2_ENEMIES,
  ...CHAPTER3_ENEMIES,
  ...CHAPTER4_ENEMIES,
  ...CHAPTER5_ENEMIES,
};

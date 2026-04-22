import type { EnemyTag } from '../../types.js';

export type EnemyTier =
  | 'drone'
  | 'enforcer'
  | 'sentinel'
  | 'boss'
  | 'converted'
  | 'human';

/**
 * Canonical config shape for a registered enemy. Per-chapter enemy files
 * export one of these (or a record keyed by enemyKey) and register them
 * into ENEMY_REGISTRY via the chapter bundle.
 */
export interface EnemyConfig {
  name:   string;
  hp:     number;
  atk:    number;     // kept for BossPhaseTransitionState backward compat (mirrors str)
  str:    number;
  def:    number;
  int:    number;
  spd:    number;
  lck:    number;
  tags:   readonly EnemyTag[];
  tier:   EnemyTier;
  width:  number;
  height: number;
  color:  number;
  taunts: readonly string[];
}

export type EnemyConfigMap = Readonly<Record<string, EnemyConfig>>;

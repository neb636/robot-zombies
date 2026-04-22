import type { EnemyConfigMap } from '../types.js';

/**
 * Chapter 1 enemy bundle.
 *
 * Stream C1 ADDS per-enemy files under this directory and imports them here.
 * Example per-enemy file: `src/entities/enemies/chapter1/excavatorPrime.ts`.
 * Each per-enemy file should export a single `EnemyConfig` constant which
 * this file then aggregates into CHAPTER1_ENEMIES.
 *
 * Currently empty — Stream C1 fills this at fan-out time.
 */
export const CHAPTER1_ENEMIES: EnemyConfigMap = {};

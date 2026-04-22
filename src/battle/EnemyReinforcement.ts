/**
 * EnemyReinforcement — spawns a secondary enemy when a Sentinel calls for backup.
 *
 * Current implementation: adds a second Enemy instance to manager as a tracked
 * reinforcement. Because the existing battle model has a single `manager.enemy`
 * reference, we store reinforcements in a separate array on BattleManager
 * (added by stream D). The HUD and ATBTickingState do not yet render/tick them —
 * that wiring is left for the multi-enemy milestone.
 *
 * For now this module:
 *   - Creates a new Enemy (always a 'compliance_drone' — the cheapest reinforce).
 *   - Logs it via dialogueManager.
 *   - Pushes it to manager.reinforcements (a lightweight array we initialise on
 *     BattleManager in this stream via `spawnReinforcement()`).
 */
import Phaser               from 'phaser';
import { Enemy }             from '../entities/Enemy.js';
import type { BattleManager } from './BattleManager.js';

/**
 * Spawn one reinforcement enemy and register it with the manager.
 *
 * @param enemyKey  textureKey passed to Enemy constructor (default: 'compliance_drone')
 * @param manager   The active BattleManager instance
 */
export function spawnReinforcement(
  enemyKey: string,
  manager:  BattleManager,
): void {
  const reinforcement = new Enemy(manager.scene as unknown as Phaser.Scene, enemyKey);

  // Register on the manager so future milestones can tick and render it
  manager.reinforcements.push(reinforcement);

  manager.dialogueManager.show('SYSTEM', [
    `REINFORCEMENT DISPATCHED: ${reinforcement.name} joins the fight!`,
  ]);
}

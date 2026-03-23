import type { BattleManager } from './BattleManager.js';

/**
 * Abstract base class for all battle states.
 */
export class BattleState {
  protected readonly manager: BattleManager;

  constructor(manager: BattleManager) {
    this.manager = manager;
  }

  enter(): void               {}
  update(_time: number, _delta: number): void {}
  exit(): void                {}
}

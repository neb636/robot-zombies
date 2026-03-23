import type { BattleState } from './BattleState.js';

/**
 * Generic finite state machine for the battle system.
 */
export class BattleStateMachine {
  private _states:     Map<string, BattleState> = new Map();
  private _current:    BattleState | null = null;
  private _currentKey: string | null = null;

  addState(key: string, stateInstance: BattleState): this {
    this._states.set(key, stateInstance);
    return this;
  }

  transition(key: string): void {
    if (!this._states.has(key)) throw new Error(`Unknown state: "${key}"`);
    this._current?.exit();
    this._currentKey = key;
    this._current    = this._states.get(key)!;
    this._current.enter();
  }

  update(time: number, delta: number): void {
    this._current?.update(time, delta);
  }

  get currentKey(): string | null { return this._currentKey; }
}

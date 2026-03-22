/**
 * Generic finite state machine for the battle system.
 */
export class BattleStateMachine {
  constructor() {
    this._states     = new Map();
    this._current    = null;
    this._currentKey = null;
  }

  addState(key, stateInstance) {
    this._states.set(key, stateInstance);
    return this;
  }

  transition(key) {
    if (!this._states.has(key)) throw new Error(`Unknown state: "${key}"`);
    this._current?.exit();
    this._currentKey = key;
    this._current    = this._states.get(key);
    this._current.enter();
  }

  update(time, delta) {
    this._current?.update(time, delta);
  }

  get currentKey() { return this._currentKey; }
}

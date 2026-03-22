/**
 * Abstract base class for all battle states.
 */
export class BattleState {
  /** @param {import('./BattleManager.js').BattleManager} manager */
  constructor(manager) {
    this.manager = manager;
  }

  enter()               {}
  update(_time, _delta) {}
  exit()                {}
}

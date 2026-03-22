import { BattleState } from '../BattleState.js';

/**
 * ANIMATING — generic "wait for tween/animation to finish" state.
 * Set manager.animationCallback and manager.animationNextState before transitioning.
 */
export class AnimatingState extends BattleState {
  enter() {
    this._done = false;
    const cb = this.manager.animationCallback;
    if (cb) cb(() => { this._done = true; });
    else    this._done = true;
  }

  update() {
    if (this._done && this.manager.animationNextState) {
      this.manager.goTo(this.manager.animationNextState);
    }
  }
}

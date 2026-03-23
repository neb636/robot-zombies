import { BattleState } from '../BattleState.js';

/**
 * ANIMATING — generic "wait for tween/animation to finish" state.
 * Set manager.animationCallback and manager.animationNextState before transitioning.
 */
export class AnimatingState extends BattleState {
  private _done: boolean = false;

  enter(): void {
    this._done = false;
    const cb = this.manager.animationCallback;
    if (cb) {
      cb(() => { this._done = true; });
    } else {
      this._done = true;
    }
  }

  update(_time: number, _delta: number): void {
    if (this._done && this.manager.animationNextState) {
      this.manager.goTo(this.manager.animationNextState);
    }
  }
}

import { BattleState }  from '../BattleState.js';
import { BATTLE_STATES } from '../../utils/constants.js';

export class EnemyTurnState extends BattleState {
  private _timer: number = 0;
  private readonly _delay: number = 1200;
  private _acted: boolean = false;

  enter(): void {
    this._timer = 0;
    this._acted = false;
    const { enemy, dialogueManager } = this.manager;

    if ('play' in enemy.sprite) {
      (enemy.sprite as Phaser.GameObjects.Sprite).play('robot-attack');
    }
    dialogueManager.show(enemy.name, [enemy.getTauntLine()]);
  }

  update(_time: number, delta: number): void {
    if (this._acted) return;
    this._timer += delta;
    if (this._timer >= this._delay) {
      this._acted = true;
      this._act();
    }
  }

  private _act(): void {
    const { enemy, player, audioManager } = this.manager;
    const action = enemy.chooseAction();

    if (action.type === 'ATTACK') {
      const dead = player.takeDamage(action.damage);
      audioManager.playSfx('sfx-attack');

      if ('play' in enemy.sprite) {
        (enemy.sprite as Phaser.GameObjects.Sprite).play('robot-idle');
      }
      this.manager.goTo(dead ? BATTLE_STATES.DEFEAT : BATTLE_STATES.PLAYER_TURN);
    }
  }
}

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
      let { damage } = action;

      // Back-row members take 70% physical damage
      if (player.row === 'back') {
        damage = Math.floor(damage * 0.7);
      }

      // In scripted battles, clamp damage so player never dies
      if (this.manager.scripted && player.hp - damage <= 0) {
        damage = Math.max(0, player.hp - 1);
      }

      const dead = player.takeDamage(damage);
      audioManager.playSfx('sfx-attack');

      if ('play' in enemy.sprite) {
        (enemy.sprite as Phaser.GameObjects.Sprite).play('robot-idle');
      }

      if (dead) {
        this.manager.goTo(BATTLE_STATES.DEFEAT);
        return;
      }

      // Check boss thresholds after enemy acts (in case of counter-effects later)
      const bossState = this.manager.checkBossThresholds();
      if (bossState) {
        this.manager.goTo(bossState);
        return;
      }

      this.manager.goTo(BATTLE_STATES.PLAYER_TURN);
    }
  }
}

import { BattleState }  from '../BattleState.js';
import { BATTLE_STATES } from '../../utils/constants.js';

export class EnemyTurnState extends BattleState {
  constructor(manager) {
    super(manager);
    this._timer = 0;
    this._delay = 1200;
    this._acted = false;
  }

  enter() {
    this._timer = 0;
    this._acted = false;
    const { enemy, dialogueManager, audioManager } = this.manager;

    if (enemy.sprite.play) enemy.sprite.play('robot-attack');
    audioManager.speakRobotLine(enemy.getTauntLine());
    dialogueManager.show(enemy.name, [enemy.getTauntLine()]);
  }

  update(_time, delta) {
    if (this._acted) return;
    this._timer += delta;
    if (this._timer >= this._delay) {
      this._acted = true;
      this._act();
    }
  }

  _act() {
    const { enemy, player, audioManager } = this.manager;
    const action = enemy.chooseAction();

    if (action.type === 'ATTACK') {
      const dead = player.takeDamage(action.damage);
      audioManager.playSfx('sfx-attack');

      if (enemy.sprite.play) enemy.sprite.play('robot-idle');
      this.manager.goTo(dead ? BATTLE_STATES.DEFEAT : BATTLE_STATES.PLAYER_TURN);
    }
  }
}

import { Enemy }             from '../entities/Enemy.js';
import { BattleStateMachine } from './BattleStateMachine.js';
import { PlayerTurnState }   from './states/PlayerTurnState.js';
import { EnemyTurnState }    from './states/EnemyTurnState.js';
import { AnimatingState }    from './states/AnimatingState.js';
import { VictoryState }      from './states/VictoryState.js';
import { DefeatState }       from './states/DefeatState.js';
import { BATTLE_STATES, BASE_PLAYER_HP, BASE_PLAYER_ATK } from '../utils/constants.js';

export class BattleManager {
  constructor(scene, { enemyKey, hud, audioManager, dialogueManager }) {
    this.scene           = scene;
    this.hud             = hud;
    this.audioManager    = audioManager;
    this.dialogueManager = dialogueManager;

    this.player = this._buildBattlePlayer();
    this.enemy  = new Enemy(scene, enemyKey);

    this.fsm = new BattleStateMachine();
    this._registerStates();
  }

  start() {
    this.hud.bind(this.player, this.enemy);
    this.dialogueManager.show(this.enemy.name, [this.enemy.getTauntLine()]);
    this.fsm.transition(BATTLE_STATES.PLAYER_TURN);
  }

  update(time, delta) {
    this.fsm.update(time, delta);
    this.hud.update();
  }

  goTo(stateKey) {
    this.fsm.transition(stateKey);
  }

  endBattle(victory) {
    this.scene.endBattle(victory);
  }

  _registerStates() {
    this.fsm
      .addState(BATTLE_STATES.PLAYER_TURN, new PlayerTurnState(this))
      .addState(BATTLE_STATES.ENEMY_TURN,  new EnemyTurnState(this))
      .addState(BATTLE_STATES.ANIMATING,   new AnimatingState(this))
      .addState(BATTLE_STATES.VICTORY,     new VictoryState(this))
      .addState(BATTLE_STATES.DEFEAT,      new DefeatState(this));
  }

  _buildBattlePlayer() {
    const { width, height } = this.scene.scale;

    let sprite;
    if (this.scene.textures.exists('hero')) {
      sprite = this.scene.add.sprite(width * 0.25, height * 0.55, 'hero');
      sprite.setScale(2);
      sprite.play('hero-idle');
    } else {
      sprite = this.scene.add.rectangle(width * 0.25, height * 0.55, 32, 48, 0x4488ff);
    }

    return {
      sprite,
      name:   'Kai',
      hp:     BASE_PLAYER_HP,
      maxHp:  BASE_PLAYER_HP,
      attack: BASE_PLAYER_ATK,
      takeDamage(amount) { this.hp = Math.max(0, this.hp - amount); return this.hp <= 0; },
      heal(amount)       { this.hp = Math.min(this.maxHp, this.hp + amount); },
      isAlive()          { return this.hp > 0; },
    };
  }
}

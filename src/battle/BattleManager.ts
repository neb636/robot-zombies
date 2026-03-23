import Phaser from 'phaser';
import { Enemy }             from '../entities/Enemy.js';
import { BattleStateMachine } from './BattleStateMachine.js';
import { PlayerTurnState }   from './states/PlayerTurnState.js';
import { EnemyTurnState }    from './states/EnemyTurnState.js';
import { AnimatingState }    from './states/AnimatingState.js';
import { VictoryState }      from './states/VictoryState.js';
import { DefeatState }       from './states/DefeatState.js';
import { BATTLE_STATES, BASE_PLAYER_HP, BASE_PLAYER_ATK } from '../utils/constants.js';
import type { BattlePlayer, IBattleScene } from '../types.js';
import type { BattleHUD }      from '../ui/BattleHUD.js';
import type { AudioManager }   from '../audio/AudioManager.js';
import type { DialogueManager } from '../dialogue/DialogueManager.js';

interface BattleManagerOptions {
  enemyKey:        string;
  hud:             BattleHUD;
  audioManager:    AudioManager;
  dialogueManager: DialogueManager;
}

export class BattleManager {
  readonly scene:           IBattleScene;
  readonly hud:             BattleHUD;
  readonly audioManager:    AudioManager;
  readonly dialogueManager: DialogueManager;
  readonly player:          BattlePlayer;
  readonly enemy:           Enemy;
  readonly fsm:             BattleStateMachine;

  /** Set before entering ANIMATING state; called with a done() callback. */
  animationCallback: ((done: () => void) => void) | null = null;
  /** State key to transition to after animation completes. */
  animationNextState: string | null = null;

  constructor(scene: Phaser.Scene, options: BattleManagerOptions) {
    this.scene           = scene as IBattleScene;
    this.hud             = options.hud;
    this.audioManager    = options.audioManager;
    this.dialogueManager = options.dialogueManager;

    this.player = this._buildBattlePlayer();
    this.enemy  = new Enemy(scene, options.enemyKey);

    this.fsm = new BattleStateMachine();
    this._registerStates();
  }

  start(): void {
    this.hud.bind(this.player, this.enemy);
    this.dialogueManager.show(this.enemy.name, [this.enemy.getTauntLine()]);
    this.fsm.transition(BATTLE_STATES.PLAYER_TURN);
  }

  update(time: number, delta: number): void {
    this.fsm.update(time, delta);
    this.hud.update();
  }

  goTo(stateKey: string): void {
    this.fsm.transition(stateKey);
  }

  endBattle(victory: boolean): void {
    this.scene.endBattle(victory);
  }

  private _registerStates(): void {
    this.fsm
      .addState(BATTLE_STATES.PLAYER_TURN, new PlayerTurnState(this))
      .addState(BATTLE_STATES.ENEMY_TURN,  new EnemyTurnState(this))
      .addState(BATTLE_STATES.ANIMATING,   new AnimatingState(this))
      .addState(BATTLE_STATES.VICTORY,     new VictoryState(this))
      .addState(BATTLE_STATES.DEFEAT,      new DefeatState(this));
  }

  private _buildBattlePlayer(): BattlePlayer {
    const { width, height } = this.scene.scale;

    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
    if (this.scene.textures.exists('hero')) {
      const s = this.scene.add.sprite(width * 0.25, height * 0.55, 'hero');
      s.setScale(2);
      s.play('hero-idle');
      sprite = s;
    } else {
      sprite = this.scene.add.rectangle(width * 0.25, height * 0.55, 32, 48, 0x4488ff);
    }

    return {
      sprite,
      name:   'Kai',
      hp:     BASE_PLAYER_HP,
      maxHp:  BASE_PLAYER_HP,
      attack: BASE_PLAYER_ATK,
      takeDamage(amount: number): boolean { this.hp = Math.max(0, this.hp - amount); return this.hp <= 0; },
      heal(amount: number):       void    { this.hp = Math.min(this.maxHp, this.hp + amount); },
      isAlive():                  boolean { return this.hp > 0; },
    };
  }
}

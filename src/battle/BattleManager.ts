import Phaser from 'phaser';
import { Enemy }             from '../entities/Enemy.js';
import { BattleStateMachine } from './BattleStateMachine.js';
import { ATBTickingState }   from './states/ATBTickingState.js';
import { PlayerTurnState }   from './states/PlayerTurnState.js';
import { EnemyTurnState }    from './states/EnemyTurnState.js';
import { AnimatingState }    from './states/AnimatingState.js';
import { VictoryState }      from './states/VictoryState.js';
import { DefeatState }       from './states/DefeatState.js';
import { AllyTurnState }           from './states/AllyTurnState.js';
import { BossPhaseTransitionState } from './states/BossPhaseTransitionState.js';
import { MarcusConversionState }    from './states/MarcusConversionState.js';
import { BATTLE_STATES, BASE_PLAYER_HP } from '../utils/constants.js';
import type { ATBCombatant, IBattleScene, BattleInitData, AllyConfig, BossConfig } from '../types.js';
import type { BattleHUD }      from '../ui/BattleHUD.js';
import type { AudioManager }   from '../audio/AudioManager.js';
import type { DialogueManager } from '../dialogue/DialogueManager.js';

/** Player Ch.1 stats (from planning/character_stats.md). */
const PLAYER_STATS = {
  str: 18, def: 12, int: 8, spd: 14, lck: 10,
} as const;

/** Marcus stats (Prologue only). */
const MARCUS_STATS = {
  str: 14, def: 8, int: 6, spd: 10, lck: 12,
} as const;

interface BattleManagerOptions {
  initData:        BattleInitData;
  hud:             BattleHUD;
  audioManager:    AudioManager;
  dialogueManager: DialogueManager;
}

export class BattleManager {
  readonly scene:           IBattleScene;
  readonly hud:             BattleHUD;
  readonly audioManager:    AudioManager;
  readonly dialogueManager: DialogueManager;
  readonly player:          ATBCombatant;
  readonly enemy:           Enemy;
  readonly fsm:             BattleStateMachine;

  readonly allies: ATBCombatant[] = [];
  readonly scripted: boolean;
  readonly bossConfig: BossConfig | null;
  currentBossPhase = 0;

  /** The combatant whose ATB just filled and is waiting for player input. */
  activeMenuCombatant: ATBCombatant | null = null;

  /** Last party action record — used by ComboSystem (2G). */
  lastPartyAction: { name: string; ts: number } | null = null;

  /** Set of discovered combo IDs (populated in 2G). */
  discoveredCombos: Set<string> = new Set();

  /** Set before entering ANIMATING state; called with a done() callback. */
  animationCallback: ((done: () => void) => void) | null = null;
  /** State key to transition to after animation completes. */
  animationNextState: string | null = null;

  constructor(scene: Phaser.Scene, options: BattleManagerOptions) {
    this.scene           = scene as IBattleScene;
    this.hud             = options.hud;
    this.audioManager    = options.audioManager;
    this.dialogueManager = options.dialogueManager;

    const { initData } = options;
    this.scripted   = initData.scripted ?? false;
    this.bossConfig = initData.bossConfig ?? null;

    this.player = this._buildBattlePlayer();
    this.enemy  = new Enemy(scene, initData.enemyKey);

    if (initData.allies) {
      for (const cfg of initData.allies) {
        this.allies.push(this._buildAlly(cfg, this.allies.length));
      }
    }

    this.fsm = new BattleStateMachine();
    this._registerStates();
  }

  start(): void {
    this.hud.bind(this.player, this.enemy, this.allies.length > 0 ? this.allies : undefined);
    this.dialogueManager.show(this.enemy.name, [this.enemy.getTauntLine()]);
    this.fsm.transition(BATTLE_STATES.ATB_TICKING);
  }

  update(time: number, delta: number): void {
    this.fsm.update(time, delta);
    this.hud.update(delta);
  }

  goTo(stateKey: string): void {
    this.fsm.transition(stateKey);
  }

  endBattle(victory: boolean): void {
    this.scene.endBattle(victory);
  }

  /** Pause the ATB tick loop (called by PlayerTurnState on enter). */
  pauseATB(): void {
    const atb = this.fsm.getState(BATTLE_STATES.ATB_TICKING);
    if (atb instanceof ATBTickingState) atb.pause();
  }

  /** Resume the ATB tick loop (called by PlayerTurnState on exit). */
  resumeATB(): void {
    const atb = this.fsm.getState(BATTLE_STATES.ATB_TICKING);
    if (atb instanceof ATBTickingState) atb.resume();
  }

  removeAlly(name: string): void {
    const idx = this.allies.findIndex(a => a.name === name);
    if (idx !== -1) {
      const ally = this.allies[idx]!;
      ally.sprite.destroy();
      this.allies.splice(idx, 1);
      this.hud.removeAlly(name);
    }
  }

  /** Check if boss HP crossed a phase threshold or conversion trigger. */
  checkBossThresholds(): string | null {
    if (!this.bossConfig) return null;

    const hpPct = this.enemy.hp / this.enemy.maxHp;

    // Check conversion trigger first (fires once, at ~40% HP)
    if (
      this.bossConfig.conversionTriggerHp !== undefined &&
      hpPct <= this.bossConfig.conversionTriggerHp &&
      this.allies.some(a => a.name === 'MARCUS')
    ) {
      return BATTLE_STATES.MARCUS_CONVERSION;
    }

    // Check phase transitions
    const nextPhase = this.bossConfig.phases[this.currentBossPhase];
    if (nextPhase && hpPct <= nextPhase.hpThreshold) {
      return BATTLE_STATES.BOSS_PHASE_TRANSITION;
    }

    return null;
  }

  /** Legacy helper kept for states that haven't migrated to ATB yet. */
  getNextTurnState(): string {
    return BATTLE_STATES.ATB_TICKING;
  }

  private _registerStates(): void {
    this.fsm
      .addState(BATTLE_STATES.ATB_TICKING,            new ATBTickingState(this))
      .addState(BATTLE_STATES.PLAYER_TURN,             new PlayerTurnState(this))
      .addState(BATTLE_STATES.ALLY_TURN,               new AllyTurnState(this))
      .addState(BATTLE_STATES.ENEMY_TURN,              new EnemyTurnState(this))
      .addState(BATTLE_STATES.ANIMATING,               new AnimatingState(this))
      .addState(BATTLE_STATES.BOSS_PHASE_TRANSITION,   new BossPhaseTransitionState(this))
      .addState(BATTLE_STATES.MARCUS_CONVERSION,       new MarcusConversionState(this))
      .addState(BATTLE_STATES.VICTORY,                 new VictoryState(this))
      .addState(BATTLE_STATES.DEFEAT,                  new DefeatState(this));
  }

  private _buildBattlePlayer(): ATBCombatant {
    const { width, height } = this.scene.scale;
    const playerName = (this.scene.registry.get('playerName') as string | undefined) ?? 'KAI';

    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
    if (this.scene.textures.exists('hero')) {
      const s = this.scene.add.sprite(width * 0.25, height * 0.55, 'hero');
      s.setScale(2);
      s.play('hero-idle');
      sprite = s;
    } else {
      sprite = this.scene.add.rectangle(width * 0.25, height * 0.55, 32, 48, 0x4488ff);
    }

    const hp = BASE_PLAYER_HP;
    return {
      sprite,
      name:   playerName,
      hp,
      maxHp:  hp,
      attack: PLAYER_STATS.str,
      str:    PLAYER_STATS.str,
      def:    PLAYER_STATS.def,
      int:    PLAYER_STATS.int,
      spd:    PLAYER_STATS.spd,
      lck:    PLAYER_STATS.lck,
      atb:    0,
      statuses:     [],
      techs:        [],
      tags:         [],
      tagsRevealed: false,
      takeDamage(amount: number): boolean { this.hp = Math.max(0, this.hp - amount); return this.hp <= 0; },
      heal(amount: number):       void    { this.hp = Math.min(this.maxHp, this.hp + amount); },
      isAlive():                  boolean { return this.hp > 0; },
    };
  }

  private _buildAlly(config: AllyConfig, index: number): ATBCombatant {
    const { width, height } = this.scene.scale;
    const x = width * 0.15;
    const y = height * 0.45 + index * 60;

    const sprite = this.scene.add.rectangle(x, y, 28, 42, config.color);

    // Use Marcus stats for the 'MARCUS' ally; fall back to config.attack for unknowns
    const isMarcus = config.name === 'MARCUS';
    const str      = isMarcus ? MARCUS_STATS.str  : config.attack;
    const def      = isMarcus ? MARCUS_STATS.def  : 6;
    const int_     = isMarcus ? MARCUS_STATS.int  : 4;
    const spd      = isMarcus ? MARCUS_STATS.spd  : 8;
    const lck      = isMarcus ? MARCUS_STATS.lck  : 8;

    return {
      sprite,
      name:   config.name,
      hp:     config.hp,
      maxHp:  config.maxHp,
      attack: config.attack,
      str,
      def,
      int:    int_,
      spd,
      lck,
      atb:    0,
      statuses:     [],
      techs:        [],
      tags:         [],
      tagsRevealed: false,
      takeDamage(amount: number): boolean { this.hp = Math.max(0, this.hp - amount); return this.hp <= 0; },
      heal(amount: number):       void    { this.hp = Math.min(this.maxHp, this.hp + amount); },
      isAlive():                  boolean { return this.hp > 0; },
    };
  }
}

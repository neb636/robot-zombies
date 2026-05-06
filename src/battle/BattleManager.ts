import Phaser from 'phaser';
import { Enemy }             from '../entities/Enemy.js';
import { spawnReinforcement as _spawnReinforcement } from './EnemyReinforcement.js';
import { checkCombo, dispatchComboBonus }            from './ComboSystem.js';
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
import { BATTLE_STATES } from '../utils/constants.js';
import { PartyManager } from '../party/PartyManager.js';
import { CHARACTER_REGISTRY, PLAYER_DEF } from '../characters/index.js';
import type { ATBCombatant, IBattleScene, BattleInitData, AllyConfig, BossConfig } from '../types.js';
import type { BattleHUD }      from '../ui/BattleHUD.js';
import type { AudioManager }   from '../audio/AudioManager.js';
import type { DialogueManager } from '../dialogue/DialogueManager.js';

/** Marcus fallback stats used when the CHARACTER_REGISTRY entry is absent. */
const MARCUS_FALLBACK_STATS = {
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
  /** Reinforcement enemies spawned mid-battle (tracked; not yet ticked by ATB). */
  readonly reinforcements: Enemy[] = [];
  readonly scripted: boolean;
  readonly bossConfig: BossConfig | null;
  currentBossPhase = 0;

  /** The combatant whose ATB just filled and is waiting for player input. */
  activeMenuCombatant: ATBCombatant | null = null;

  /** Last party action record — used by ComboSystem (2G). */
  lastPartyAction: { name: string; ts: number } | null = null;

  /** Set of discovered combo IDs (populated in 2G). */
  discoveredCombos: Set<string> = new Set();

  /** Tracks whether Last Stand passive has already fired this battle. */
  lastStandActive: boolean = false;

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

    // Use explicit allies if provided; otherwise fall back to the party registry
    const allyConfigs: AllyConfig[] = initData.allies
      ?? new PartyManager(scene.registry).toAllyConfigs();
    for (const cfg of allyConfigs) {
      this.allies.push(this._buildAlly(cfg, this.allies.length));
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

  /**
   * Spawn a reinforcement enemy by key.
   * Delegates to EnemyReinforcement.spawnReinforcement.
   */
  spawnReinforcement(enemyKey: string): void {
    _spawnReinforcement(enemyKey, this);
  }

  /**
   * Record a party action for combo detection and dispatch any bonus effect.
   * Use this in place of the inline _recordAndCheckCombo in PlayerTurnState
   * once the orchestrator wires the call sites.
   *
   * @param actorName  Lowercase name fragment of the acting combatant
   * @returns          The combo label if one fired, or null
   */
  recordAndDispatchCombo(actorName: string): string | null {
    const now  = performance.now();
    const prev = this.lastPartyAction;

    const combo = checkCombo(actorName, now, prev?.name ?? null, prev?.ts ?? null);
    if (combo) {
      this.hud.flashComboName(combo.label);
      this.discoveredCombos.add(combo.id);
      dispatchComboBonus(combo, this, this.enemy);
    }

    this.lastPartyAction = { name: actorName, ts: now };
    return combo?.label ?? null;
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
    const playerName = (this.scene.registry.get('playerName') as string | undefined) ?? 'Arlo';
    const chapter    = (this.scene.registry.get('chapter')    as number | undefined) ?? 0;

    const statIdx = Math.min(chapter, PLAYER_DEF.chapterStats.length - 1);
    const s       = PLAYER_DEF.chapterStats[statIdx]!;

    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
    if (this.scene.textures.exists('hero')) {
      const sp = this.scene.add.sprite(width * 0.25, height * 0.55, 'hero');
      sp.setScale(2.25);
      sp.play('hero-idle');
      sprite = sp;
    } else {
      sprite = this.scene.add.rectangle(width * 0.25, height * 0.55, 32, 48, PLAYER_DEF.color);
    }

    return {
      sprite,
      name:   playerName,
      hp:     s.hp,
      maxHp:  s.maxHp,
      attack: s.str,
      row:    'front' as const,
      str:    s.str,
      def:    s.def,
      int:    s.int,
      spd:    s.spd,
      lck:    s.lck,
      atb:    0,
      statuses:     [],
      techs:        PLAYER_DEF.techs,
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

    // Look up full ATB stats from CHARACTER_REGISTRY if the ally has an id
    const charDef      = config.id ? CHARACTER_REGISTRY[config.id] : undefined;
    const isMarcus     = !charDef && config.name === 'MARCUS';
    const chapter      = (this.scene.registry.get('chapter') as number | undefined) ?? 0;

    let str: number, def_: number, int_: number, spd: number, lck: number;
    if (charDef) {
      const statIdx = Math.max(0, Math.min(chapter - charDef.joinChapter, charDef.chapterStats.length - 1));
      const s = charDef.chapterStats[statIdx]!;
      str  = s.str;  def_ = s.def;  int_ = s.int;  spd  = s.spd;  lck  = s.lck;
    } else if (isMarcus) {
      str = MARCUS_FALLBACK_STATS.str; def_ = MARCUS_FALLBACK_STATS.def; int_ = MARCUS_FALLBACK_STATS.int;
      spd = MARCUS_FALLBACK_STATS.spd; lck  = MARCUS_FALLBACK_STATS.lck;
    } else {
      str = config.attack; def_ = 6; int_ = 4; spd = 8; lck = 8;
    }

    return {
      sprite,
      name:   config.name,
      hp:     config.hp,
      maxHp:  config.maxHp,
      attack: config.attack,
      row:    config.row ?? 'front',
      str,
      def:    def_,
      int:    int_,
      spd,
      lck,
      atb:    0,
      statuses:     [],
      techs:        charDef?.techs ?? [],
      tags:         [],
      tagsRevealed: false,
      takeDamage(amount: number): boolean { this.hp = Math.max(0, this.hp - amount); return this.hp <= 0; },
      heal(amount: number):       void    { this.hp = Math.min(this.maxHp, this.hp + amount); },
      isAlive():                  boolean { return this.hp > 0; },
    };
  }
}

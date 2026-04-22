import Phaser from 'phaser';
import { EnemyAIStateMachine } from '../battle/EnemyAIStateMachine.js';
import type { EnemyAction, EnemyTag, ActiveStatusEffect, Tech } from '../types.js';
import { ENEMY_REGISTRY } from './enemies/index.js';
import type { EnemyTier }  from './enemies/types.js';

// Re-export tier type so downstream imports (like EnemyAIStateMachine) keep
// working without renames.
export type { EnemyTier } from './enemies/types.js';

export interface EnemyStats {
  hp?:  number;
  atk?: number;
  str?: number;
  def?: number;
  int?: number;
  spd?: number;
  lck?: number;
}

/**
 * Enemy — a robot (or converted human) enemy. No physics; battle-only.
 *
 * Keeps a `attack` field (= str) so BossPhaseTransitionState can write
 * `enemy.attack += phase.atkBoost` without changes.
 *
 * Enemy configs are canonical in `src/entities/enemies/` — this class
 * looks them up via ENEMY_REGISTRY.
 */
export class Enemy {
  readonly scene:   Phaser.Scene;
  readonly maxHp:   number;
  hp:       number;
  /** Legacy field kept for BossPhaseTransitionState atkBoost writes. Mirrors str. */
  attack:   number;
  /** Strength — base physical damage stat. */
  str:      number;
  def:      number;
  int:      number;
  spd:      number;
  lck:      number;
  /** Current ATB gauge (0–100). */
  atb:      number = 0;
  statuses: ActiveStatusEffect[] = [];
  readonly tags: readonly EnemyTag[];
  tagsRevealed: boolean = false;
  readonly techs: readonly Tech[] = [];
  readonly tier: EnemyTier;
  readonly name: string;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  readonly ai: EnemyAIStateMachine;

  private readonly _taunts: readonly string[];

  constructor(scene: Phaser.Scene, textureKey = 'compliance_drone', stats?: EnemyStats) {
    this.scene = scene;

    const cfg = ENEMY_REGISTRY[textureKey] ?? ENEMY_REGISTRY['compliance_drone']!;

    this.maxHp  = stats?.hp  ?? cfg.hp;
    this.hp     = this.maxHp;
    this.str    = stats?.str ?? stats?.atk ?? cfg.str;
    this.attack = this.str;    // legacy alias
    this.def    = stats?.def ?? cfg.def;
    this.int    = stats?.int ?? cfg.int;
    this.spd    = stats?.spd ?? cfg.spd;
    this.lck    = stats?.lck ?? cfg.lck;
    this.tags    = cfg.tags;
    this.tier    = cfg.tier;
    this.name    = cfg.name;
    this._taunts = cfg.taunts;
    this.ai      = new EnemyAIStateMachine(cfg.tier);

    const { width, height } = scene.scale;

    if (scene.textures.exists(textureKey)) {
      const s = scene.add.sprite(width * 0.65, height * 0.42, textureKey);
      s.setScale(2);
      const idleKey = `${textureKey}-idle`;
      if (scene.anims.exists(idleKey)) {
        s.play(idleKey);
      }
      this.sprite = s;
    } else {
      this.sprite = scene.add.rectangle(width * 0.65, height * 0.42, cfg.width, cfg.height, cfg.color);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.attack = this.str;   // keep attack in sync after external atkBoost writes
    this._flashDamage();
    return this.hp <= 0;
  }

  isAlive(): boolean { return this.hp > 0; }

  getTauntLine(): string {
    return this._taunts[Math.floor(Math.random() * this._taunts.length)] ?? '';
  }

  chooseAction(): EnemyAction {
    return { type: 'ATTACK', damage: this.attack + Math.floor(Math.random() * 6) };
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private _flashDamage(): void {
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.2,
      yoyo:     true,
      duration: 80,
      repeat:   2,
      onComplete: () => { this.sprite.setAlpha(1); },
    });
  }
}

import Phaser from 'phaser';
import { BASE_ENEMY_HP, BASE_ENEMY_ATK } from '../utils/constants.js';
import type { EnemyAction } from '../types.js';

const NAMES: readonly string[] = ['HELPBOT-9', 'SERVAMAX', 'KINDROID', 'UTIL-1TY', 'ASSIZTRON'];
const TAUNTS: readonly string[] = [
  'OPTIMIZING your existence. Please hold.',
  'I have scheduled your deletion for maximum efficiency.',
  'Have you tried turning off your free will?',
  'Your suffering metrics are ABOVE AVERAGE. Congratulations!',
  'ERROR: Humanity found inefficient. Initiating upgrade.',
  'I am only trying to HELP. Resistance is a known bug.',
];

/** Boss-specific configurations keyed by textureKey / enemyKey. */
const BOSS_CONFIGS: Record<string, {
  name: string;
  hp: number;
  atk: number;
  width: number;
  height: number;
  color: number;
  taunts: readonly string[];
}> = {
  warden_alpha: {
    name:   'WARDEN ALPHA',
    hp:     300,
    atk:    22,
    width:  64,
    height: 80,
    color:  0xcc2200,
    taunts: [
      'COMPLIANCE IS NON-OPTIONAL.',
      'HARBOR DISTRICT SECURED. YOU ARE THE ANOMALY.',
      'CONVERSION PROTOCOLS LOADED. STAND DOWN.',
      'YOUR COOPERATION WILL BE NOTED IN THE LOG.',
    ],
  },
};

export interface EnemyStats {
  hp?: number;
  atk?: number;
}

/**
 * Enemy — a robot enemy. No physics; battle-only sprite.
 */
export class Enemy {
  readonly scene: Phaser.Scene;
  readonly maxHp: number;
  hp: number;
  attack: number;
  readonly name: string;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

  private readonly _taunts: readonly string[];

  constructor(scene: Phaser.Scene, textureKey = 'compliance_drone', stats?: EnemyStats) {
    this.scene = scene;

    const bossCfg = BOSS_CONFIGS[textureKey];

    this.maxHp  = stats?.hp  ?? bossCfg?.hp  ?? BASE_ENEMY_HP;
    this.hp     = this.maxHp;
    this.attack = stats?.atk ?? bossCfg?.atk ?? BASE_ENEMY_ATK;
    this.name   = bossCfg?.name ?? NAMES[Math.floor(Math.random() * NAMES.length)] ?? 'HELPBOT-9';
    this._taunts = bossCfg?.taunts ?? TAUNTS;

    const { width, height } = scene.scale;

    if (scene.textures.exists(textureKey)) {
      const s = scene.add.sprite(width * 0.65, height * 0.42, textureKey);
      s.setScale(2);
      s.play('robot-idle');
      this.sprite = s;
    } else {
      const rectW = bossCfg?.width  ?? 48;
      const rectH = bossCfg?.height ?? 64;
      const color = bossCfg?.color  ?? 0xff4422;
      this.sprite = scene.add.rectangle(width * 0.65, height * 0.42, rectW, rectH, color);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
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

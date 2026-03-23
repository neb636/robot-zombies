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

/**
 * Enemy — a robot zombie. No physics; battle-only sprite.
 */
export class Enemy {
  readonly scene: Phaser.Scene;
  readonly maxHp: number;
  hp: number;
  readonly attack: number;
  readonly name: string;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, textureKey = 'robot_zombie') {
    this.scene  = scene;
    this.maxHp  = BASE_ENEMY_HP;
    this.hp     = this.maxHp;
    this.attack = BASE_ENEMY_ATK;
    this.name   = NAMES[Math.floor(Math.random() * NAMES.length)] ?? 'HELPBOT-9';

    const { width, height } = scene.scale;

    if (scene.textures.exists(textureKey)) {
      const s = scene.add.sprite(width * 0.65, height * 0.42, textureKey);
      s.setScale(2);
      s.play('robot-idle');
      this.sprite = s;
    } else {
      this.sprite = scene.add.rectangle(width * 0.65, height * 0.42, 48, 64, 0xff4422);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this._flashDamage();
    return this.hp <= 0;
  }

  isAlive(): boolean { return this.hp > 0; }

  getTauntLine(): string {
    return TAUNTS[Math.floor(Math.random() * TAUNTS.length)] ?? '';
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

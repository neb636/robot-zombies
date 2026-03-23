import Phaser from 'phaser';
import { AnimatedSprite } from './Sprite.js';
import { BASE_PLAYER_HP, BASE_PLAYER_ATK } from '../utils/constants.js';
import type { WasdKeys } from '../types.js';

interface SceneWithInput {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: WasdKeys;
}

export class Player extends AnimatedSprite {
  readonly maxHp: number;
  hp: number;
  readonly attack: number;
  readonly level: number;
  name: string;
  readonly speed: number;
  isMoving: boolean;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');

    this.maxHp  = BASE_PLAYER_HP;
    this.hp     = this.maxHp;
    this.attack = BASE_PLAYER_ATK;
    this.level  = 1;
    this.name   = (scene.registry.get('playerName') as string | undefined) ?? 'KAI';
    this.speed    = 160;
    this.isMoving = false;

    this.sprite.setCollideWorldBounds(true);

    if (this.scene.textures.exists('hero')) {
      this.playAnim('hero-idle');
    } else {
      this._buildPlaceholderGraphic(x, y);
    }
  }

  update(): void {
    const { cursors, wasd } = this.scene as unknown as SceneWithInput;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);
    this.isMoving = false;

    if (cursors.left.isDown || wasd.A.isDown) {
      body.setVelocityX(-this.speed);
      this.playAnim('hero-walk-left');
      this.isMoving = true;
    } else if (cursors.right.isDown || wasd.D.isDown) {
      body.setVelocityX(this.speed);
      this.playAnim('hero-walk-right');
      this.isMoving = true;
    }

    if (cursors.up.isDown || wasd.W.isDown) {
      body.setVelocityY(-this.speed);
      if (!this.isMoving) this.playAnim('hero-walk-up');
      this.isMoving = true;
    } else if (cursors.down.isDown || wasd.S.isDown) {
      body.setVelocityY(this.speed);
      if (!this.isMoving) this.playAnim('hero-walk-down');
      this.isMoving = true;
    }

    if (!this.isMoving) this.playAnim('hero-idle');

    body.velocity.normalize().scale(this.speed);
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  private _buildPlaceholderGraphic(x: number, y: number): void {
    this.scene.add.rectangle(x, y, 24, 32, 0x4488ff);
    this.sprite.setVisible(false);
  }
}

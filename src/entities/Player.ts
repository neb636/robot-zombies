import Phaser from 'phaser';
import { AnimatedSprite } from './Sprite.js';
import { BASE_PLAYER_HP, BASE_PLAYER_ATK } from '../utils/constants.js';
import type { WasdKeys } from '../types.js';
import type { MobileControls } from '../utils/MobileControls.js';

interface SceneWithInput {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: WasdKeys;
  mobileControls?: MobileControls;
}

type Dir8 =
  | 'south' | 'south-east' | 'east' | 'north-east'
  | 'north' | 'north-west' | 'west' | 'south-west';

export class Player extends AnimatedSprite {
  readonly maxHp: number;
  hp: number;
  readonly attack: number;
  readonly level: number;
  name: string;
  readonly speed: number;
  isMoving: boolean;
  private facing: Dir8 = 'south';
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');

    this.maxHp  = BASE_PLAYER_HP;
    this.hp     = this.maxHp;
    this.attack = BASE_PLAYER_ATK;
    this.level  = 1;
    this.name   = (scene.registry.get('playerName') as string | undefined) ?? 'Arlo';
    this.speed    = 160;
    this.isMoving = false;

    this.sprite.setCollideWorldBounds(true);
    this.sprite.setScale(1.55);

    if (this.scene.textures.exists('hero')) {
      this.playAnim('hero-idle-south');
    } else {
      this._buildPlaceholderGraphic(x, y);
    }
  }

  update(): void {
    const { cursors, wasd, mobileControls: mc } = this.scene as unknown as SceneWithInput;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    let dx = 0;
    let dy = 0;
    if (cursors.left.isDown  || wasd.A.isDown || mc?.isLeft())  dx -= 1;
    if (cursors.right.isDown || wasd.D.isDown || mc?.isRight()) dx += 1;
    if (cursors.up.isDown    || wasd.W.isDown || mc?.isUp())    dy -= 1;
    if (cursors.down.isDown  || wasd.S.isDown || mc?.isDown())  dy += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      body.setVelocity(dx * this.speed, dy * this.speed);
      body.velocity.normalize().scale(this.speed);
      this.facing = Player._directionFromVector(dx, dy);
      this.playAnim(`hero-walking-${this.facing}`);
    } else {
      body.setVelocity(0);
      this.playAnim(`hero-idle-${this.facing}`);
    }
  }

  private static _directionFromVector(dx: number, dy: number): Dir8 {
    // screen coords: +y is down, so dy > 0 → south
    if (dx === 0 && dy >  0) return 'south';
    if (dx === 0 && dy <  0) return 'north';
    if (dx >  0 && dy === 0) return 'east';
    if (dx <  0 && dy === 0) return 'west';
    if (dx >  0 && dy >  0) return 'south-east';
    if (dx <  0 && dy >  0) return 'south-west';
    if (dx >  0 && dy <  0) return 'north-east';
    return 'north-west';
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

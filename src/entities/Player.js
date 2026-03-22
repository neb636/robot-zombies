import { AnimatedSprite } from './Sprite.js';
import { BASE_PLAYER_HP, BASE_PLAYER_ATK } from '../utils/constants.js';

export class Player extends AnimatedSprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero');

    this.maxHp  = BASE_PLAYER_HP;
    this.hp     = this.maxHp;
    this.attack = BASE_PLAYER_ATK;
    this.level  = 1;
    this.name   = 'Kai';

    this.speed    = 160;
    this.isMoving = false;

    this.sprite.setCollideWorldBounds(true);

    // Gracefully handle missing spritesheet
    if (this.scene.textures.exists('hero')) {
      this.playAnim('hero-idle');
    } else {
      this._buildPlaceholderGraphic(x, y);
    }
  }

  update() {
    const { cursors, wasd } = this.scene;
    const body = this.sprite.body;

    body.setVelocity(0);
    this.isMoving = false;

    if (cursors.left.isDown  || wasd.A.isDown) {
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

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive() {
    return this.hp > 0;
  }

  _buildPlaceholderGraphic(x, y) {
    // Simple colored rectangle as stand-in for missing art
    const gfx = this.scene.add.rectangle(x, y, 24, 32, 0x4488ff);
    this.sprite.setVisible(false);
    this._placeholder = gfx;
  }
}

import { BASE_ENEMY_HP, BASE_ENEMY_ATK } from '../utils/constants.js';

const NAMES   = ['HELPBOT-9', 'SERVAMAX', 'KINDROID', 'UTIL-1TY', 'ASSIZTRON'];
const TAUNTS  = [
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
  constructor(scene, textureKey = 'robot_zombie') {
    this.scene      = scene;
    this.maxHp      = BASE_ENEMY_HP;
    this.hp         = this.maxHp;
    this.attack     = BASE_ENEMY_ATK;
    this.name       = NAMES[Math.floor(Math.random() * NAMES.length)];

    const { width, height } = scene.scale;

    if (scene.textures.exists(textureKey)) {
      this.sprite = scene.add.sprite(width * 0.65, height * 0.42, textureKey);
      this.sprite.setScale(2);
      this.sprite.play('robot-idle');
    } else {
      // Placeholder rectangle
      this.sprite = scene.add.rectangle(width * 0.65, height * 0.42, 48, 64, 0xff4422);
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this._flashDamage();
    return this.hp <= 0;
  }

  isAlive() { return this.hp > 0; }

  getTauntLine() {
    return TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
  }

  chooseAction() {
    return { type: 'ATTACK', damage: this.attack + Math.floor(Math.random() * 6) };
  }

  destroy() {
    this.sprite.destroy();
  }

  _flashDamage() {
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.2,
      yoyo:     true,
      duration: 80,
      repeat:   2,
      onComplete: () => this.sprite.setAlpha(1),
    });
  }
}

/**
 * Base class for animated Phaser sprites.
 */
export class AnimatedSprite {
  constructor(scene, x, y, textureKey) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setOrigin(0.5, 1);
    this._currentAnim = null;
  }

  playAnim(key, ignoreIfPlaying = true) {
    if (ignoreIfPlaying && this._currentAnim === key) return;
    if (!this.sprite.scene.anims.exists(key)) return;
    this._currentAnim = key;
    this.sprite.play(key);
  }

  destroy() {
    this.sprite.destroy();
  }
}

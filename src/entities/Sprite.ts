import Phaser from 'phaser';

/**
 * Base class for animated Phaser physics sprites.
 */
export class AnimatedSprite {
  protected scene: Phaser.Scene;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private _currentAnim: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    this.scene  = scene;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setOrigin(0.5, 1);
  }

  playAnim(key: string, ignoreIfPlaying = true): void {
    if (ignoreIfPlaying && this._currentAnim === key) return;
    if (!this.sprite.scene.anims.exists(key)) return;
    this._currentAnim = key;
    this.sprite.play(key);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

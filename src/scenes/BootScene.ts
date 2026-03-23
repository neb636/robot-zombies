import Phaser from 'phaser';

/**
 * BootScene — sets global Phaser settings before any assets load.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}

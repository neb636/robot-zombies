import Phaser from 'phaser';

/**
 * BootScene — sets global Phaser settings before any assets load.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically   = true;
    this.scene.start('PreloadScene');
  }
}

import Phaser from 'phaser';

/**
 * BootScene — sets global Phaser settings and pre-loads the splash image
 * so PreloadScene can display it as the loading backdrop.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('load_screen_bg', 'assets/ui/load-screen.png');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}

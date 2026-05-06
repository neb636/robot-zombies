import Phaser from 'phaser';
import { UI_LOAD_SCREEN_URL } from '../../../assets/ui/index.js';

/**
 * BootScene — sets global Phaser settings and pre-loads the splash image
 * so PreloadScene can display it as the loading backdrop.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('load_screen_bg', UI_LOAD_SCREEN_URL);
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}

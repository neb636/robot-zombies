import Phaser from 'phaser';

/**
 * Save/Load slot-picker scene. PHASE B STUB — Stream G fills the body.
 *
 * Expected behaviour: 3-slot list with timestamp / chapter / player name /
 * play-time summary. Launched from Title "Continue" and from PauseMenuScene.
 */
export class SaveLoadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SaveLoadScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'SAVE / LOAD\n(stub — Stream G fills this)', {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#cccccc',
      align:      'center',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => { this.scene.stop(); });
    this.input.keyboard?.once('keydown-ESC', () => { this.scene.stop(); });
  }
}

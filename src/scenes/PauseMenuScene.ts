import Phaser from 'phaser';

/**
 * Pause menu overlay. PHASE B STUB — Stream G fills the body.
 *
 * Expected behaviour: launches as parallel overlay (like BattleScene),
 * pauses caller scene, renders Resume / Save / Load / Settings / Quit options.
 */
export class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0);
    this.add.text(width / 2, height / 2, 'PAUSED\n(stub — Stream G fills this)', {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#ffffff',
      align:      'center',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => { this.scene.stop(); });
    this.input.keyboard?.once('keydown-ESC', () => { this.scene.stop(); });
  }
}

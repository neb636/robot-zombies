import Phaser from 'phaser';

/**
 * Hunting mini-game scene. PHASE B STUB — Stream A fills with arc + press window.
 */
export class HuntingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HuntingScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x002211, 0.9).setOrigin(0);
    this.add.text(width / 2, height / 2, 'HUNT\n(stub — Stream A fills this)', {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#88ddaa',
      align:      'center',
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => { this.scene.stop(); });
  }
}

import Phaser from 'phaser';

/**
 * Trade screen for safe-house merchants. PHASE B STUB — Stream A fills.
 */
export class TradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TradeScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    this.add.text(width / 2, height / 2, 'TRADE\n(stub — Stream A fills this)', {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#ddcc88',
      align:      'center',
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => { this.scene.stop(); });
  }
}

import Phaser from 'phaser';

/**
 * MenuItem — reusable clickable text button.
 * Dispatches a 'select' CustomEvent when clicked.
 */
export class MenuItem extends EventTarget {
  readonly label: string;
  readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super();
    this.label = label;
    this.text  = scene.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#cce',
    }).setInteractive({ useHandCursor: true });

    this.text.on('pointerover',  () => { this._highlight(true);  });
    this.text.on('pointerout',   () => { this._highlight(false); });
    this.text.on('pointerdown',  () => { this.dispatchEvent(new Event('select')); });
  }

  private _highlight(on: boolean): void {
    this.text.setColor(on ? '#7af' : '#cce');
    this.text.setScale(on ? 1.05 : 1);
  }

  destroy(): void { this.text.destroy(); }
}

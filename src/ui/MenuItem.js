/**
 * MenuItem — reusable clickable text button.
 * Dispatches a 'select' CustomEvent when clicked.
 */
export class MenuItem extends EventTarget {
  constructor(scene, x, y, label) {
    super();
    this.label = label;
    this.text  = scene.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize:   '18px',
      color:      '#cce',
    }).setInteractive({ useHandCursor: true });

    this.text.on('pointerover',  () => this._highlight(true));
    this.text.on('pointerout',   () => this._highlight(false));
    this.text.on('pointerdown',  () => this.dispatchEvent(new Event('select')));
  }

  _highlight(on) {
    this.text.setColor(on ? '#7af' : '#cce');
    this.text.setScale(on ? 1.05 : 1);
  }

  destroy() { this.text.destroy(); }
}

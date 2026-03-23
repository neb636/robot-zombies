import Phaser from 'phaser';

/**
 * NameEntryScene — player types their character's name before the prologue begins.
 * Stores the result in game.registry under 'playerName'.
 */
export class NameEntryScene extends Phaser.Scene {
  private _name:       string  = '';
  private _locked:     boolean = false;
  private _nameText!:  Phaser.GameObjects.Text;
  private _cursorText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'NameEntryScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000008, 0x000008, 0x0a0a1e, 0x0a0a1e, 1);
    bg.fillRect(0, 0, width, height);

    const sl = this.add.graphics().setAlpha(0.04);
    for (let y = 0; y < height; y += 4) {
      sl.fillStyle(0x000000);
      sl.fillRect(0, y, width, 2);
    }

    this.add.text(cx, height * 0.24, 'JUNE 12, 2028  —  AUSTIN, TEXAS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#334455', letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.32, 'Before the Fall', {
      fontFamily: 'monospace', fontSize: '22px', color: '#7aaeff',
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.44, 'ENTER YOUR NAME', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688', letterSpacing: 4,
    }).setOrigin(0.5);

    const boxW = 320, boxH = 52;
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x0a0a20);
    boxBg.fillRoundedRect(cx - boxW / 2, height * 0.51, boxW, boxH, 6);
    boxBg.lineStyle(2, 0x336688);
    boxBg.strokeRoundedRect(cx - boxW / 2, height * 0.51, boxW, boxH, 6);

    this._nameText = this.add.text(cx, height * 0.51 + boxH / 2, '', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);

    this._cursorText = this.add.text(0, 0, '|', {
      fontFamily: 'monospace', fontSize: '32px', color: '#7af',
    }).setOrigin(0, 0.5).setDepth(5);
    this.tweens.add({
      targets:  this._cursorText,
      alpha:    0,
      yoyo:     true,
      duration: 500,
      repeat:   -1,
      ease:     'Stepped',
    });

    this.add.text(cx, height * 0.68, '[ ENTER ]  to confirm  |  BACKSPACE to delete', {
      fontFamily: 'monospace', fontSize: '11px', color: '#223344',
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.74, '12 characters max. Default: KAI', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1a2a3a',
    }).setOrigin(0.5);

    this._updateDisplay();
    this._setupInput();

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  private _updateDisplay(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height * 0.51 + 26;

    this._nameText.setText(this._name);

    const half = this._nameText.width / 2;
    this._cursorText.setPosition(cx + half + 3, cy);
  }

  private _setupInput(): void {
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this._locked) return;

      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        if (this._name.trim().length > 0) this._confirm();
        return;
      }

      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
        this._name = this._name.slice(0, -1);
        this._updateDisplay();
        return;
      }

      if (this._name.length < 12 && /^[a-zA-Z0-9 ]$/.test(event.key)) {
        this._name += event.key.toUpperCase();
        this._updateDisplay();
      }
    });
  }

  private _confirm(): void {
    this._locked = true;
    const name = this._name.trim() || 'KAI';
    this.registry.set('playerName', name);

    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start('PrologueScene');
    });
  }
}

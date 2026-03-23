import Phaser from 'phaser';

/**
 * NameEntryScene — player types their character's name before the prologue begins.
 * Stores the result in game.registry under 'playerName'.
 */
export class NameEntryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NameEntryScene' });
    this._name   = '';
    this._locked = false;
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000008, 0x000008, 0x0a0a1e, 0x0a0a1e, 1);
    bg.fillRect(0, 0, width, height);

    // Scanlines
    const sl = this.add.graphics().setAlpha(0.04);
    for (let y = 0; y < height; y += 4) {
      sl.fillStyle(0x000000);
      sl.fillRect(0, y, width, 2);
    }

    // Date / location
    this.add.text(cx, height * 0.24, 'JUNE 12, 2028  —  AUSTIN, TEXAS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#334455', letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.32, 'Before the Fall', {
      fontFamily: 'monospace', fontSize: '22px', color: '#7aaeff',
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.44, 'ENTER YOUR NAME', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688', letterSpacing: 4,
    }).setOrigin(0.5);

    // Name display box
    const boxW = 320, boxH = 52;
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x0a0a20);
    boxBg.fillRoundedRect(cx - boxW / 2, height * 0.51, boxW, boxH, 6);
    boxBg.lineStyle(2, 0x336688);
    boxBg.strokeRoundedRect(cx - boxW / 2, height * 0.51, boxW, boxH, 6);

    this._nameText = this.add.text(cx, height * 0.51 + boxH / 2, '', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);

    // Blinking cursor
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

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  _updateDisplay() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height * 0.51 + 26;

    this._nameText.setText(this._name);

    // Position cursor just right of the text
    const half = this._nameText.width / 2;
    this._cursorText.setPosition(cx + half + 3, cy);
  }

  _setupInput() {
    this.input.keyboard.on('keydown', (event) => {
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

      // Letters, digits, space only — max 12 chars
      if (this._name.length < 12 && /^[a-zA-Z0-9 ]$/.test(event.key)) {
        this._name += event.key.toUpperCase();
        this._updateDisplay();
      }
    });
  }

  _confirm() {
    this._locked = true;
    const name = this._name.trim() || 'KAI';
    this.registry.set('playerName', name);

    this.cameras.main.fade(500, 0, 0, 0, false, (_cam, progress) => {
      if (progress === 1) this.scene.start('PrologueScene');
    });
  }
}

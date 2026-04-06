import Phaser from 'phaser';

/**
 * NameEntryScene — player types their character's name before the prologue begins.
 * Stores the result in game.registry under 'playerName'.
 *
 * Mobile strategy: a hidden off-screen <input> (font-size:16px to prevent iOS
 * viewport zoom) is focused on tap/click. Its value is mirrored into the
 * Phaser display. The visual box is an interactive hit zone that re-focuses
 * the input on tap so the soft keyboard reappears if dismissed.
 */
export class NameEntryScene extends Phaser.Scene {
  private _name:        string              = '';
  private _locked:      boolean             = false;
  private _nameText!:   Phaser.GameObjects.Text;
  private _cursorText!: Phaser.GameObjects.Text;
  private _input:       HTMLInputElement | null = null;

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

    this.add.text(cx, height * 0.24, 'JUNE 12, 2028  —  BOSTON, MASSACHUSETTS', {
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

    this.add.text(cx, height * 0.68, 'tap here to type  ·  ENTER or ✓ to confirm', {
      fontFamily: 'monospace', fontSize: '11px', color: '#223344',
    }).setOrigin(0.5);

    // Invisible hit zone over the box — tap re-focuses the hidden input so the
    // soft keyboard reappears on mobile if the player dismissed it.
    this.add.zone(cx, height * 0.51 + boxH / 2, boxW, boxH)
      .setInteractive()
      .on('pointerdown', () => { this._focusInput(); });

    this._updateDisplay();
    this._createInput();

    // Auto-focus works on desktop; mobile blocks it outside a user gesture,
    // so the tap handler above covers that case.
    this.time.delayedCall(150, () => { this._focusInput(); });

    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.events.once('shutdown', this._destroyHtmlInput, this);
    this.events.once('destroy',  this._destroyHtmlInput, this);
  }

  /** Creates a hidden off-screen <input> and wires its events to Phaser state. */
  private _createInput(): void {
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = 12;
    // Attributes that improve mobile UX
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocapitalize', 'characters'); // caps lock on mobile keyboards
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('spellcheck', 'false');
    // Positioned off-screen but still in the DOM flow so iOS will focus it.
    // font-size:16px is critical — iOS Safari zooms the viewport for any
    // input smaller than 16px. Keep it exactly at 16px.
    Object.assign(el.style, {
      position:       'fixed',
      top:            '-200px',
      left:           '50%',
      width:          '1px',
      height:         '1px',
      fontSize:       '16px',
      opacity:        '0',
      border:         'none',
      outline:        'none',
      background:     'transparent',
      color:          'transparent',
      caretColor:     'transparent',
      pointerEvents:  'none',
    });
    document.body.appendChild(el);
    this._input = el;

    el.addEventListener('input', () => {
      if (this._locked) return;
      // Strip anything outside our allowed character set; enforce uppercase.
      const filtered = el.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12).toUpperCase();
      el.value = filtered;
      this._name = filtered;
      this._updateDisplay();
    });

    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this._locked) return;
      if (e.key === 'Enter' && this._name.trim().length > 0) {
        e.preventDefault();
        this._confirm();
      }
    });
  }

  private _focusInput(): void {
    this._input?.focus();
  }

  private _destroyHtmlInput(): void {
    if (this._input) {
      this._input.blur();
      this._input.remove();
      this._input = null;
    }
  }

  /** Called by Phaser when this scene is stopped/replaced. */
  shutdown(): void {
    this._destroyHtmlInput();
  }

  private _updateDisplay(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height * 0.51 + 26;

    this._nameText.setText(this._name);

    const half = this._nameText.width / 2;
    this._cursorText.setPosition(cx + half + 3, cy);
  }

  private _confirm(): void {
    this._locked = true;
    const name = this._name.trim();
    this.registry.set('playerName', name);

    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start('PrologueV2Scene');
    });
  }
}

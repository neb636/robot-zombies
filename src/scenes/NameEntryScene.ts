import Phaser from 'phaser';

/**
 * NameEntryScene — player types their character's name before the prologue begins.
 * Stores the result in game.registry under 'playerName'.
 */
export class NameEntryScene extends Phaser.Scene {
  private _name:        string           = '';
  private _locked:      boolean          = false;
  private _nameText!:   Phaser.GameObjects.Text;
  private _cursorText!: Phaser.GameObjects.Text;
  private _htmlInput!:  HTMLInputElement;

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

    this.add.text(cx, height * 0.68, '[ ENTER / DONE ]  to confirm  |  tap box to open keyboard', {
      fontFamily: 'monospace', fontSize: '11px', color: '#223344',
    }).setOrigin(0.5);


    this._updateDisplay();
    this._setupInput();
    this._createHtmlInput(cx, height * 0.51, boxW, boxH);

    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.events.once('shutdown', this._destroyHtmlInput, this);
    this.events.once('destroy',  this._destroyHtmlInput, this);
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
    // Keyboard fallback for desktop (HTML input handles mobile).
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this._locked) return;
      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        if (this._name.trim().length > 0) this._confirm();
      }
    });
  }

  private _createHtmlInput(x: number, y: number, w: number, h: number): void {
    const canvas = this.sys.game.canvas;
    const parent = canvas.parentElement ?? document.body;

    const input = document.createElement('input');
    input.type        = 'text';
    input.maxLength   = 12;
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck  = false;
    input.enterKeyHint = 'done';

    // Position exactly over the Phaser input box.
    const scaleX = canvas.offsetWidth  / canvas.width;
    const scaleY = canvas.offsetHeight / canvas.height;
    input.style.cssText = [
      'position:absolute',
      `left:${canvas.offsetLeft + x * scaleX}px`,
      `top:${canvas.offsetTop  + y * scaleY}px`,
      `width:${w * scaleX}px`,
      `height:${h * scaleY}px`,
      'background:transparent',
      'border:none',
      'outline:none',
      'color:transparent',
      'caret-color:transparent',
      'font-size:1px',
      'padding:0',
      'margin:0',
      'opacity:1',
      'z-index:9999',
      '-webkit-user-select:text',
      'user-select:text',
    ].join(';');

    input.addEventListener('input', () => {
      if (this._locked) return;
      const filtered = input.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12).toUpperCase();
      input.value = filtered;
      this._name  = filtered;
      this._updateDisplay();
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this._locked) return;
      if (e.key === 'Enter' && this._name.trim().length > 0) {
        e.preventDefault();
        this._confirm();
      }
    });

    parent.appendChild(input);
    this._htmlInput = input;

    // Auto-focus so desktop users can type immediately; on mobile the tap
    // on the canvas area will focus the element and open the virtual keyboard.
    input.focus();
  }

  private _destroyHtmlInput(): void {
    this._htmlInput?.remove();
  }

  private _confirm(): void {
    this._locked = true;
    const name = this._name.trim();
    this.registry.set('playerName', name);

    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start('PrologueScene');
    });
  }
}

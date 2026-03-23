import Phaser from 'phaser';

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * TitleScene — displayed after assets load. Player presses any key to begin.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000010, 0x000010, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    const scanlines = this.add.graphics().setAlpha(0.04);
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000);
      scanlines.fillRect(0, y, width, 2);
    }

    this.add.text(cx, height * 0.28, 'A CHRONO TRIGGER-STYLE RPG', {
      fontFamily:    'monospace',
      fontSize:      clamp(width * 0.016, 11, 16) + 'px',
      color:         '#446688',
      letterSpacing: 4,
    }).setOrigin(0.5);

    const titleText = this.add.text(cx, height * 0.38, 'ROBOTS', {
      fontFamily:      'monospace',
      fontSize:        clamp(width * 0.1, 48, 120) + 'px',
      color:           '#7aaeff',
      stroke:          '#001133',
      strokeThickness: 10,
    }).setOrigin(0.5).setAlpha(0);

    const tagline = this.add.text(cx, height * 0.54, 'The Overly Helpful Apocalypse', {
      fontFamily:      'monospace',
      fontSize:        clamp(width * 0.022, 14, 24) + 'px',
      color:           '#cc4444',
      stroke:          '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    const prompt = this.add.text(cx, height * 0.72, 'PRESS ANY KEY TO BEGIN', {
      fontFamily: 'monospace',
      fontSize:   clamp(width * 0.02, 13, 20) + 'px',
      color:      '#88aacc',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(cx, height * 0.92, 'v0.1.0  —  Save the world from unsolicited assistance', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#333355',
    }).setOrigin(0.5);

    this.tweens.add({
      targets:  titleText,
      alpha:    1,
      y:        height * 0.36,
      duration: 900,
      ease:     'Power2',
      onComplete: () => {
        this.tweens.add({ targets: tagline, alpha: 1, duration: 600, delay: 100 });
        this.tweens.add({
          targets: prompt, alpha: 1, duration: 600, delay: 400,
          onComplete: () => { this._blinkPrompt(prompt); },
        });
        this._enableStart();
      },
    });

    this._addFloatingRobots(width, height);
  }

  private _blinkPrompt(text: Phaser.GameObjects.Text): void {
    this.tweens.add({
      targets:  text,
      alpha:    0.2,
      yoyo:     true,
      duration: 600,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  private _enableStart(): void {
    this.input.keyboard!.once('keydown', () => { this._startGame(); });
    this.input.once('pointerdown', () => { this._startGame(); });
  }

  private _startGame(): void {
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start('NameEntryScene');
    });
  }

  private _addFloatingRobots(width: number, height: number): void {
    const positions = [
      { x: width * 0.12, y: height * 0.55, w: 28, h: 44, speed: 1.2 },
      { x: width * 0.88, y: height * 0.48, w: 22, h: 36, speed: 0.8 },
      { x: width * 0.78, y: height * 0.68, w: 18, h: 30, speed: 1.5 },
      { x: width * 0.20, y: height * 0.72, w: 14, h: 24, speed: 1.0 },
    ];

    positions.forEach(({ x, y, w, h, speed }) => {
      const rect = this.add.rectangle(x, y, w, h, 0x224466).setAlpha(0.6);
      const eye  = this.add.rectangle(x + w * 0.15, y - h * 0.2, 4, 4, 0xff2222);

      this.tweens.add({
        targets:  rect,
        y:        y - 12,
        yoyo:     true,
        duration: 1800 / speed,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      });
      this.tweens.add({
        targets:  eye,
        y:        (y - h * 0.2) - 12,
        yoyo:     true,
        duration: 1800 / speed,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      });
      this.tweens.add({
        targets:  eye,
        alpha:    0,
        yoyo:     true,
        duration: 400,
        repeat:   -1,
        delay:    Math.random() * 1000,
      });
    });
  }
}

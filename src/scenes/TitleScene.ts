import Phaser from 'phaser';
import { SaveManager } from '../save/SaveManager.js';
import { ProceduralMusic } from '../audio/ProceduralMusic.js';

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * TitleScene — displayed after assets load.
 *
 * If no save exists: "PRESS ANY KEY TO BEGIN" (original behaviour).
 * If a save exists:  "NEW GAME" / "CONTINUE" menu with keyboard navigation.
 */
export class TitleScene extends Phaser.Scene {
  private _music: ProceduralMusic | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this._music = new ProceduralMusic();
    this._music.play(0.38);
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
          targets: tagline, alpha: 1, duration: 600, delay: 100,
          onComplete: () => { this._showMenu(width, height); },
        });
      },
    });

    this._addFloatingRobots(width, height);
  }

  // ─── Menu ──────────────────────────────────────────────────────────────────

  private _showMenu(width: number, height: number): void {
    const cx = width / 2;
    const summary = SaveManager.getSummary();

    if (summary === null) {
      this._showPressAnyKey(cx, height);
      return;
    }

    // Format save summary: "CONTINUE  —  Alex  ·  Ch.1  ·  Mar 24"
    const dateStr = summary.savedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const continueLabel = `CONTINUE  —  ${summary.playerName}  ·  Ch.${summary.chapter}  ·  ${dateStr}`;

    const fontSize = clamp(width * 0.022, 13, 20) + 'px';
    const menuY = height * 0.72;
    const gap = clamp(width * 0.18, 100, 180);

    const newGameText = this.add.text(cx - gap, menuY, 'NEW GAME', {
      fontFamily: 'monospace',
      fontSize,
      color: '#88aacc',
    }).setOrigin(0.5).setAlpha(0);

    const continueText = this.add.text(cx + gap, menuY, continueLabel, {
      fontFamily: 'monospace',
      fontSize,
      color: '#88aacc',
    }).setOrigin(0.5).setAlpha(0);

    const hint = this.add.text(cx, menuY + 36, '← → or tap to select  ·  ENTER or tap to confirm', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#334455',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [newGameText, continueText, hint], alpha: 1, duration: 500 });

    // Selection state: 0 = NEW GAME, 1 = CONTINUE
    let selected = 1;
    this._highlightMenu(newGameText, continueText, selected);

    const keys = this.input.keyboard!;

    const onLeft = keys.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const onRight = keys.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const onEnter = keys.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    onLeft.on('down', () => {
      selected = 0;
      this._highlightMenu(newGameText, continueText, selected);
    });
    onRight.on('down', () => {
      selected = 1;
      this._highlightMenu(newGameText, continueText, selected);
    });
    onEnter.once('down', () => {
      onLeft.destroy();
      onRight.destroy();
      if (selected === 0) {
        this._fadeToScene('NameEntryScene');
      } else {
        this._loadAndContinue();
      }
    });

    // Also support click/tap on each option
    newGameText.setInteractive({ useHandCursor: true });
    continueText.setInteractive({ useHandCursor: true });

    newGameText.on('pointerdown', () => {
      onLeft.destroy();
      onRight.destroy();
      onEnter.destroy();
      this._fadeToScene('NameEntryScene');
    });
    continueText.on('pointerdown', () => {
      onLeft.destroy();
      onRight.destroy();
      onEnter.destroy();
      this._loadAndContinue();
    });
  }

  private _highlightMenu(
    newGame: Phaser.GameObjects.Text,
    cont: Phaser.GameObjects.Text,
    selected: number,
  ): void {
    newGame.setColor(selected === 0 ? '#ffffff' : '#446688');
    cont.setColor(selected === 1 ? '#ffffff' : '#446688');
    newGame.setStyle({ stroke: selected === 0 ? '#001133' : 'transparent', strokeThickness: 3 });
    cont.setStyle({ stroke: selected === 1 ? '#001133' : 'transparent', strokeThickness: 3 });
  }

  private _showPressAnyKey(cx: number, height: number): void {
    const prompt = this.add.text(cx, height * 0.72, 'PRESS ANY KEY TO BEGIN', {
      fontFamily: 'monospace',
      fontSize:   clamp(this.scale.width * 0.02, 13, 20) + 'px',
      color:      '#88aacc',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: prompt, alpha: 1, duration: 600,
      onComplete: () => { this._blinkPrompt(prompt); },
    });

    this.input.keyboard!.once('keydown', () => { this._fadeToScene('NameEntryScene'); });
    this.input.once('pointerdown', () => { this._fadeToScene('NameEntryScene'); });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  private _loadAndContinue(): void {
    const data = SaveManager.load();
    if (data === null) {
      // Save disappeared between check and selection — fall through to new game
      this._fadeToScene('NameEntryScene');
      return;
    }
    SaveManager.restore(this.game, data);
    this._fadeToScene(data.currentScene);
  }

  private _fadeToScene(key: string): void {
    this._music?.stop(600);
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start(key);
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

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

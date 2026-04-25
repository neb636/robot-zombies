import Phaser from 'phaser';
import { SurvivalManager } from '../survival/SurvivalManager.js';
import {
  generatePressWindow,
  resolveHunt,
  huntRewards,
  arcPosition,
  arcYPosition,
  ARC_DURATION_MS,
  type PressWindow,
} from '../survival/HuntingMiniGame.js';
import { GAME_FLAGS, setFlag } from '../utils/constants.js';
import type { HuntingResult } from '../types.js';

// ─── Layout & style constants ──────────────────────────────────────────────

const BG_COLOR   = 0x001a0a;
const TRACK_Y_FRACTION = 0.42;   // vertical center of arc track as fraction of height
const TRACK_ARC  = 90;           // pixels of vertical rise at peak
const TARGET_R   = 18;           // target circle radius
const WINDOW_COLOR = 0x22aa44;
const TRACK_COLOR  = 0x225533;
const TARGET_COLOR = 0xddbb44;
const HIT_COLOR    = 0x44ff88;
const MISS_COLOR   = 0xff4444;

const FONT_RESULT: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize:   '28px',
  color:      '#eeeecc',
};
const FONT_HINT: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize:   '16px',
  color:      '#88bbaa',
};
const FONT_LABEL: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize:   '14px',
  color:      '#667766',
};

/**
 * Hunting mini-game scene.
 *
 * A target moves along a parabolic arc across the screen.
 * A highlighted press window appears mid-arc. The player presses SPACE or taps
 * to fire. Result: Perfect / Good / Miss.
 *
 * On completion the scene emits food gain to SurvivalManager and optionally
 * sets the DRONE_ALERT flag, then stops.
 */
export class HuntingScene extends Phaser.Scene {
  // ── Init data ─────────────────────────────────────────────────────────
  private _eliasPresent: boolean = false;

  // ── State ──────────────────────────────────────────────────────────────
  private _survival!: SurvivalManager;
  private _window!: PressWindow;
  private _elapsedMs: number = 0;
  private _fired: boolean = false;
  private _fireTiming: number = -1;
  /** Stored so callers (e.g. WorldMapScene) can query the outcome after scene stops. */
  lastResult: HuntingResult | null = null;
  private _done: boolean = false;
  private _trackLeft: number = 0;
  private _trackWidth: number = 0;
  private _trackBaseY: number = 0;

  // ── Phaser objects ────────────────────────────────────────────────────
  private _target!: Phaser.GameObjects.Arc;
  private _windowRect!: Phaser.GameObjects.Rectangle;
  private _resultText!: Phaser.GameObjects.Text;
  private _foodText!: Phaser.GameObjects.Text;
  private _spaceKey!: Phaser.Input.Keyboard.Key | undefined;
  private _tapZone!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'HuntingScene' });
  }

  /**
   * Init data: { eliasPresent: boolean }
   */
  init(data: Record<string, unknown>): void {
    this._eliasPresent = data['eliasPresent'] === true;
  }

  create(): void {
    this._survival = SurvivalManager.instance(this);
    this._window   = generatePressWindow();
    this._elapsedMs = 0;
    this._fired    = false;
    this._fireTiming = -1;
    this.lastResult = null;
    this._done     = false;

    const { width, height } = this.scale;

    // ── Background ────────────────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x000000, 0.88).setOrigin(0);
    this.add.rectangle(0, 0, width, height, BG_COLOR, 0.96).setOrigin(0);

    // ── Scene label ───────────────────────────────────────────────────
    this.add.text(width / 2, 28, 'HUNT', {
      fontFamily: 'monospace',
      fontSize:   '22px',
      color:      '#aaddcc',
    }).setOrigin(0.5, 0);

    if (!this._eliasPresent) {
      this.add.text(width / 2, 58, 'Without Elias — harder shot', {
        fontFamily: 'monospace',
        fontSize:   '13px',
        color:      '#cc8844',
      }).setOrigin(0.5, 0);
    }

    // ── Track ─────────────────────────────────────────────────────────
    const margin   = 80;
    this._trackLeft  = margin;
    this._trackWidth = width - margin * 2;
    this._trackBaseY = Math.floor(height * TRACK_Y_FRACTION);

    // Track baseline
    this.add.rectangle(
      this._trackLeft,
      this._trackBaseY,
      this._trackWidth,
      3,
      TRACK_COLOR,
    ).setOrigin(0, 0.5);

    // ── Press window indicator ────────────────────────────────────────
    const winLeft  = this._trackLeft + Math.floor(this._window.openAt  * this._trackWidth);
    const winRight = this._trackLeft + Math.floor(this._window.closeAt * this._trackWidth);
    const winW     = Math.max(4, winRight - winLeft);
    this._windowRect = this.add.rectangle(
      winLeft,
      this._trackBaseY - TRACK_ARC - 20,
      winW,
      (TRACK_ARC + 20) * 2 + 6,
      WINDOW_COLOR,
      0.18,
    ).setOrigin(0, 0.5);
    this._windowRect.setStrokeStyle(1, WINDOW_COLOR, 0.5);

    // Window label
    this.add.text(
      winLeft + winW / 2,
      this._trackBaseY - TRACK_ARC - 36,
      'FIRE HERE',
      FONT_LABEL,
    ).setOrigin(0.5, 1);

    // ── Target circle ─────────────────────────────────────────────────
    this._target = this.add.arc(
      this._trackLeft,
      this._trackBaseY,
      TARGET_R,
      0, 360, false,
      TARGET_COLOR,
    );

    // ── Result text (hidden until fire) ──────────────────────────────
    this._resultText = this.add.text(width / 2, height * 0.70, '', FONT_RESULT)
      .setOrigin(0.5)
      .setVisible(false);

    this._foodText = this.add.text(width / 2, height * 0.70 + 42, '', FONT_HINT)
      .setOrigin(0.5)
      .setVisible(false);

    // ── Controls hint ─────────────────────────────────────────────────
    this.add.text(
      width / 2,
      height - 40,
      'SPACE or TAP to fire',
      FONT_HINT,
    ).setOrigin(0.5);

    // ── Spacebar input ────────────────────────────────────────────────
    this._spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Tap zone (full screen) ────────────────────────────────────────
    this._tapZone = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();

    this._tapZone.on('pointerdown', () => { this._fire(); });
  }

  update(_time: number, delta: number): void {
    if (this._done) return;

    this._elapsedMs += delta;

    // Move target along arc
    const xFrac = arcPosition(this._elapsedMs);
    const yArc  = arcYPosition(this._elapsedMs);

    const targetX = Math.floor(this._trackLeft + xFrac * this._trackWidth);
    const targetY = Math.floor(this._trackBaseY - yArc * TRACK_ARC);

    this._target.setPosition(targetX, targetY);

    // Check keyboard
    if (this._spaceKey?.isDown && !this._fired) {
      this._fire();
    }

    // Auto-miss if arc complete and player never fired
    if (this._elapsedMs >= ARC_DURATION_MS && !this._fired) {
      this._fire(); // fires with _fireTiming = -1 → miss
    }
  }

  // ─── Fire logic ────────────────────────────────────────────────────────

  private _fire(): void {
    if (this._fired) return;
    this._fired = true;

    // Record timing (-1 if past end)
    this._fireTiming = this._elapsedMs < ARC_DURATION_MS ? this._elapsedMs : -1;

    const result = resolveHunt(this._eliasPresent, this._fireTiming, this._window);
    this.lastResult = result;

    this._showResult(result);
  }

  private _showResult(result: HuntingResult): void {
    const { food, droneAlertChance } = huntRewards(result);
    const { width } = this.scale;

    // Apply food gain
    if (food > 0) {
      this._survival.addItem('food', food);
    }

    // Drone alert
    if (droneAlertChance > 0) {
      const alertRoll = Math.floor(Math.random() * 100);
      if (alertRoll < droneAlertChance) {
        setFlag(this.game.registry, GAME_FLAGS.DRONE_ALERT, true);
      }
    }

    // Visual feedback
    const label = result === 'perfect' ? '★ PERFECT ★' :
                  result === 'good'    ? '✓ GOOD'       :
                  '✗ MISS';

    const color = result === 'perfect' ? '#88ffcc' :
                  result === 'good'    ? '#88ddaa' :
                  '#dd5555';

    this._target.setFillStyle(result !== 'miss' ? HIT_COLOR : MISS_COLOR);

    this._resultText
      .setText(label)
      .setColor(color)
      .setVisible(true);

    const foodLine = food > 0 ? `+${food} food` : 'No food gained.';
    const alertLine = droneAlertChance > 0 ? ' (possible drone alert)' : '';
    this._foodText.setText(foodLine + alertLine).setVisible(true);

    // "Tap/press to continue" hint
    this.add.text(width / 2, this._foodText.y + 44, 'Tap or press Space to continue', {
      fontFamily: 'monospace',
      fontSize:   '13px',
      color:      '#667766',
    }).setOrigin(0.5);

    // Re-wire tap and spacebar to close
    this._tapZone.off('pointerdown');
    this._tapZone.on('pointerdown', () => { this._finish(); });
    this._spaceKey?.off('down');
    this._spaceKey?.on('down',      () => { this._finish(); });

    this._done = true;
  }

  private _finish(): void {
    this.scene.stop();
  }
}

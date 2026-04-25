import Phaser from 'phaser';
import { SaveSlot }    from '../save/SaveSlot.js';
import { SaveManager } from '../save/SaveManager.js';
import type { SaveSlotInfo } from '../types.js';

/**
 * SaveLoadScene — 3-slot save/load picker.
 *
 * Launched from:
 *   - PauseMenu  "Save" option      (mode: 'save', callerScene provided)
 *   - PauseMenu  "Load" option      (mode: 'load')
 *
 * Data contract:
 *   init({ mode: 'save' | 'load', callerScene?: string })
 */

interface InitData {
  mode: 'save' | 'load';
  callerScene?: string;
}

const CARD_W  = 340;
const CARD_H  = 110;
const CARD_GAP = 20;

export class SaveLoadScene extends Phaser.Scene {
  private _mode:        'save' | 'load' = 'load';
  private _callerScene: string | null = null;
  private _slots:       SaveSlotInfo[] = [];
  private _cards:       Phaser.GameObjects.Container[] = [];
  private _selectedIdx: number = 0;
  private _keyUp!:      Phaser.Input.Keyboard.Key;
  private _keyDown!:    Phaser.Input.Keyboard.Key;
  private _keyEnter!:   Phaser.Input.Keyboard.Key;
  private _keyEsc!:     Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'SaveLoadScene' });
  }

  init(data: Partial<InitData>): void {
    this._mode        = data.mode ?? 'load';
    this._callerScene = data.callerScene ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Semi-transparent dark backdrop
    this.add.rectangle(0, 0, width, height, 0x000010, 0.88).setOrigin(0);

    // Title
    const titleLabel = this._mode === 'save' ? 'SAVE GAME' : 'LOAD GAME';
    this.add.text(cx, 60, titleLabel, {
      fontFamily: 'monospace',
      fontSize:   '24px',
      color:      '#7aaeff',
      stroke:     '#001133',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Hint
    this.add.text(cx, height - 30,
      '[UP/DOWN] Select  ·  [ENTER] Confirm  ·  [ESC] Back  ·  Tap to select',
      { fontFamily: 'monospace', fontSize: '11px', color: '#446688' },
    ).setOrigin(0.5);

    // Slots
    this._slots = SaveSlot.list();
    this._cards = [];

    const totalH = SLOT_COUNT * CARD_H + (SLOT_COUNT - 1) * CARD_GAP;
    const startY = (height - totalH) / 2;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = this._slots[i]!;
      const cardY = startY + i * (CARD_H + CARD_GAP);
      const card  = this._buildCard(slot, cx, cardY, i);
      this._cards.push(card);
    }

    this._highlightCard(0);

    // Keyboard
    const kb = this.input.keyboard!;
    this._keyUp    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this._keyDown  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this._keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this._keyEsc   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this._keyUp.on('down', () => {
      this._selectedIdx = Math.max(0, this._selectedIdx - 1);
      this._highlightCard(this._selectedIdx);
    });
    this._keyDown.on('down', () => {
      this._selectedIdx = Math.min(SLOT_COUNT - 1, this._selectedIdx + 1);
      this._highlightCard(this._selectedIdx);
    });
    this._keyEnter.once('down', () => { this._confirmSelection(); });
    this._keyEsc.once('down',   () => { this._goBack(); });
  }

  // ─── Card building ─────────────────────────────────────────────────────────

  private _buildCard(
    slot: SaveSlotInfo,
    cx: number,
    cardY: number,
    idx: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx - CARD_W / 2, cardY);

    // Background rect
    const bg = this.add.rectangle(CARD_W / 2, CARD_H / 2, CARD_W, CARD_H, 0x0a0a1e)
      .setStrokeStyle(2, 0x334466);
    container.add(bg);

    if (slot.occupied) {
      const name    = slot.playerName ?? 'Unknown';
      const chapter = slot.chapter ?? 1;
      const savedAt = slot.savedAt ? new Date(slot.savedAt) : null;
      const dateStr = savedAt
        ? savedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
      const timeStr = savedAt
        ? savedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '';
      const playMs  = slot.playTimeMs ?? 0;
      const playH   = Math.floor(playMs / 3_600_000);
      const playM   = Math.floor((playMs % 3_600_000) / 60_000);
      const playStr = `${playH}h ${playM}m`;

      container.add(this.add.text(16, 14, `SLOT ${idx + 1}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#446688',
      }));
      container.add(this.add.text(16, 30, name, {
        fontFamily: 'monospace', fontSize: '20px', color: '#e8f4ff',
      }));
      container.add(this.add.text(16, 56, `Chapter ${chapter}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#7aaeff',
      }));
      container.add(this.add.text(16, 76, `${dateStr}  ${timeStr}  ·  ${playStr} played`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#556688',
      }));
    } else {
      container.add(this.add.text(16, 14, `SLOT ${idx + 1}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#334455',
      }));
      container.add(this.add.text(CARD_W / 2, CARD_H / 2, '— empty —', {
        fontFamily: 'monospace', fontSize: '16px', color: '#334455',
      }).setOrigin(0.5));
    }

    // Make the whole card tappable
    const hitArea = this.add.rectangle(CARD_W / 2, CARD_H / 2, CARD_W, CARD_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this._selectedIdx = idx;
      this._highlightCard(idx);
    });
    hitArea.on('pointerdown', () => {
      this._selectedIdx = idx;
      this._highlightCard(idx);
      this._confirmSelection();
    });

    return container;
  }

  // ─── Selection helpers ─────────────────────────────────────────────────────

  private _highlightCard(idx: number): void {
    this._cards.forEach((card, i) => {
      const bg = card.list[0] as Phaser.GameObjects.Rectangle;
      if (i === idx) {
        bg.setStrokeStyle(3, 0x7aaeff);
        bg.setFillStyle(0x0f0f30);
      } else {
        bg.setStrokeStyle(2, 0x334466);
        bg.setFillStyle(0x0a0a1e);
      }
    });
  }

  private _confirmSelection(): void {
    const slot = this._slots[this._selectedIdx];
    if (!slot) return;

    if (this._mode === 'save') {
      this._doSave(this._selectedIdx);
    } else {
      if (slot.occupied) {
        this._doLoad(this._selectedIdx, slot);
      }
      // Clicking empty slot in load mode is a no-op
    }
  }

  private _doSave(slotIdx: number): void {
    const scene = this._callerScene ?? 'WorldMapScene';
    SaveSlot.save(slotIdx, this.game, scene);

    // Flash feedback then close
    this._flashFeedback('GAME SAVED', () => { this._goBack(); });
  }

  private _doLoad(slotIdx: number, _slot: SaveSlotInfo): void {
    const data = SaveSlot.load(slotIdx);
    if (!data) { this._goBack(); return; }

    const survival = SaveSlot.loadSurvival(slotIdx);

    // Restore game registry
    SaveManager.restore(this.game, data);
    if (survival) {
      this.game.registry.set('survivalState', survival);
    }

    // Transition to the saved scene
    this.cameras.main.fade(400, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        // Stop caller scene (if launched from pause)
        if (this._callerScene) {
          this.scene.stop(this._callerScene);
        }
        this.scene.stop();
        this.scene.start(data.currentScene);
      }
    });
  }

  private _flashFeedback(msg: string, onDone: () => void): void {
    const { width, height } = this.scale;
    const flash = this.add.text(width / 2, height / 2, msg, {
      fontFamily: 'monospace',
      fontSize:   '28px',
      color:      '#7aaeff',
      stroke:     '#001133',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: flash, alpha: 1, duration: 200,
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: flash, alpha: 0, duration: 200,
            onComplete: onDone,
          });
        });
      },
    });
  }

  private _goBack(): void {
    this.scene.stop();
    // If we were launched from pause, re-open the pause menu
    if (this._callerScene) {
      this.scene.resume(this._callerScene);
    }
  }
}

const SLOT_COUNT = 3;

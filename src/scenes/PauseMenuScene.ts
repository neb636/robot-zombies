import Phaser from 'phaser';
import { SaveSlot } from '../save/SaveSlot.js';
import { bus }      from '../utils/EventBus.js';
import { EVENTS }   from '../utils/constants.js';

/**
 * PauseMenuScene — HTML-overlay pause menu that can be opened over any scene.
 *
 * This scene does NOT use the Phaser canvas. It manages a DOM panel directly
 * (matching the existing #pause-overlay pattern) and coordinates with the
 * caller scene for pause/resume lifecycle.
 *
 * Opening: any scene calls `this.scene.launch('PauseMenuScene', { callerKey })`
 * and then `this.scene.pause()`. Alternatively, use the static helper:
 *   `PauseMenuScene.open(this)`
 *
 * The scene automatically resumes the caller when closed.
 */

interface InitData {
  callerKey: string;
}

export class PauseMenuScene extends Phaser.Scene {
  private _callerKey: string = '';
  private _overlay!:  HTMLElement;
  private _list!:     HTMLElement;
  private _selectedIndex = 0;
  private _items: Array<{ label: string; action: () => void; disabled?: boolean }> = [];
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _pauseBtn:   HTMLElement | null = null;

  constructor() {
    super({ key: 'PauseMenuScene' });
  }

  // ─── Static helper ────────────────────────────────────────────────────────

  /**
   * Convenience method: launch PauseMenuScene over `callerScene` and pause it.
   */
  static open(callerScene: Phaser.Scene): void {
    callerScene.scene.launch('PauseMenuScene', { callerKey: callerScene.scene.key });
    callerScene.scene.pause();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  init(data: Partial<InitData>): void {
    this._callerKey = data.callerKey ?? '';
  }

  create(): void {
    // Reuse the existing #pause-overlay DOM elements
    const overlay = document.getElementById('pause-overlay');
    const list    = document.getElementById('pause-menu-list');
    if (!overlay || !list) {
      console.error('PauseMenuScene: #pause-overlay not found — check index.html');
      this._close();
      return;
    }
    this._overlay = overlay;
    this._list    = list;

    this._buildItems();
    this._selectedIndex = 0;
    this._render();
    this._overlay.style.display = 'flex';

    bus.emit(EVENTS.PAUSE_OPEN, {});

    // Keyboard handler
    this._keyHandler = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      switch (e.key) {
        case 'ArrowUp':
          this._selectedIndex = Math.max(0, this._selectedIndex - 1);
          this._render();
          break;
        case 'ArrowDown':
          this._selectedIndex = Math.min(this._items.length - 1, this._selectedIndex + 1);
          this._render();
          break;
        case 'Enter':
          this._activate();
          break;
        case 'Escape':
          this._resume();
          break;
        default: break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // Mobile "pause" button (injected into DOM if on touch device)
    this._injectMobilePauseButton();
  }

  shutdown(): void {
    this._cleanup();
  }

  // ─── Menu building ────────────────────────────────────────────────────────

  private _buildItems(): void {
    this._items = [
      { label: 'RESUME',         action: () => { this._resume(); } },
      { label: 'SAVE',           action: () => { this._openSaveLoad('save'); } },
      { label: 'LOAD',           action: () => { this._openSaveLoad('load'); } },
      { label: 'SETTINGS',       action: () => { this._openSettings(); } },
      { label: 'QUIT TO TITLE',  action: () => { this._quitToTitle(); } },
    ];
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private _render(): void {
    this._list.innerHTML = '';
    this._items.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = i === this._selectedIndex ? `> ${item.label}` : `  ${item.label}`;
      if (i === this._selectedIndex) li.style.color = '#d99846';
      if (item.disabled) {
        li.style.color = '#4a4338';
        li.style.cursor = 'not-allowed';
      } else {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          this._selectedIndex = i;
          this._render();
          this._activate();
        });
      }
      this._list.appendChild(li);
    });
  }

  private _activate(): void {
    const item = this._items[this._selectedIndex];
    if (item && !item.disabled) item.action();
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  private _resume(): void {
    this._close();
  }

  private _openSaveLoad(mode: 'save' | 'load'): void {
    // Close the pause overlay visually but keep this scene active as coordinator
    this._overlay.style.display = 'none';
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    // Pass callerScene so SaveLoadScene can resume it on back
    this.scene.launch('SaveLoadScene', {
      mode,
      callerScene: this._callerKey,
    });

    // Listen for SaveLoadScene stop to re-open pause menu
    this.scene.get('SaveLoadScene')?.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._keyHandler = this._makeKeyHandler();
      document.addEventListener('keydown', this._keyHandler);
      this._overlay.style.display = 'flex';
    });
  }

  private _openSettings(): void {
    // Show a quick settings panel inline (mute / volume)
    this._overlay.style.display = 'none';
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    this._showSettingsPanel();
  }

  private _showSettingsPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'pause-settings-panel';
    panel.style.cssText = [
      'position:fixed',
      'inset:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(6,7,8,0.82)',
      'z-index:151',
      'backdrop-filter:blur(2px)',
    ].join(';');

    const inner = document.createElement('div');
    inner.style.cssText = [
      'background:rgba(20,22,24,0.97)',
      'border:3px solid #4a4f54',
      'border-radius:4px',
      'padding:36px 56px',
      'font-family:"Courier New",monospace',
      'min-width:300px',
      'text-align:center',
      'color:#c2c7cb',
      'box-shadow:0 0 0 1px rgba(0,0,0,0.7),inset 0 0 0 1px rgba(255,255,255,0.04),0 16px 48px rgba(0,0,0,0.7)',
      'text-shadow:0 1px 0 rgba(0,0,0,0.7)',
    ].join(';');

    inner.innerHTML = `
      <div style="color:#d99846;font-size:18px;letter-spacing:6px;margin-bottom:6px;text-transform:uppercase">SETTINGS</div>
      <div style="width:56px;height:1px;background:#a87838;opacity:0.6;margin:0 auto 22px"></div>
      <div style="margin-bottom:18px">
        <label style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:14px;letter-spacing:1px">
          <span>VOICE NARRATION</span>
          <button id="ps-tts-toggle" style="
            background:rgba(12,13,14,0.95);border:2px solid #4a4f54;border-radius:3px;
            color:#d99846;font-family:'Courier New',monospace;font-size:12px;
            padding:5px 14px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;
            box-shadow:inset 0 0 0 1px rgba(255,255,255,0.03)
          ">ON</button>
        </label>
      </div>
      <div style="margin-bottom:26px">
        <label style="font-size:14px;display:block;margin-bottom:8px;letter-spacing:1px">MUSIC VOLUME</label>
        <input id="ps-vol" type="range" min="0" max="100" value="70"
          style="width:180px;accent-color:#d99846" />
      </div>
      <button id="ps-back" style="
        background:rgba(12,13,14,0.95);border:2px solid #4a4f54;border-radius:3px;
        color:#d99846;font-family:'Courier New',monospace;font-size:13px;
        padding:9px 28px;cursor:pointer;letter-spacing:3px;text-transform:uppercase;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,0.03)
      ">BACK</button>
      <div style="color:#7c8186;font-size:11px;margin-top:16px;letter-spacing:2px">[ESC] BACK</div>
    `;

    panel.appendChild(inner);
    document.body.appendChild(panel);

    const ttsToggle = panel.querySelector<HTMLButtonElement>('#ps-tts-toggle');
    const backBtn   = panel.querySelector<HTMLButtonElement>('#ps-back');

    const isMuted = localStorage.getItem('rz_tts_muted') === 'true';
    if (ttsToggle) {
      ttsToggle.textContent = isMuted ? 'OFF' : 'ON';
      ttsToggle.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('tts:togglemute'));
        const nowMuted = localStorage.getItem('rz_tts_muted') === 'true';
        ttsToggle.textContent = nowMuted ? 'OFF' : 'ON';
      });
    }

    const backHandler = (): void => {
      panel.remove();
      this._keyHandler = this._makeKeyHandler();
      document.addEventListener('keydown', this._keyHandler);
      this._overlay.style.display = 'flex';
    };

    backBtn?.addEventListener('click', backHandler);

    const escHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); backHandler(); }
    };
    document.addEventListener('keydown', escHandler);
  }

  private _quitToTitle(): void {
    // Save nothing — just transition
    this._cleanup();
    // Stop everything and go back to the load/title screen
    this.scene.stop(this._callerKey);
    this.scene.stop();
    this.scene.start('PreloadScene');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _close(): void {
    this._cleanup();
    // Resume the caller scene
    if (this._callerKey) {
      this.scene.resume(this._callerKey);
    }
    this.scene.stop();
  }

  private _cleanup(): void {
    this._overlay.style.display = 'none';
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    // Remove any stray settings panel
    document.getElementById('pause-settings-panel')?.remove();
    // Remove mobile pause button if we injected it
    this._pauseBtn?.remove();
    this._pauseBtn = null;
    bus.emit(EVENTS.PAUSE_CLOSE, {});
  }

  private _makeKeyHandler(): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      switch (e.key) {
        case 'ArrowUp':
          this._selectedIndex = Math.max(0, this._selectedIndex - 1);
          this._render();
          break;
        case 'ArrowDown':
          this._selectedIndex = Math.min(this._items.length - 1, this._selectedIndex + 1);
          this._render();
          break;
        case 'Enter':
          this._activate();
          break;
        case 'Escape':
          this._resume();
          break;
        default: break;
      }
    };
  }

  // ─── Mobile support ───────────────────────────────────────────────────────

  private _injectMobilePauseButton(): void {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;
    // The mobile pause button lives in the game world, not this scene.
    // We wire it here so any gameplay scene can trigger PauseMenuScene.open().
    // (Scenes that have MobileControls should call PauseMenuScene.open(this) on pauseTap.)
    // We don't inject a duplicate button — see CLAUDE.md mobile rules.
  }

  /**
   * Wire an ESC / pause key listener into any gameplay scene so players can
   * open PauseMenuScene without each scene manually doing it.
   * Call from create() of gameplay scenes: `PauseMenuScene.wireESC(this)`.
   */
  static wireESC(scene: Phaser.Scene): void {
    const esc = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc?.on('down', () => {
      // Don't open if already paused or in battle
      if (scene.scene.isPaused()) return;
      if (scene.scene.isActive('BattleScene')) return;
      PauseMenuScene.open(scene);
    });
  }

  /**
   * Quick save to slot 0 — callable from any scene (e.g. auto-save on node enter).
   */
  static quickSave(game: Phaser.Game, currentScene: string): void {
    SaveSlot.save(0, game, currentScene);
  }
}

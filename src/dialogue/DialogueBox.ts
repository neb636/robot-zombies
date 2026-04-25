import Phaser from 'phaser';
import { tts }          from '../audio/TTSManager.js';
import { ChoiceEngine } from './ChoiceEngine.js';
import type { DialogueLine, DialogueChoice } from '../types.js';
import type { SurvivalManager } from '../survival/SurvivalManager.js';

/**
 * DialogueBox — controls the HTML overlay (#dialogue-overlay).
 * Typewriter character reveal, SPACE/ENTER/tap to advance.
 * Each line is also spoken aloud via TTSManager (unless muted).
 *
 * Extended (Stream G) to support `DialogueLine` objects with optional `choices`
 * arrays. When a line has choices the typewriter completes, then a choice row
 * is rendered inside the overlay. Selecting a choice calls ChoiceEngine.resolve,
 * hides the row, and invokes the onChoice callback with the selected nextId.
 *
 * The original string-based `open()` API is UNCHANGED for backwards compat.
 */
export class DialogueBox {
  private readonly overlay:  HTMLElement;
  private readonly speaker:  HTMLElement;
  private readonly textEl:   HTMLElement;
  private readonly choiceEl: HTMLElement;

  // ── plain-string mode state ────────────────────────────────────────────────
  private _queue:    string[] = [];
  private _active:   boolean = false;
  private _typing:   boolean = false;
  private _typeInterval: ReturnType<typeof setInterval> | null = null;
  private _currentLine:  string = '';
  private _speaker:      string = '';
  private _onClose:      (() => void) | undefined = undefined;

  // ── extended DialogueLine mode state ──────────────────────────────────────
  private _lineQueue:       DialogueLine[] = [];
  private _lineMode:        boolean = false;
  private _awaitingChoice:  boolean = false;
  private _onChoice:        ((nextId: string) => void) | undefined = undefined;
  private _registry:        Phaser.Data.DataManager | null = null;
  private _survival:        SurvivalManager | null = null;
  private _pendingChoiceLine: DialogueLine | null = null;
  private _choiceKeyHandler:  ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    const overlay = document.getElementById('dialogue-overlay');
    const speaker = document.getElementById('dialogue-speaker');
    const textEl  = document.getElementById('dialogue-text');

    if (!overlay || !speaker || !textEl) {
      throw new Error('DialogueBox: required DOM elements not found.');
    }

    this.overlay = overlay;
    this.speaker = speaker;
    this.textEl  = textEl;

    // Inject choice container into the overlay (hidden until needed)
    this.choiceEl = document.createElement('div');
    this.choiceEl.id = 'dialogue-choices';
    this.choiceEl.style.cssText = 'display:none;margin-top:12px';
    overlay.appendChild(this.choiceEl);

    document.addEventListener('dialogue:advance', () => { this._advance(); });
    this.overlay.addEventListener('click', () => { this._advance(); });
  }

  // ─── Original string-based API (backwards compat) ─────────────────────────

  open(speakerName: string, lines: readonly string[], onClose?: () => void): void {
    this._lineMode = false;
    this._queue   = [...lines];
    this._onClose = onClose;
    this._speaker = speakerName;
    this._active  = true;
    this.overlay.style.display = 'block';
    this._showNextLine();
  }

  // ─── Extended DialogueLine API (Stream G) ─────────────────────────────────

  /**
   * Open the box with structured DialogueLine objects that may carry `choices`.
   * `registry` and `survival` are used by ChoiceEngine for flag/item checks.
   * `onChoice` is called with the selected option's `nextId` after selection.
   */
  openLines(
    speakerName: string,
    lines: readonly DialogueLine[],
    onClose?: () => void,
    onChoice?: (nextId: string) => void,
    registry?: Phaser.Data.DataManager,
    survival?: SurvivalManager,
  ): void {
    this._lineMode   = true;
    this._lineQueue  = [...lines];
    this._queue      = [];
    this._onClose    = onClose;
    this._onChoice   = onChoice;
    this._speaker    = speakerName;
    this._registry   = registry ?? null;
    this._survival   = survival ?? null;
    this._active     = true;
    this.overlay.style.display = 'block';
    this._showNextDialogueLine();
  }

  // ─── Common ───────────────────────────────────────────────────────────────

  close(): void {
    if (this._typeInterval !== null) {
      clearInterval(this._typeInterval);
      this._typeInterval = null;
    }
    tts.cancel();
    this._hideChoices();
    this.overlay.style.display = 'none';
    this._active         = false;
    this._awaitingChoice = false;
    this._lineMode       = false;
    this._queue          = [];
    this._lineQueue      = [];
    this._onClose?.();
  }

  isActive(): boolean { return this._active; }

  // ─── Private — string mode ────────────────────────────────────────────────

  private _showNextLine(): void {
    if (this._queue.length === 0) { this.close(); return; }
    const line = this._queue.shift()!;
    this.speaker.textContent = this._speaker;
    this._typewriterEffect(line, null);
  }

  // ─── Private — DialogueLine mode ─────────────────────────────────────────

  private _showNextDialogueLine(): void {
    if (this._lineQueue.length === 0) { this.close(); return; }
    const line = this._lineQueue.shift()!;
    this.speaker.textContent = line.speaker ?? this._speaker;
    this._typewriterEffect(line.text, line);
  }

  // ─── Private — shared typewriter & choice logic ───────────────────────────

  private _advance(): void {
    if (!this._active) return;
    if (this._awaitingChoice) return; // clicks ignored while choice row visible
    if (this._typing) {
      if (this._typeInterval !== null) {
        clearInterval(this._typeInterval);
        this._typeInterval = null;
      }
      tts.cancel();
      this._typing = false;
      this.textEl.textContent = this._currentLine;
      // Show choices for the current line if we skipped the typewriter
      if (this._pendingChoiceLine) {
        this._maybeShowChoices(this._pendingChoiceLine);
        this._pendingChoiceLine = null;
      }
    } else {
      if (this._lineMode) {
        this._showNextDialogueLine();
      } else {
        this._showNextLine();
      }
    }
  }

  private _typewriterEffect(text: string, line: DialogueLine | null): void {
    this._currentLine       = text;
    this._pendingChoiceLine = line;
    this._typing            = true;
    this.textEl.textContent = '';
    let i = 0;

    tts.speak(text, this._speaker);

    this._typeInterval = setInterval(() => {
      const char = text[i];
      if (char !== undefined) {
        this.textEl.textContent += char;
      }
      i++;
      if (i >= text.length) {
        if (this._typeInterval !== null) {
          clearInterval(this._typeInterval);
          this._typeInterval = null;
        }
        this._typing            = false;
        this._pendingChoiceLine = null;
        if (line) this._maybeShowChoices(line);
      }
    }, 28);
  }

  private _maybeShowChoices(line: DialogueLine): void {
    if (!ChoiceEngine.shouldRender(line)) return;

    const options =
      this._registry && this._survival
        ? ChoiceEngine.availableOptions(line, this._registry, this._survival)
        : (line.choices ? [...line.choices] : []);

    if (options.length === 0) {
      // All options gated — auto-advance
      if (this._lineMode) {
        this._showNextDialogueLine();
      } else {
        this._showNextLine();
      }
      return;
    }

    this._awaitingChoice = true;
    this._renderChoices(options, line.choices ?? []);
  }

  private _renderChoices(
    available: DialogueChoice[],
    all: readonly DialogueChoice[],
  ): void {
    this.choiceEl.innerHTML = '';
    this.choiceEl.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'gap:6px',
      'margin-top:12px',
    ].join(';');

    const toRender = all.slice(0, 4);

    toRender.forEach((choice, _idx) => {
      const isAvail = available.some(a => a.nextId === choice.nextId && a.label === choice.label);
      const btn = document.createElement('button');
      btn.textContent = choice.label;
      btn.style.cssText = [
        'background:rgba(12,13,14,0.92)',
        `border:2px solid ${isAvail ? '#4a4f54' : '#25282b'}`,
        'border-radius:3px',
        `color:${isAvail ? '#c2c7cb' : '#5e6266'}`,
        'font-family:"Courier New",monospace',
        'font-size:14px',
        'padding:9px 16px',
        'text-align:left',
        'letter-spacing:1px',
        `cursor:${isAvail ? 'pointer' : 'not-allowed'}`,
        'transition:background 0.12s,border-color 0.12s,color 0.12s',
        'width:100%',
        `box-shadow:${isAvail ? 'inset 0 0 0 1px rgba(255,255,255,0.03)' : 'none'}`,
        'text-shadow:0 1px 0 rgba(0,0,0,0.7)',
      ].join(';');

      if (isAvail) {
        btn.addEventListener('pointerenter', () => {
          btn.style.background   = 'rgba(28,30,32,0.95)';
          btn.style.borderColor  = '#d99846';
          btn.style.color        = '#e8a85a';
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.background   = 'rgba(12,13,14,0.92)';
          btn.style.borderColor  = '#4a4f54';
          btn.style.color        = '#c2c7cb';
        });
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this._selectChoice(choice);
        });
      } else {
        const hasItemGate = choice.requireItems && choice.requireItems.length > 0;
        btn.title = hasItemGate
          ? "You don't have enough supplies."
          : 'Requirements not met.';
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
      }

      this.choiceEl.appendChild(btn);
    });

    this._installChoiceKeyboard(available, toRender);
  }

  private _installChoiceKeyboard(
    available: DialogueChoice[],
    rendered: DialogueChoice[],
  ): void {
    // Start highlight on first available option
    const availIndices = rendered
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => available.some(a => a.nextId === c.nextId && a.label === c.label))
      .map(({ i }) => i);

    let idx = availIndices[0] ?? -1;
    this._updateChoiceHighlight(idx);

    this._choiceKeyHandler = (e: KeyboardEvent): void => {
      if (!this._awaitingChoice) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft': {
          e.preventDefault();
          const pos = availIndices.indexOf(idx);
          if (pos > 0) idx = availIndices[pos - 1]!;
          this._updateChoiceHighlight(idx);
          break;
        }
        case 'ArrowDown':
        case 'ArrowRight': {
          e.preventDefault();
          const pos = availIndices.indexOf(idx);
          if (pos < availIndices.length - 1) idx = availIndices[pos + 1]!;
          this._updateChoiceHighlight(idx);
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const choice = rendered[idx];
          if (choice && available.some(a => a.nextId === choice.nextId && a.label === choice.label)) {
            this._selectChoice(choice);
          }
          break;
        }
        default: break;
      }
    };
    document.addEventListener('keydown', this._choiceKeyHandler);
  }

  private _updateChoiceHighlight(idx: number): void {
    const buttons = Array.from(this.choiceEl.querySelectorAll('button')) as HTMLElement[];
    buttons.forEach((btn, i) => {
      const isAvail = btn.style.borderColor !== 'rgb(37, 40, 43)';
      if (i === idx && isAvail) {
        btn.style.background  = 'rgba(28,30,32,0.95)';
        btn.style.borderColor = '#d99846';
        btn.style.color       = '#e8a85a';
      } else if (isAvail) {
        btn.style.background  = 'rgba(12,13,14,0.92)';
        btn.style.borderColor = '#4a4f54';
        btn.style.color       = '#c2c7cb';
      }
    });
  }

  private _selectChoice(choice: DialogueChoice): void {
    this._hideChoices();
    this._awaitingChoice = false;

    if (this._registry && this._survival) {
      ChoiceEngine.resolve(choice, this._registry, this._survival);
    }

    this._onChoice?.(choice.nextId);

    // Advance to next queued line
    if (this._lineMode) {
      this._showNextDialogueLine();
    } else {
      this._showNextLine();
    }
  }

  private _hideChoices(): void {
    this.choiceEl.style.display = 'none';
    this.choiceEl.innerHTML = '';
    if (this._choiceKeyHandler) {
      document.removeEventListener('keydown', this._choiceKeyHandler);
      this._choiceKeyHandler = null;
    }
  }
}

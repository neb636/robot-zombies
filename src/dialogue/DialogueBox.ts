import { tts } from '../audio/TTSManager.js';

/**
 * DialogueBox — controls the HTML overlay (#dialogue-overlay).
 * Typewriter character reveal, SPACE/ENTER to advance.
 * Each line is also spoken aloud via TTSManager (unless muted).
 */
export class DialogueBox {
  private readonly overlay:  HTMLElement;
  private readonly speaker:  HTMLElement;
  private readonly textEl:   HTMLElement;
  private _queue:            string[] = [];
  private _active:           boolean = false;
  private _typing:           boolean = false;
  private _typeInterval:     ReturnType<typeof setInterval> | null = null;
  private _currentLine:      string = '';
  private _speaker:          string = '';
  private _onClose:          (() => void) | undefined = undefined;

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

    document.addEventListener('dialogue:advance', () => { this._advance(); });
  }

  open(speakerName: string, lines: readonly string[], onClose?: () => void): void {
    this._queue   = [...lines];
    this._onClose = onClose;
    this._speaker = speakerName;
    this._active  = true;
    this.overlay.style.display = 'block';
    this._showNextLine();
  }

  close(): void {
    if (this._typeInterval !== null) {
      clearInterval(this._typeInterval);
      this._typeInterval = null;
    }
    tts.cancel();
    this.overlay.style.display = 'none';
    this._active = false;
    this._queue  = [];
    this._onClose?.();
  }

  isActive(): boolean { return this._active; }

  private _showNextLine(): void {
    if (this._queue.length === 0) { this.close(); return; }
    const line = this._queue.shift()!;
    this.speaker.textContent = this._speaker;
    this._typewriterEffect(line);
  }

  private _advance(): void {
    if (!this._active) return;
    if (this._typing) {
      if (this._typeInterval !== null) {
        clearInterval(this._typeInterval);
        this._typeInterval = null;
      }
      tts.cancel();
      this._typing = false;
      this.textEl.textContent = this._currentLine;
    } else {
      this._showNextLine();
    }
  }

  private _typewriterEffect(text: string): void {
    this._currentLine = text;
    this._typing      = true;
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
        this._typing = false;
      }
    }, 28);
  }
}

/**
 * DialogueBox — controls the HTML overlay (#dialogue-overlay).
 * Typewriter character reveal, SPACE/ENTER to advance.
 */
export class DialogueBox {
  constructor() {
    this.overlay  = document.getElementById('dialogue-overlay');
    this.speaker  = document.getElementById('dialogue-speaker');
    this.textEl   = document.getElementById('dialogue-text');
    this._queue   = [];
    this._active  = false;
    this._typing  = false;
    this._typeInterval = null;
    this._currentLine  = '';

    document.addEventListener('dialogue:advance', () => this._advance());
  }

  /**
   * @param {string}   speakerName
   * @param {string[]} lines
   * @param {Function} [onClose]
   */
  open(speakerName, lines, onClose) {
    this._queue    = [...lines];
    this._onClose  = onClose;
    this._speaker  = speakerName;
    this._active   = true;
    this.overlay.style.display = 'block';
    this._showNextLine();
  }

  close() {
    clearInterval(this._typeInterval);
    this.overlay.style.display = 'none';
    this._active = false;
    this._queue  = [];
    this._onClose?.();
  }

  isActive() { return this._active; }

  _showNextLine() {
    if (this._queue.length === 0) { this.close(); return; }
    const line = this._queue.shift();
    this.speaker.textContent = this._speaker;
    this._typewriterEffect(line);
  }

  _advance() {
    if (!this._active) return;
    if (this._typing) {
      clearInterval(this._typeInterval);
      this._typing = false;
      this.textEl.textContent = this._currentLine;
    } else {
      this._showNextLine();
    }
  }

  _typewriterEffect(text) {
    this._currentLine = text;
    this._typing      = true;
    this.textEl.textContent = '';
    let i = 0;

    this._typeInterval = setInterval(() => {
      this.textEl.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(this._typeInterval);
        this._typing = false;
      }
    }, 28);
  }
}

/**
 * MobileControls — HTML virtual d-pad and interact button for touch devices.
 *
 * Only renders on touch-capable devices; on desktop all methods are no-ops.
 * Scenes call new MobileControls() after building the player, then destroy()
 * on shutdown. Player.ts polls isLeft/Right/Up/Down() each frame.
 */
export class MobileControls {
  readonly isTouchDevice: boolean;

  private _left:     boolean = false;
  private _right:    boolean = false;
  private _up:       boolean = false;
  private _down:     boolean = false;

  private _container:      HTMLElement | null = null;
  private _interactBtn:    HTMLElement | null = null;

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isTouchDevice) {
      this._build();
    }
  }

  // ─── Polling API (called by Player.update each frame) ─────────────────────

  isLeft():  boolean { return this._left; }
  isRight(): boolean { return this._right; }
  isUp():    boolean { return this._up; }
  isDown():  boolean { return this._down; }

  // ─── Interact button visibility ───────────────────────────────────────────

  showInteract(label: string): void {
    if (!this._interactBtn) return;
    this._interactBtn.textContent = label;
    this._interactBtn.style.display = 'flex';
  }

  hideInteract(): void {
    if (!this._interactBtn) return;
    this._interactBtn.style.display = 'none';
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  destroy(): void {
    this._container?.remove();
    this._container   = null;
    this._interactBtn = null;
    this._left = this._right = this._up = this._down = false;
  }

  // ─── DOM construction ─────────────────────────────────────────────────────

  private _build(): void {
    // Outer wrapper — covers the whole viewport but passes pointer events
    // through except on the actual buttons.
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9998',
      'user-select:none',
      '-webkit-user-select:none',
    ].join(';');
    document.body.appendChild(wrap);
    this._container = wrap;

    // ── D-pad cluster (bottom-left) ──────────────────────────────────────
    const dpad = document.createElement('div');
    dpad.style.cssText = [
      'position:absolute',
      'bottom:28px',
      'left:28px',
      'width:132px',
      'height:132px',
      'pointer-events:none',
    ].join(';');
    wrap.appendChild(dpad);

    const dirs: Array<[string, number, number, () => void, () => void]> = [
      ['▲', 44, 0,  () => { this._up    = true; }, () => { this._up    = false; }],
      ['▼', 44, 88, () => { this._down  = true; }, () => { this._down  = false; }],
      ['◄', 0,  44, () => { this._left  = true; }, () => { this._left  = false; }],
      ['►', 88, 44, () => { this._right = true; }, () => { this._right = false; }],
    ];

    for (const [label, left, top, onPress, onRelease] of dirs) {
      const btn = this._makeBtn(label, 44);
      btn.style.left = `${left}px`;
      btn.style.top  = `${top}px`;
      this._bindBtn(btn, onPress, onRelease);
      dpad.appendChild(btn);
    }

    // ── Interact button (bottom-right, hidden until scene activates it) ──
    const interact = this._makeBtn('', 60);
    interact.style.cssText += [
      ';position:fixed',
      'bottom:40px',
      'right:40px',
      'width:60px',
      'height:60px',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-size:11px',
      'line-height:1.2',
      'text-align:center',
      'padding:4px',
      'pointer-events:auto',
    ].join(';');
    interact.style.left = '';
    interact.style.top  = '';
    interact.addEventListener('touchstart', (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('interact:tap'));
    }, { passive: false });
    wrap.appendChild(interact);
    this._interactBtn = interact;
  }

  private _makeBtn(label: string, size: number): HTMLElement {
    const btn = document.createElement('div');
    btn.textContent = label;
    btn.style.cssText = [
      'position:absolute',
      `width:${size}px`,
      `height:${size}px`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(100,160,255,0.18)',
      'border:2px solid rgba(100,160,255,0.35)',
      'border-radius:50%',
      'color:rgba(180,210,255,0.85)',
      'font-size:22px',
      'font-family:monospace',
      'pointer-events:auto',
      'touch-action:none',
      '-webkit-tap-highlight-color:transparent',
    ].join(';');
    return btn;
  }

  private _bindBtn(btn: HTMLElement, onPress: () => void, onRelease: () => void): void {
    btn.addEventListener('touchstart',  (e) => { e.preventDefault(); onPress();   }, { passive: false });
    btn.addEventListener('touchend',    (e) => { e.preventDefault(); onRelease(); }, { passive: false });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); onRelease(); }, { passive: false });
  }
}

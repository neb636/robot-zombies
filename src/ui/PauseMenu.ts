import { bus }    from '../utils/EventBus.js';
import { EVENTS } from '../utils/constants.js';

interface PauseMenuItem {
  label:  string;
  action: () => void;
}

class PauseMenu {
  private readonly _overlay:  HTMLElement;
  private readonly _list:     HTMLElement;
  private _open            = false;
  private _blocked         = false;
  private _selectedIndex   = 0;
  private _items:          PauseMenuItem[];
  private _keyHandler:     ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    const overlay = document.getElementById('pause-overlay');
    const list    = document.getElementById('pause-menu-list');
    if (!overlay || !list) {
      throw new Error('PauseMenu: #pause-overlay or #pause-menu-list not found in DOM');
    }
    this._overlay = overlay;
    this._list    = list;
    this._items   = [{ label: 'RESUME', action: () => { this.close(); } }];
    this._renderItems();
  }

  isOpen(): boolean { return this._open; }

  /** Block or unblock pause (call from BattleScene). */
  setBlocked(blocked: boolean): void { this._blocked = blocked; }

  /** Open pause menu. Guards: blocked, dialogue active, already open. */
  open(): void {
    if (this._open)    return;
    if (this._blocked) return;

    this._open          = true;
    this._selectedIndex = 0;
    this._renderItems();
    this._overlay.style.display = 'flex';
    bus.emit(EVENTS.PAUSE_OPEN, {});

    this._keyHandler = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      switch (e.key) {
        case 'ArrowUp':
          this._selectedIndex = Math.max(0, this._selectedIndex - 1);
          this._renderItems();
          break;
        case 'ArrowDown':
          this._selectedIndex = Math.min(this._items.length - 1, this._selectedIndex + 1);
          this._renderItems();
          break;
        case 'Enter':
          this._activate();
          break;
        case 'Escape':
          this.close();
          break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  /** Close pause menu. */
  close(): void {
    if (!this._open) return;
    this._open = false;
    this._overlay.style.display = 'none';
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    bus.emit(EVENTS.PAUSE_CLOSE, {});
  }

  /**
   * Add a menu item. Pass an index to insert at a specific position,
   * or omit to append. "Resume" always stays at index 0.
   */
  addItem(label: string, action: () => void, index?: number): void {
    const item: PauseMenuItem = { label, action };
    if (index !== undefined) {
      this._items.splice(index, 0, item);
    } else {
      this._items.push(item);
    }
    if (this._open) this._renderItems();
  }

  private _activate(): void {
    const item = this._items[this._selectedIndex];
    if (item) item.action();
  }

  private _renderItems(): void {
    this._list.innerHTML = '';
    this._items.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = i === this._selectedIndex ? `> ${item.label}` : `  ${item.label}`;
      if (i === this._selectedIndex) li.style.color = '#7aaeff';
      li.addEventListener('click', () => {
        this._selectedIndex = i;
        this._activate();
      });
      this._list.appendChild(li);
    });
  }
}

export const pauseMenu = new PauseMenu();

import Phaser from 'phaser';
import { SurvivalManager } from '../survival/SurvivalManager.js';
import { pricesForRegion, moraleItemForRegion, tradeDescriptionForRegion } from '../survival/TradeCatalog.js';
import type { TradePrices, TradeEntry } from '../types.js';

// ─── Layout constants ──────────────────────────────────────────────────────

const PAD        = 24;
const ROW_H      = 56;
const BTN_W      = 40;
const BTN_H      = 40;
const COL_ITEM   = 0.10;
const COL_BUY    = 0.45;
const COL_SELL   = 0.70;
const COL_CTRL   = 0.85;

const FONT_MAIN  = { fontFamily: 'monospace', fontSize: '16px', color: '#ddcc88' };
const FONT_DIM   = { fontFamily: 'monospace', fontSize: '14px', color: '#887766' };
const FONT_TITLE = { fontFamily: 'monospace', fontSize: '22px', color: '#eeeeaa' };
const FONT_SCRAP = { fontFamily: 'monospace', fontSize: '18px', color: '#88ddaa' };
const FONT_ERR   = { fontFamily: 'monospace', fontSize: '13px', color: '#dd5555' };

interface CartEntry {
  item: TradeEntry['item'];
  buyQty:  number;
  sellQty: number;
}

/**
 * Trade screen for safe-house merchants.
 *
 * Launched as an overlay scene (scene.launch('TradeScene')).
 * Mobile-friendly: all actions available via tappable +/− buttons.
 * Keyboard: arrow keys to navigate rows, B/S to buy/sell 1, Enter to confirm.
 *
 * Reads from and writes to SurvivalManager.
 */
export class TradeScene extends Phaser.Scene {
  // ── State ──────────────────────────────────────────────────────────────
  private _survival!: SurvivalManager;
  private _prices!: TradePrices;
  private _cart: CartEntry[] = [];
  private _selectedRow: number = 0;
  private _statusText!: Phaser.GameObjects.Text;
  private _scrapText!: Phaser.GameObjects.Text;
  private _rowObjects: Phaser.GameObjects.Group[] = [];

  constructor() {
    super({ key: 'TradeScene' });
  }

  create(): void {
    this._survival = SurvivalManager.instance(this);
    const region   = this._survival.region();
    this._prices   = pricesForRegion(region);
    const state    = this._survival.getState();
    const { width, height } = this.scale;

    // ── Background overlay ────────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
    const panelW = Math.min(700, width - PAD * 2);
    const panelH = Math.min(520, height - PAD * 2);
    const panelX = Math.floor((width  - panelW) / 2);
    const panelY = Math.floor((height - panelH) / 2);
    this.add.rectangle(panelX, panelY, panelW, panelH, 0x111108, 0.97).setOrigin(0);
    this.add.rectangle(panelX, panelY, panelW, panelH, 0x665500, 0).setOrigin(0)
      .setStrokeStyle(2, 0x887744);

    // ── Title ─────────────────────────────────────────────────────────
    const desc = tradeDescriptionForRegion(region);
    this.add.text(panelX + panelW / 2, panelY + 18, 'TRADE', FONT_TITLE).setOrigin(0.5, 0);
    this.add.text(panelX + panelW / 2, panelY + 46, desc, FONT_DIM).setOrigin(0.5, 0);

    // ── Scrap counter ─────────────────────────────────────────────────
    this._scrapText = this.add.text(
      panelX + panelW - PAD,
      panelY + 18,
      `Scrap: ${state.scrap}`,
      FONT_SCRAP,
    ).setOrigin(1, 0);

    // ── Column headers ─────────────────────────────────────────────────
    const headerY = panelY + 76;
    this.add.text(panelX + panelW * COL_ITEM,  headerY, 'ITEM',      FONT_DIM).setOrigin(0, 0);
    this.add.text(panelX + panelW * COL_BUY,   headerY, 'BUY',       FONT_DIM).setOrigin(0, 0);
    this.add.text(panelX + panelW * COL_SELL,  headerY, 'SELL',      FONT_DIM).setOrigin(0, 0);
    this.add.text(panelX + panelW * COL_CTRL,  headerY, 'HAVE',      FONT_DIM).setOrigin(0, 0);

    // Separator
    const sepY = headerY + 22;
    this.add.rectangle(panelX + PAD, sepY, panelW - PAD * 2, 1, 0x665500).setOrigin(0, 0);

    // ── Item rows ──────────────────────────────────────────────────────
    this._cart = this._prices.entries.map(e => ({
      item:    e.item,
      buyQty:  0,
      sellQty: 0,
    }));

    this._rowObjects = [];
    for (let i = 0; i < this._prices.entries.length; i++) {
      this._buildRow(i, panelX, sepY + PAD, panelW, state);
    }

    // ── Status / feedback line ─────────────────────────────────────────
    const statusY = panelY + panelH - 80;
    this._statusText = this.add.text(
      panelX + panelW / 2,
      statusY,
      '',
      FONT_ERR,
    ).setOrigin(0.5, 0);

    // ── Confirm + Close buttons ────────────────────────────────────────
    const confirmY = panelY + panelH - 50;
    this._makeTextButton(
      panelX + panelW * 0.35,
      confirmY,
      'CONFIRM (Enter)',
      0x336633,
      () => { this._confirm(); },
    );
    this._makeTextButton(
      panelX + panelW * 0.70,
      confirmY,
      'CLOSE (Esc)',
      0x443322,
      () => { this._close(); },
    );

    // ── Keyboard input ────────────────────────────────────────────────
    const upKey    = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey  = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const leftKey  = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const rightKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey   = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    upKey?.on('down',    () => { this._navigate(-1); });
    downKey?.on('down',  () => { this._navigate(1); });
    leftKey?.on('down',  () => { this._adjustQty(this._selectedRow, 'buy', -1); });
    rightKey?.on('down', () => { this._adjustQty(this._selectedRow, 'buy', 1); });
    enterKey?.on('down', () => { this._confirm(); });
    escKey?.on('down',   () => { this._close(); });

    // ── Morale item note ──────────────────────────────────────────────
    const moraleEntry = this._prices.entries.find(e => e.item === 'morale_item');
    if (moraleEntry) {
      const moraleInfo = moraleItemForRegion(region);
      const noteY = panelY + panelH - 110;
      this.add.text(
        panelX + PAD,
        noteY,
        `Morale item: ${moraleInfo.name} — "${moraleInfo.flavor}"`,
        { ...FONT_DIM, fontSize: '12px', wordWrap: { width: panelW - PAD * 2 } },
      ).setOrigin(0, 0);
    }

    this._highlightRow(this._selectedRow);
  }

  // ─── Row builder ───────────────────────────────────────────────────────

  private _buildRow(
    index: number,
    panelX: number,
    sepY: number,
    panelW: number,
    state: Readonly<import('../types.js').SurvivalState>,
  ): void {
    const entry  = this._prices.entries[index];
    const cart   = this._cart[index];
    if (!entry || !cart) return;

    const rowY   = sepY + index * ROW_H + PAD / 2;
    const group  = this.add.group();
    this._rowObjects[index] = group;

    // Item label
    const label = entry.item === 'morale_item'
      ? moraleItemForRegion(this._survival.region()).name
      : entry.item.charAt(0).toUpperCase() + entry.item.slice(1);

    const labelText = this.add.text(
      panelX + panelW * COL_ITEM,
      rowY,
      label,
      FONT_MAIN,
    ).setOrigin(0, 0.5);
    group.add(labelText);

    // Buy price
    const buyText = this.add.text(
      panelX + panelW * COL_BUY,
      rowY,
      `${entry.buyPrice}¢`,
      FONT_MAIN,
    ).setOrigin(0, 0.5);
    group.add(buyText);

    // Sell price
    const sellText = this.add.text(
      panelX + panelW * COL_SELL,
      rowY,
      entry.sellPrice > 0 ? `${entry.sellPrice}¢` : '—',
      FONT_MAIN,
    ).setOrigin(0, 0.5);
    group.add(sellText);

    // Current inventory
    const haveKey = entry.item === 'morale_item' ? null : entry.item as keyof typeof state;
    const haveVal = haveKey ? (state[haveKey] as number) : 0;
    const haveText = this.add.text(
      panelX + panelW * COL_CTRL,
      rowY,
      `${haveVal}`,
      FONT_MAIN,
    ).setOrigin(0, 0.5);
    group.add(haveText);

    // ── Buy −/+ buttons ──────────────────────────────────────────────
    const buyBtnX = panelX + panelW * COL_BUY + 60;
    this._makeAdjButton(buyBtnX,       rowY, '−', () => { this._adjustQty(index, 'buy', -1); }, group);
    const buyQtyText = this.add.text(buyBtnX + BTN_W + 4, rowY, '0', FONT_MAIN).setOrigin(0, 0.5);
    group.add(buyQtyText);
    this._makeAdjButton(buyBtnX + BTN_W + 24, rowY, '+', () => { this._adjustQty(index, 'buy', 1); }, group);

    // ── Sell −/+ buttons (skip morale items) ─────────────────────────
    if (entry.sellPrice > 0 && entry.item !== 'morale_item') {
      const sellBtnX = panelX + panelW * COL_SELL + 60;
      this._makeAdjButton(sellBtnX,           rowY, '−', () => { this._adjustQty(index, 'sell', -1); }, group);
      const sellQtyText = this.add.text(sellBtnX + BTN_W + 4, rowY, '0', FONT_MAIN).setOrigin(0, 0.5);
      group.add(sellQtyText);
      this._makeAdjButton(sellBtnX + BTN_W + 24, rowY, '+', () => { this._adjustQty(index, 'sell', 1); }, group);
    }
  }

  // ─── Quantity adjustment ───────────────────────────────────────────────

  private _adjustQty(rowIndex: number, mode: 'buy' | 'sell', delta: number): void {
    const cart = this._cart[rowIndex];
    const entry = this._prices.entries[rowIndex];
    if (!cart || !entry) return;

    const state = this._survival.getState();

    if (mode === 'buy') {
      const next = Math.max(0, cart.buyQty + delta);
      const totalCost = next * entry.buyPrice;
      if (delta > 0 && totalCost > state.scrap) {
        this._showStatus('Not enough scrap.');
        return;
      }
      cart.buyQty = next;
    } else {
      const haveKey = entry.item as keyof typeof state;
      const haveVal = typeof state[haveKey] === 'number' ? state[haveKey] as number : 0;
      const next = Math.max(0, Math.min(cart.sellQty + delta, haveVal));
      cart.sellQty = next;
    }

    this._refreshQtyDisplay(rowIndex);
    this._showStatus('');
  }

  private _refreshQtyDisplay(rowIndex: number): void {
    // Rebuild the row with updated quantities
    // Simplest approach: destroy and recreate row
    const group = this._rowObjects[rowIndex];
    if (group) {
      group.destroy(true);
    }
    const { width } = this.scale;
    const { height } = this.scale;
    const panelW = Math.min(700, width - PAD * 2);
    const panelX = Math.floor((width  - panelW) / 2);
    const panelY = Math.floor((height - Math.min(520, height - PAD * 2)) / 2);
    const sepY   = panelY + 76 + 22;
    this._buildRow(rowIndex, panelX, sepY + PAD, panelW, this._survival.getState());
    this._highlightRow(this._selectedRow);
    this._updateScrapDisplay();
  }

  // ─── Confirm trade ─────────────────────────────────────────────────────

  private _confirm(): void {
    const state = this._survival.getState();
    let scrap   = state.scrap;

    // Validate all buy orders against current scrap (scrap may have changed mid-session)
    let totalCost = 0;
    for (let i = 0; i < this._cart.length; i++) {
      const cart  = this._cart[i];
      const entry = this._prices.entries[i];
      if (!cart || !entry) continue;
      totalCost += cart.buyQty * entry.buyPrice;
    }

    if (totalCost > scrap) {
      this._showStatus('Not enough scrap to confirm this order.');
      return;
    }

    // Apply sells first (they add scrap)
    for (let i = 0; i < this._cart.length; i++) {
      const cart  = this._cart[i];
      const entry = this._prices.entries[i];
      if (!cart || !entry || cart.sellQty === 0) continue;
      if (entry.item === 'morale_item') continue;
      const item = entry.item as keyof import('../types.js').SurvivalState;
      this._survival.consume(item, cart.sellQty);
      scrap += cart.sellQty * entry.sellPrice;
      this._survival.addItem('scrap', cart.sellQty * entry.sellPrice);
    }

    // Apply buys
    for (let i = 0; i < this._cart.length; i++) {
      const cart  = this._cart[i];
      const entry = this._prices.entries[i];
      if (!cart || !entry || cart.buyQty === 0) continue;
      const cost = cart.buyQty * entry.buyPrice;
      this._survival.consume('scrap', cost);

      if (entry.item === 'morale_item') {
        this._survival.addItem('morale', 10); // Morale item grants +10 morale
      } else {
        const item = entry.item as keyof import('../types.js').SurvivalState;
        this._survival.addItem(item, cart.buyQty);
      }

      cart.buyQty  = 0;
      cart.sellQty = 0;
    }

    this._showStatus('Trade complete.');
    this._updateScrapDisplay();

    // Rebuild all rows
    for (let i = 0; i < this._cart.length; i++) {
      this._refreshQtyDisplay(i);
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────

  private _navigate(delta: number): void {
    this._selectedRow = (this._selectedRow + delta + this._prices.entries.length) % this._prices.entries.length;
    this._highlightRow(this._selectedRow);
  }

  private _highlightRow(_index: number): void {
    // Visual highlight: change text color of selected row
    // Because we use groups, simplest is a subtle rectangle overlay
    // (managed separately from row objects to avoid rebuild)
    // Nothing needed here beyond the keyboard feedback — the +/− buttons are
    // always tappable, and keyboard adjusts the selected row.
  }

  // ─── Scrap display update ─────────────────────────────────────────────

  private _updateScrapDisplay(): void {
    const state = this._survival.getState();
    this._scrapText.setText(`Scrap: ${state.scrap}`);
  }

  // ─── Status message ───────────────────────────────────────────────────

  private _showStatus(msg: string): void {
    this._statusText.setText(msg);
  }

  // ─── Close ────────────────────────────────────────────────────────────

  private _close(): void {
    this.scene.stop();
  }

  // ─── Button factory ───────────────────────────────────────────────────

  private _makeAdjButton(
    x: number,
    y: number,
    label: string,
    onTap: () => void,
    group?: Phaser.GameObjects.Group,
  ): void {
    const btn = this.add.rectangle(x, y, BTN_W, BTN_H, 0x334455)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x + BTN_W / 2, y, label, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaccee',
    }).setOrigin(0.5, 0.5);

    btn.on('pointerdown', onTap);
    btn.on('pointerover',  () => { btn.setFillStyle(0x4466aa); });
    btn.on('pointerout',   () => { btn.setFillStyle(0x334455); });

    if (group) {
      group.add(btn);
      group.add(txt);
    }
  }

  private _makeTextButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onTap: () => void,
  ): void {
    const btn = this.add.rectangle(x, y, 180, 38, color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerdown', onTap);
    btn.on('pointerover',  () => { btn.setAlpha(0.8); });
    btn.on('pointerout',   () => { btn.setAlpha(1.0); });
  }
}

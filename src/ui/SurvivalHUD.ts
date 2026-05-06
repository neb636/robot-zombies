import Phaser from 'phaser';
import type { SurvivalState } from '../types.js';
import { EVENTS } from '../utils/constants.js';
import { bus }    from '../utils/EventBus.js';

const PANEL_W = 148;
const PANEL_H = 138;
const MARGIN  = 10;

/**
 * SurvivalHUD — compact top-right overlay showing survival resources.
 *
 * Renders: food, fuel, medicine, ammo, morale bar, day count, region name.
 * Re-renders on EVENTS.SURVIVAL_TICK. Depth 50 so it sits above the world map
 * but below any full-screen overlays.
 */
export class SurvivalHUD {
  private readonly _scene:   Phaser.Scene;
  private readonly _bg:      Phaser.GameObjects.Rectangle;
  private readonly _gfx:     Phaser.GameObjects.Graphics;
  private readonly _texts:   Map<string, Phaser.GameObjects.Text> = new Map();
  private _state:            SurvivalState | null = null;
  private _offBusTick:       (() => void) | null  = null;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;

    const { width } = scene.cameras.main;
    const x = width - PANEL_W - MARGIN;
    const y = MARGIN;

    this._bg = scene.add
      .rectangle(x, y, PANEL_W, PANEL_H, 0x0a140a, 0.72)
      .setOrigin(0, 0)
      .setDepth(50)
      .setScrollFactor(0);

    this._gfx = scene.add.graphics().setDepth(51).setScrollFactor(0);

    // Static labels — created once
    this._makeLabel('day',      x + 6,  y + 6,  'DAY 0');
    this._makeLabel('region',   x + 6,  y + 18, 'BOSTON');
    this._makeLabel('food',     x + 6,  y + 36, 'FOOD:  --');
    this._makeLabel('fuel',     x + 6,  y + 50, 'FUEL:  --');
    this._makeLabel('medicine', x + 6,  y + 64, 'MED:   --');
    this._makeLabel('ammo',     x + 6,  y + 78, 'AMMO:  --');
    this._makeLabel('morale',   x + 6,  y + 97, 'MORALE');

    // Subscribe to survival ticks
    this._offBusTick = bus.on(EVENTS.SURVIVAL_TICK, ({ state }) => {
      this.update(state);
    });
  }

  /**
   * Push a new SurvivalState; re-renders immediately.
   */
  update(state: SurvivalState): void {
    this._state = state;
    this._render();
  }

  /**
   * Clean up — call on scene shutdown.
   */
  destroy(): void {
    this._offBusTick?.();
    this._offBusTick = null;
    this._gfx.destroy();
    this._bg.destroy();
    this._texts.forEach(t => { t.destroy(); });
    this._texts.clear();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _makeLabel(key: string, x: number, y: number, initial: string): void {
    const t = this._scene.add
      .text(x, y, initial, {
        fontFamily: 'monospace',
        fontSize:   '9px',
        color:      '#99bb99',
      })
      .setDepth(52)
      .setScrollFactor(0);
    this._texts.set(key, t);
  }

  private _setText(key: string, value: string): void {
    this._texts.get(key)?.setText(value);
  }

  private _render(): void {
    if (!this._state) return;
    const s = this._state;

    const regionLabel = s.region.replace(/_/g, ' ').toUpperCase();
    this._setText('day',      `DAY ${s.daysElapsed}`);
    this._setText('region',   regionLabel);
    this._setText('food',     `FOOD:  ${s.food}`);
    this._setText('fuel',     `FUEL:  ${s.fuel}`);
    this._setText('medicine', `MED:   ${s.medicine}`);
    this._setText('ammo',     `AMMO:  ${s.ammo}`);

    // Morale bar
    const { width } = this._scene.cameras.main;
    const panelX = width - PANEL_W - MARGIN;
    const panelY = MARGIN;
    const barX   = panelX + 6;
    const barY   = panelY + 110;
    const barW   = PANEL_W - 12;
    const barH   = 6;
    const filled = Math.max(0, Math.min(PANEL_W - 12, Math.floor(barW * s.morale / 100)));
    const barColor = s.morale >= 50 ? 0x44cc44 : s.morale >= 25 ? 0xddaa22 : 0xcc3333;

    this._gfx.clear();
    this._gfx.fillStyle(0x223322, 1);
    this._gfx.fillRect(barX, barY, barW, barH);
    this._gfx.fillStyle(barColor, 1);
    this._gfx.fillRect(barX, barY, filled, barH);
  }
}

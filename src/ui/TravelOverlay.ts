import Phaser from 'phaser';
import type { WorldNode } from '../world/WorldMapManager.js';

const ANIM_DURATION_MS = 1500; // 1.5 s per brief
const DASH_LEN         = 6;
const GAP_LEN          = 4;
const LINE_WIDTH        = 2;
const DOT_COLOR         = 0xffffff;
const LINE_COLOR        = 0x88bbff;

/**
 * TravelOverlay — draws an animated dotted line from the current node to the
 * target node over 1.5 seconds, then resolves the returned Promise.
 *
 * Usage:
 *   const overlay = new TravelOverlay(scene);
 *   await overlay.play(fromNode, toNode);
 *   overlay.destroy();
 */
export class TravelOverlay {
  private readonly _scene:  Phaser.Scene;
  private readonly _gfx:    Phaser.GameObjects.Graphics;
  private readonly _marker: Phaser.GameObjects.Rectangle;
  private _elapsed:         number = 0;
  private _playing:         boolean = false;
  private _resolve:         (() => void) | null = null;
  private _fromNode:        WorldNode | null = null;
  private _toNode:          WorldNode | null = null;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this._gfx   = scene.add.graphics().setDepth(20).setScrollFactor(0);

    // Marker dot that slides along the path
    this._marker = scene.add
      .rectangle(0, 0, 8, 8, 0xffffff)
      .setDepth(21)
      .setScrollFactor(0)
      .setVisible(false);
  }

  /**
   * Animate the dotted line from `from` to `to`.  Resolves after 1.5 s.
   */
  play(from: WorldNode, to: WorldNode): Promise<void> {
    this._fromNode = from;
    this._toNode   = to;
    this._elapsed  = 0;
    this._playing  = true;
    this._marker.setVisible(true);

    return new Promise<void>((resolve) => {
      this._resolve = resolve;
      // Register one-time update loop via scene's update event
      this._scene.events.on('update', this._onUpdate, this);
    });
  }

  destroy(): void {
    this._scene.events.off('update', this._onUpdate, this);
    this._gfx.destroy();
    this._marker.destroy();
    this._playing = false;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _onUpdate(_time: number, delta: number): void {
    if (!this._playing || !this._fromNode || !this._toNode) return;

    this._elapsed += delta;
    const t = Math.min(this._elapsed / ANIM_DURATION_MS, 1);

    const fx = this._fromNode.mapX;
    const fy = this._fromNode.mapY;
    const tx = this._toNode.mapX;
    const ty = this._toNode.mapY;

    this._drawDottedLine(fx, fy, tx, ty, t);

    // Move marker along path
    this._marker.setPosition(
      Math.round(fx + (tx - fx) * t),
      Math.round(fy + (ty - fy) * t),
    );

    if (t >= 1) {
      this._playing = false;
      this._scene.events.off('update', this._onUpdate, this);
      this._marker.setVisible(false);

      if (this._resolve) {
        const cb = this._resolve;
        this._resolve = null;
        cb();
      }
    }
  }

  /**
   * Draws a dashed/dotted line from (x0,y0) to (x1,y1), rendering only up to
   * `progress` fraction of the total path length.
   */
  private _drawDottedLine(
    x0: number, y0: number,
    x1: number, y1: number,
    progress: number,
  ): void {
    const dx     = x1 - x0;
    const dy     = y1 - y0;
    const total  = Math.sqrt(dx * dx + dy * dy);
    const len    = total * progress;
    const ux     = dx / total;
    const uy     = dy / total;

    this._gfx.clear();
    this._gfx.lineStyle(LINE_WIDTH, LINE_COLOR, 0.85);

    let pos = 0;
    let drawing = true;

    while (pos < len) {
      const segEnd = Math.min(pos + (drawing ? DASH_LEN : GAP_LEN), len);

      if (drawing) {
        this._gfx.beginPath();
        this._gfx.moveTo(x0 + ux * pos,    y0 + uy * pos);
        this._gfx.lineTo(x0 + ux * segEnd,  y0 + uy * segEnd);
        this._gfx.strokePath();
      }

      pos    += drawing ? DASH_LEN : GAP_LEN;
      drawing = !drawing;
    }

    // Draw circles at endpoints
    this._gfx.fillStyle(DOT_COLOR, 0.9);
    this._gfx.fillCircle(x0, y0, 4);
    if (progress > 0.05) {
      this._gfx.fillCircle(
        Math.round(x0 + ux * len),
        Math.round(y0 + uy * len),
        3,
      );
    }
  }
}

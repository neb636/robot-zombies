import Phaser from 'phaser';
import type { ATBCombatant, ActiveStatusEffect } from '../types.js';
import type { Enemy } from '../entities/Enemy.js';

interface HudEntity {
  name:      string;
  hp:        number;
  maxHp:     number;
  row?:      'front' | 'back';
  atb?:      number;
  statuses?: ActiveStatusEffect[];
}

/** Color per status effect key. */
const STATUS_COLORS: Record<string, number> = {
  Stunned:  0xff4444,
  Burning:  0xff8800,
  Hacked:   0xaa00ff,
  Shielded: 0x4488ff,
  Panicked: 0x888888,
};

/**
 * BattleHUD — HP bars, ATB bars, status icons, and action menu.
 */
export class BattleHUD {
  private readonly scene:    Phaser.Scene;
  private _player:           HudEntity | null = null;
  private _enemy:            HudEntity | null = null;
  private _allies:           HudEntity[] = [];
  private readonly _gfx:     Phaser.GameObjects.Graphics;
  private _texts:            Phaser.GameObjects.Text[] = [];
  private readonly _menuGrp: Phaser.GameObjects.Group;
  private _darkenedAllies:   Set<string> = new Set();
  private _pulseAcc:         number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene    = scene;
    this._gfx     = scene.add.graphics().setDepth(10);
    this._menuGrp = scene.add.group();
  }

  bind(player: ATBCombatant, enemy: Enemy, allies?: ATBCombatant[]): void {
    this._player = player;
    this._enemy  = enemy as unknown as HudEntity;
    this._allies = (allies ?? []) as HudEntity[];
  }

  darkenAlly(name: string): void {
    this._darkenedAllies.add(name);
  }

  removeAlly(name: string): void {
    this._allies = this._allies.filter(a => a.name !== name);
  }

  update(delta: number): void {
    this._pulseAcc += delta * 0.006;
    this._gfx.clear();
    this._texts.forEach(t => { t.destroy(); });
    this._texts = [];

    if (this._player) this._drawBar(this._player, 16, 16, 0x44ff88, this._player.name);
    if (this._enemy)  this._drawBar(this._enemy,  16, 60, 0xff4444, this._enemy.name);

    this._allies.forEach((ally, i) => {
      const darkened = this._darkenedAllies.has(ally.name);
      const color = darkened ? 0x555555 : 0xddaa44;
      this._drawBar(ally, 16, 104 + i * 44, color, ally.name);
    });
  }

  showMenu(items: Array<{ label: string; action: string }>, selectedIndex: number, onSelect?: (i: number) => void): void {
    this._menuGrp.clear(true, true);
    const x = 30;
    const y = this.scene.scale.height - 160;

    items.forEach((item, i) => {
      const sel  = i === selectedIndex;
      const text = this.scene.add.text(
        x, y + i * 34,
        `${sel ? '► ' : '  '}${item.label}`,
        {
          fontFamily:      'monospace',
          fontSize:        '18px',
          color:           sel ? '#7af' : '#aac',
          stroke:          '#000',
          strokeThickness: 3,
        },
      ).setDepth(11);

      if (onSelect) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerdown', () => { onSelect(i); });
      }

      this._menuGrp.add(text);
    });
  }

  hideMenu(): void {
    this._menuGrp.clear(true, true);
  }

  /** Flash a combo name center-screen for 500ms. */
  flashComboName(label: string): void {
    const { width, height } = this.scene.scale;
    const text = this.scene.add.text(width / 2, height / 2, label, {
      fontFamily:      'monospace',
      fontSize:        '32px',
      color:           '#ffffff',
      stroke:          '#000033',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.scene.tweens.add({
      targets:  text,
      alpha:    { from: 0, to: 1 },
      duration: 120,
      yoyo:     false,
      onComplete: () => {
        this.scene.tweens.add({
          targets:  text,
          alpha:    0,
          duration: 380,
          delay:    200,
          onComplete: () => { text.destroy(); },
        });
      },
    });
  }

  private _drawBar(entity: HudEntity, x: number, y: number, color: number, label: string): void {
    const w      = 200;
    const hpPct  = Math.max(0, entity.hp / entity.maxHp);

    // HP bar
    this._gfx.fillStyle(0x111133);
    this._gfx.fillRect(x, y, w, 16);
    this._gfx.fillStyle(color);
    this._gfx.fillRect(x, y, w * hpPct, 16);
    this._gfx.lineStyle(1, 0x7af);
    this._gfx.strokeRect(x, y, w, 16);

    // Name + HP text (row indicator appended when present)
    const rowTag = entity.row ? ` [${entity.row === 'front' ? 'F' : 'B'}]` : '';
    const t = this.scene.add.text(
      x, y - 14,
      `${label}${rowTag}  ${entity.hp}/${entity.maxHp}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#cde' },
    ).setDepth(11);
    this._texts.push(t);

    // ATB bar (only when entity has ATB)
    if (entity.atb !== undefined) {
      const atbY   = y + 18;
      const atbW   = 120;
      const atbPct = entity.atb / 100;

      this._gfx.fillStyle(0x111133);
      this._gfx.fillRect(x, atbY, atbW, 6);

      if (entity.atb >= 100) {
        // Pulsing cyan when full
        const alpha = 0.6 + 0.4 * Math.abs(Math.sin(this._pulseAcc));
        this._gfx.fillStyle(0x00ffff, alpha);
      } else {
        this._gfx.fillStyle(0x88aaff);
      }
      this._gfx.fillRect(x, atbY, atbW * atbPct, 6);

      // Status icons
      const statuses = entity.statuses ?? [];
      statuses.slice(0, 2).forEach((s, i) => {
        const sx = x + atbW + 6 + i * 12;
        const sy = atbY;
        const sc = STATUS_COLORS[s.key] ?? 0x888888;
        this._gfx.fillStyle(sc);
        this._gfx.fillRect(sx, sy, 8, 8);
      });
      if (statuses.length > 2) {
        const plusT = this.scene.add.text(
          x + atbW + 6 + 24, atbY - 2, '+',
          { fontFamily: 'monospace', fontSize: '10px', color: '#fff' },
        ).setDepth(11);
        this._texts.push(plusT);
      }
    }
  }
}

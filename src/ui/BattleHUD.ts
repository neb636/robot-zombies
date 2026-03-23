import Phaser from 'phaser';
import type { BattlePlayer } from '../types.js';
import type { Enemy } from '../entities/Enemy.js';

interface HudEntity {
  name: string;
  hp: number;
  maxHp: number;
}

/**
 * BattleHUD — HP bars and action menu rendered with Phaser Graphics + Text.
 */
export class BattleHUD {
  private readonly scene:    Phaser.Scene;
  private _player:           HudEntity | null = null;
  private _enemy:            HudEntity | null = null;
  private readonly _gfx:     Phaser.GameObjects.Graphics;
  private _texts:            Phaser.GameObjects.Text[] = [];
  private readonly _menuGrp: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene    = scene;
    this._gfx     = scene.add.graphics().setDepth(10);
    this._menuGrp = scene.add.group();
  }

  bind(player: BattlePlayer, enemy: Enemy): void {
    this._player = player;
    this._enemy  = enemy;
  }

  update(): void {
    this._gfx.clear();
    this._texts.forEach(t => { t.destroy(); });
    this._texts = [];

    if (this._player) this._drawBar(this._player, 16, 16,  0x44ff88, 'KAI');
    if (this._enemy)  this._drawBar(this._enemy,  16, 60, 0xff4444, this._enemy.name);
  }

  showMenu(items: Array<{ label: string; action: string }>, selectedIndex: number): void {
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
      this._menuGrp.add(text);
    });
  }

  hideMenu(): void {
    this._menuGrp.clear(true, true);
  }

  private _drawBar(entity: HudEntity, x: number, y: number, color: number, label: string): void {
    const w   = 200;
    const pct = Math.max(0, entity.hp / entity.maxHp);

    this._gfx.fillStyle(0x111133);
    this._gfx.fillRect(x, y, w, 16);
    this._gfx.fillStyle(color);
    this._gfx.fillRect(x, y, w * pct, 16);
    this._gfx.lineStyle(1, 0x7af);
    this._gfx.strokeRect(x, y, w, 16);

    const t = this.scene.add.text(
      x, y - 14,
      `${label}  ${entity.hp}/${entity.maxHp}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#cde' },
    ).setDepth(11);
    this._texts.push(t);
  }
}

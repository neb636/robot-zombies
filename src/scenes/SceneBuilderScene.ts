import Phaser from 'phaser';
import {
  renderApartment,
  type SceneLayout,
  type TilesetJson,
} from './renderers/apartmentLayout.js';

const DEFAULT_LAYOUT = 'prologue_apartment';

/**
 * SceneBuilderScene — dev-only. Renders a scene described in JSON from
 * `src/data/scenes/<name>.json`. Selected via ?build=<name> URL param.
 * Used to iterate on tile+prop layouts against staged pixellab assets
 * before committing to a real scene.
 */
export class SceneBuilderScene extends Phaser.Scene {
  private _layoutKey!: string;

  constructor() {
    super({ key: 'SceneBuilderScene' });
  }

  init(data: { layout?: string }): void {
    this._layoutKey = data.layout ?? this._readUrlParam() ?? DEFAULT_LAYOUT;
  }

  preload(): void {
    this.load.json('layout', `src/data/scenes/${this._layoutKey}.json`);
    this.load.once('filecomplete-json-layout', () => {
      const layout = this.cache.json.get('layout') as SceneLayout;

      for (const [key, path] of Object.entries(layout.tilesets)) {
        this.load.image(`ts_${key}`, `${path}.png`);
        this.load.json(`tsmeta_${key}`, `${path}.json`);
      }
      for (const [key, path] of Object.entries(layout.mapObjects)) {
        this.load.image(`obj_${key}`, path);
      }
      this.load.start();
    });
  }

  create(): void {
    const layout = this.cache.json.get('layout') as SceneLayout;
    if (!layout) {
      this._fatal(`Layout '${this._layoutKey}' not found.`);
      return;
    }

    this.cameras.main.setBackgroundColor('#101018');

    renderApartment(this, layout, {
      tilesetTextureKey: n => `ts_${n}`,
      tilesetMeta:       n => this.cache.json.get(`tsmeta_${n}`) as TilesetJson | undefined,
      objectTextureKey:  n => `obj_${n}`,
    });

    this._drawGrid(layout);
    this._drawHud(layout);

    this.cameras.main.setBounds(0, 0, layout.mapWidth, layout.mapHeight);
    const zoom = layout.camera?.zoom ?? 2;
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(layout.mapWidth / 2, layout.mapHeight / 2);

    this._setupPanKeys();
  }

  private _drawGrid(layout: SceneLayout): void {
    const g = this.add.graphics().setDepth(9999).setAlpha(0.08);
    g.lineStyle(1, 0xffffff, 1);
    const cell = layout.cellSize;
    for (let x = 0; x <= layout.mapWidth; x += cell) {
      g.moveTo(x, 0); g.lineTo(x, layout.mapHeight);
    }
    for (let y = 0; y <= layout.mapHeight; y += cell) {
      g.moveTo(0, y); g.lineTo(layout.mapWidth, y);
    }
    g.strokePath();

    const outline = this.add.graphics().setDepth(9998);
    outline.lineStyle(2, 0xff3366, 0.5);
    outline.strokeRect(0, 0, layout.mapWidth, layout.mapHeight);
  }

  private _drawHud(layout: SceneLayout): void {
    const text = [
      `BUILDER · ${layout.title}`,
      `map ${layout.mapWidth}×${layout.mapHeight}px (${Math.ceil(layout.mapWidth / layout.cellSize)}×${Math.ceil(layout.mapHeight / layout.cellSize)} cells @ ${layout.cellSize}px)`,
      `regions:${layout.regions.length}  objects:${layout.objects.length}`,
      `pan: WASD / arrows  ·  zoom: [=/-]`,
    ].join('  ·  ');

    this.add.text(8, 8, text, {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#88ccff',
      backgroundColor: '#000000cc',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(10000);
  }

  private _setupPanKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    const speed = 6;
    const keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,PLUS,MINUS,EQUALS') as Record<string, Phaser.Input.Keyboard.Key>;

    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      const cam = this.cameras.main;
      if (keys.W?.isDown || keys.UP?.isDown)    cam.scrollY -= speed;
      if (keys.S?.isDown || keys.DOWN?.isDown)  cam.scrollY += speed;
      if (keys.A?.isDown || keys.LEFT?.isDown)  cam.scrollX -= speed;
      if (keys.D?.isDown || keys.RIGHT?.isDown) cam.scrollX += speed;
    });

    keyboard.on('keydown-EQUALS', () => this.cameras.main.setZoom(this.cameras.main.zoom * 1.25));
    keyboard.on('keydown-PLUS',   () => this.cameras.main.setZoom(this.cameras.main.zoom * 1.25));
    keyboard.on('keydown-MINUS',  () => this.cameras.main.setZoom(this.cameras.main.zoom / 1.25));
  }

  private _readUrlParam(): string | null {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('build');
    } catch {
      return null;
    }
  }

  private _fatal(msg: string): void {
    this.add.text(20, 20, `[builder] ${msg}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff6677',
    });
  }
}

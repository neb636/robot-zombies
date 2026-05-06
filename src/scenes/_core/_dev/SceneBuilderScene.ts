import Phaser from 'phaser';
import {
  renderApartment,
  type SceneLayout,
  type TilesetJson,
} from '../../prologue/apartment/apartmentLayout.js';
import {
  APARTMENT_OBJECT_URLS,
  APARTMENT_TILESET_URLS,
  APARTMENT_TILESET_META_URLS,
} from '../../prologue/apartment/assets.js';
import apartmentLayout from '../../prologue/apartment/layoutV1.json';

const DEFAULT_LAYOUT = 'prologue_apartment';

/**
 * Static registry of layouts available to the builder. Add entries here as
 * new co-located scene layout JSONs come online; each entry pairs the layout
 * data with its tileset / object URL maps.
 */
const LAYOUTS: Record<string, {
  layout: SceneLayout;
  tilesets: Record<string, string>;
  tilesetsMeta: Record<string, string>;
  objects: Record<string, string>;
}> = {
  prologue_apartment: {
    layout:       apartmentLayout as SceneLayout,
    tilesets:     APARTMENT_TILESET_URLS,
    tilesetsMeta: APARTMENT_TILESET_META_URLS,
    objects:      APARTMENT_OBJECT_URLS,
  },
};

/**
 * SceneBuilderScene — dev-only. Renders a scene described in JSON co-located
 * with its parent scene. Layout selected via `?build=<name>` URL param;
 * available names live in the LAYOUTS registry above.
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
    const entry = LAYOUTS[this._layoutKey];
    if (!entry) return;
    for (const [key, url] of Object.entries(entry.tilesets)) {
      this.load.image(`ts_${key}`, url);
    }
    for (const [key, url] of Object.entries(entry.tilesetsMeta)) {
      this.load.json(`tsmeta_${key}`, url);
    }
    for (const [key, url] of Object.entries(entry.objects)) {
      this.load.image(`obj_${key}`, url);
    }
  }

  create(): void {
    const entry = LAYOUTS[this._layoutKey];
    if (!entry) {
      this._fatal(`Layout '${this._layoutKey}' not registered. Add it to LAYOUTS in SceneBuilderScene.ts.`);
      return;
    }
    const layout = entry.layout;

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

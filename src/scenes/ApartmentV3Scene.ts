import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { MobileControls } from '../utils/MobileControls.js';
import type { WasdKeys } from '../types.js';
import layout from '../data/scenes/apartment_v3.json';
import {
  preloadV3Assets,
  drawApartmentV3,
  buildV3Walls,
  type V3SceneLayout,
} from './renderers/apartmentV3Layout.js';

const L = layout as V3SceneLayout;

export class ApartmentV3Scene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:    WasdKeys;
  player!:  Player;
  mobileControls!: MobileControls;

  constructor() {
    super({ key: 'ApartmentV3Scene' });
  }

  preload(): void {
    preloadV3Assets(this, L);
  }

  create(): void {
    drawApartmentV3(this, L);
    const wallZones = buildV3Walls(this, L);

    const start = L.playerStart ?? { x: L.mapWidth / 2, y: L.mapHeight / 2 };
    this.player = new Player(this, start.x, start.y);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;

    const T  = L.wallThickness;
    const TH = L.topWallHeight;
    this.physics.world.setBounds(T, TH, L.mapWidth - T * 2, L.mapHeight - TH - T);
    this.physics.add.collider(this.player.sprite, wallZones);

    this.cameras.main.setBounds(0, 0, L.mapWidth, L.mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(L.camera?.zoom ?? 2);

    this.add.text(10, 10, '[DEV] Apartment v3 — sandbox', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#88aaff',
      backgroundColor: '#00001acc',
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(9999);

    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  update(): void {
    this.player.update();
  }
}

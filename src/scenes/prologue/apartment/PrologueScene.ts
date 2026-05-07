import Phaser from 'phaser';
import { Player }         from '../../../entities/Player.js';
import { MobileControls } from '../../../utils/MobileControls.js';
import type { WasdKeys }  from '../../../types.js';
import {
  MAP_W, MAP_H,
  TOP_WALL_H, BOTTOM_WALL_H, SIDE_WALL_W,
  FLOOR_X, FLOOR_Y, FLOOR_W, FLOOR_H,
  drawPrologueRoom, buildApartmentWalls,
} from './ApartmentRenderer.js';
import { pauseMenu } from '../../../ui/PauseMenu.js';

/**
 * PrologueScene — empty apartment shell. Story flow lives in SCENE_PLAN.md
 * and will be wired back in once the new room layout is approved.
 */
export class PrologueScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  mobileControls!: MobileControls;

  constructor() {
    super({ key: 'PrologueScene' });
  }

  create(): void {
    drawPrologueRoom(this);
    const wallZones = buildApartmentWalls(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;

    const startX = FLOOR_X + FLOOR_W / 2;
    const startY = FLOOR_Y + FLOOR_H / 2;
    this.player = new Player(this, startX, startY);
    this.player.name = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this.physics.world.setBounds(
      SIDE_WALL_W,
      TOP_WALL_H,
      MAP_W - SIDE_WALL_W * 2,
      MAP_H - TOP_WALL_H - BOTTOM_WALL_H,
    );
    this.physics.add.collider(this.player.sprite, wallZones);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
    });

    this.cameras.main.fadeIn(900, 0, 0, 0);
  }

  update(): void {
    if (pauseMenu.isOpen()) return;
    this.player.update();
  }
}

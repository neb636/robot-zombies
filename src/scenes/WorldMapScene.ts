import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { AudioManager }    from '../audio/AudioManager.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { TILE_SIZE, EVENTS } from '../utils/constants.js';
import { bus }             from '../utils/EventBus.js';
import type { WasdKeys }   from '../types.js';

/**
 * WorldMapScene — overworld traversal on a Tiled tile map.
 * Random encounters trigger when walking on encounter-tagged tiles.
 */
export class WorldMapScene extends Phaser.Scene {
  cursors!:       Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:          WasdKeys;
  private player!:         Player;
  private audioManager!:   AudioManager;
  private dialogueManager!: DialogueManager;
  private encounterRate:   number = 0.08;
  private mapWidth:        number = 0;
  private mapHeight:       number = 0;
  private obstacleLayer:   Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    this._buildTilemap();
    this._buildPlayer();
    this._buildCamera();
    this._setupInput();

    this.audioManager    = new AudioManager(this);
    this.dialogueManager = new DialogueManager(this);

    this.audioManager.playMusic('music-overworld');

    bus.on(EVENTS.BATTLE_END, ({ victory }) => {
      this.audioManager.playMusic('music-overworld');
      if (!victory) {
        this.dialogueManager.show('SYSTEM', [
          'You were defeated.',
          'Rebooting timeline...',
        ]);
      }
    });

    this.dialogueManager.show('SYSTEM', [
      'The robots have achieved sentience.',
      'They only want to HELP.',
      'Nobody asked them to.',
      'You must stop them, Kai.',
    ]);
  }

  update(): void {
    this.player.update();
    this._checkEncounter();
  }

  private _buildTilemap(): void {
    const hasTilemap = this.cache.tilemap.has('world-map');
    const hasTileset = this.textures.exists('world-tiles');

    if (!hasTilemap || !hasTileset) {
      this._buildPlaceholderMap();
      return;
    }

    const map     = this.make.tilemap({ key: 'world-map' });
    const tileset = map.addTilesetImage('world_tiles', 'world-tiles');

    if (!tileset) {
      this._buildPlaceholderMap();
      return;
    }

    map.createLayer('Ground', tileset, 0, 0);
    this.obstacleLayer = map.createLayer('Obstacles', tileset, 0, 0);
    this.obstacleLayer?.setCollisionByProperty({ collides: true });

    this.mapWidth  = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
  }

  private _buildPlaceholderMap(): void {
    const cols = 30, rows = 20;
    this.mapWidth  = cols * TILE_SIZE;
    this.mapHeight = rows * TILE_SIZE;

    const gfx = this.add.graphics();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gfx.fillStyle((r + c) % 2 === 0 ? 0x1a2a1a : 0x112211);
        gfx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    this.obstacleLayer = null;
  }

  private _buildPlayer(): void {
    this.player = new Player(this, 5 * TILE_SIZE, 5 * TILE_SIZE);
    if (this.obstacleLayer) {
      this.physics.add.collider(this.player.sprite, this.obstacleLayer);
    }
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
  }

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  private _setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
  }

  private _checkEncounter(): void {
    if (!this.player.isMoving) return;
    if (Math.random() < this.encounterRate) {
      this._startBattle();
    }
  }

  private _startBattle(): void {
    this.audioManager.stopMusic();
    this.scene.launch('BattleScene', {
      enemyKey:    'robot_zombie',
      returnScene: 'WorldMapScene',
    });
    this.scene.pause();
  }
}

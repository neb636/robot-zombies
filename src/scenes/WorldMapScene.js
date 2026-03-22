import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { AudioManager }    from '../audio/AudioManager.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { TILE_SIZE, EVENTS } from '../utils/constants.js';
import { bus }             from '../utils/EventBus.js';

/**
 * WorldMapScene — overworld traversal on a Tiled tile map.
 * Random encounters trigger when walking on encounter-tagged tiles.
 */
export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
    this.encounterRate = 0.08;
  }

  create() {
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

    // Opening dialogue
    this.dialogueManager.show('SYSTEM', [
      'The robots have achieved sentience.',
      'They only want to HELP.',
      'Nobody asked them to.',
      'You must stop them, Kai.',
    ]);
  }

  update() {
    this.player.update();
    this._checkEncounter();
  }

  _buildTilemap() {
    const hasTilemap  = this.cache.tilemap.has('world-map');
    const hasTileset  = this.textures.exists('world-tiles');

    if (!hasTilemap || !hasTileset) {
      this._buildPlaceholderMap();
      return;
    }

    const map     = this.make.tilemap({ key: 'world-map' });
    const tileset = map.addTilesetImage('world_tiles', 'world-tiles');

    this.groundLayer   = map.createLayer('Ground',    tileset, 0, 0);
    this.obstacleLayer = map.createLayer('Obstacles', tileset, 0, 0);
    this.obstacleLayer.setCollisionByProperty({ collides: true });

    this.mapWidth  = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
  }

  _buildPlaceholderMap() {
    // Checkerboard placeholder so the game runs without art assets
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

    // Static obstacle group (no physics tilemap)
    this.obstacleLayer = null;
    this.groundLayer   = null;
  }

  _buildPlayer() {
    this.player = new Player(this, 5 * TILE_SIZE, 5 * TILE_SIZE);
    if (this.obstacleLayer) {
      this.physics.add.collider(this.player.sprite, this.obstacleLayer);
    }
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
  }

  _buildCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D');
  }

  _checkEncounter() {
    if (!this.player.isMoving) return;
    if (Math.random() < this.encounterRate) {
      this._startBattle();
    }
  }

  _startBattle() {
    this.audioManager.stopMusic();
    this.scene.launch('BattleScene', {
      enemyKey:    'robot_zombie',
      returnScene: 'WorldMapScene',
    });
    this.scene.pause();
  }
}

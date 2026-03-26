import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { MobileControls }  from '../utils/MobileControls.js';
import { AudioManager }    from '../audio/AudioManager.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { TILE_SIZE, EVENTS } from '../utils/constants.js';
import { bus }             from '../utils/EventBus.js';
import type { WasdKeys }   from '../types.js';
import D from '../data/dialogue/world_map.json';
import { pauseMenu } from '../ui/PauseMenu.js';
import { WorldMapManager, NODE_COLORS } from '../world/WorldMapManager.js';
import nodeData from '../data/world/nodes.json';

/**
 * WorldMapScene — overworld traversal on a Tiled tile map.
 * Random encounters trigger when walking on encounter-tagged tiles.
 * Node graph is managed by WorldMapManager and rendered as an overlay.
 */
export class WorldMapScene extends Phaser.Scene {
  cursors!:            Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:               WasdKeys;
  mobileControls!:     MobileControls;
  private player!:     Player;
  private audioManager!:   AudioManager;
  private dialogueManager!: DialogueManager;
  private worldMap!:        WorldMapManager;
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
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.audioManager    = new AudioManager(this);
    this.dialogueManager = new DialogueManager(this);

    // Restore visited nodes from registry if available
    const savedVisited = this.registry.get('visitedNodes') as string[] | undefined;
    this.worldMap = new WorldMapManager(nodeData, savedVisited ?? []);
    // Mark Boston prologue nodes as visited since we've already been there
    this.worldMap.markVisited('beacon_hill');
    this.worldMap.markVisited('red_line_tunnels');
    this._buildNodeLayer();

    this.audioManager.playMusic('music-overworld');

    bus.on(EVENTS.BATTLE_END, ({ victory }) => {
      this.audioManager.playMusic('music-overworld');
      if (!victory) {
        this.dialogueManager.show('SYSTEM', D.defeated.system);
      }
    });

    this.dialogueManager.show('RADIO FRAGMENT — STATIC', D.intro.radio);
  }

  update(): void {
    if (pauseMenu.isOpen()) return;
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
      enemyKey:    'compliance_drone',
      returnScene: 'WorldMapScene',
    });
    this.scene.pause();
  }

  /**
   * Renders the node graph as an overlay on the map.
   * Connections are drawn as lines, nodes as coloured circles with labels.
   * Locked nodes render dimmed; visited nodes render with a check ring.
   */
  private _buildNodeLayer(): void {
    const nodes = this.worldMap.getAllNodes();
    const gfx   = this.add.graphics().setDepth(5);

    // Draw connection lines first (below node circles)
    const drawn = new Set<string>();
    for (const node of nodes) {
      for (const connId of node.connections) {
        const key = [node.id, connId].sort().join('|');
        if (drawn.has(key)) continue;
        drawn.add(key);

        const other = this.worldMap.getNode(connId);
        if (!other) continue;

        const unlocked = this.worldMap.isUnlocked(node.id) && this.worldMap.isUnlocked(connId);
        gfx.lineStyle(1, unlocked ? 0x556655 : 0x2a332a, unlocked ? 0.8 : 0.35);
        gfx.lineBetween(node.mapX, node.mapY, other.mapX, other.mapY);
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const unlocked = this.worldMap.isUnlocked(node.id);
      const visited  = this.worldMap.isVisited(node.id);
      const color    = NODE_COLORS[node.type];
      const alpha    = unlocked ? 1 : 0.3;
      const radius   = node.type === 'fast_travel_hub' ? 7 : 5;

      // Outer ring for visited nodes
      if (visited) {
        gfx.lineStyle(1.5, 0xffffff, 0.6);
        gfx.strokeCircle(node.mapX, node.mapY, radius + 3);
      }

      gfx.fillStyle(color, alpha);
      gfx.fillCircle(node.mapX, node.mapY, radius);

      // Label
      this.add.text(node.mapX, node.mapY + radius + 4, node.name, {
        fontFamily: 'monospace',
        fontSize:   '6px',
        color:      unlocked ? '#aabbaa' : '#445544',
      }).setOrigin(0.5, 0).setDepth(6).setAlpha(unlocked ? 1 : 0.5);
    }
  }
}

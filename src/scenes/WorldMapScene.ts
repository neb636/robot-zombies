import Phaser from 'phaser';
import { Player }           from '../entities/Player.js';
import { MobileControls }   from '../utils/MobileControls.js';
import { AudioManager }     from '../audio/AudioManager.js';
import { DialogueManager }  from '../dialogue/DialogueManager.js';
import { TILE_SIZE, EVENTS } from '../utils/constants.js';
import { bus }              from '../utils/EventBus.js';
import type { WasdKeys }    from '../types.js';
import type { SurvivalState, TravelEvent } from '../types.js';
import D from '../data/dialogue/world_map.json';
import { pauseMenu }        from '../ui/PauseMenu.js';
import { WorldMapManager, NODE_COLORS } from '../world/WorldMapManager.js';
import type { WorldNode }   from '../world/WorldMapManager.js';
import nodeData             from '../data/world/nodes.json';
import nodeEntryMap         from '../data/world/nodeEntryMap.json';
import { NodeEntryRouter }  from '../world/NodeEntryRouter.js';
import { SurvivalHUD }      from '../ui/SurvivalHUD.js';
import { TravelOverlay }    from '../ui/TravelOverlay.js';
import type { NodeEntryData } from '../types.js';

// Fast-travel cost constants (per world_map_lore.md)
const FAST_TRAVEL_FUEL  = 2;
const FAST_TRAVEL_FOOD  = 1;

// Normal travel cost (1 day = -4 food, -1 fuel)
const NORMAL_FOOD_COST  = 4;
const NORMAL_FUEL_COST  = 1;

// Minimum touch-target radius (44 px) for mobile
const HIT_RADIUS = 22;

// Stub SurvivalState used when SurvivalManager (Stream A) hasn't emitted yet.
const STUB_STATE: SurvivalState = {
  food: 20, fuel: 12, medicine: 8, ammo: 15,
  scrap: 5, morale: 80, vehicleCondition: 90,
  partySize: 1, region: 'boston', daysElapsed: 0,
};

/**
 * WorldMapScene — overworld traversal on a Tiled tile map.
 * Random encounters trigger when walking on encounter-tagged tiles.
 * Node graph is managed by WorldMapManager and rendered as an overlay.
 */
export class WorldMapScene extends Phaser.Scene {
  cursors!:            Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:               WasdKeys;
  mobileControls!:     MobileControls;
  private player!:          Player;
  private audioManager!:    AudioManager;
  private dialogueManager!: DialogueManager;
  private worldMap!:        WorldMapManager;
  private survivalHUD!:     SurvivalHUD;
  private encounterRate:    number = 0.08;
  private mapWidth:         number = 0;
  private mapHeight:        number = 0;
  private obstacleLayer:    Phaser.Tilemaps.TilemapLayer | null = null;

  /** Node the player is currently at (last visited). */
  private _currentNodeId:   string = 'red_line_tunnels';
  /** True while travel animation / tick is in progress (blocks further clicks). */
  private _travelling:      boolean = false;
  /** Live survival state (updated on SURVIVAL_TICK). */
  private _survivalState:   SurvivalState = { ...STUB_STATE };
  /** Cleanup handlers for bus subscriptions. */
  private _busOff:          Array<() => void> = [];

  // ─── Node-click interactive zones (Phaser zones over each node) ─────────────
  private _nodeZones: Map<string, Phaser.GameObjects.Zone> = new Map();

  // ─── Confirm / fast-travel prompt elements ─────────────────────────────────
  private _prompt:     Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    this._buildTilemap();
    this._buildPlayer();
    this._buildCamera();
    this._setupInput();
    this.mobileControls = new MobileControls();

    this.audioManager    = new AudioManager(this);
    this.dialogueManager = new DialogueManager(this);

    // Load nodeEntryMap into the router
    NodeEntryRouter.setMap(nodeEntryMap as Readonly<Record<string, NodeEntryData>>);

    // Restore visited nodes from registry if available
    const savedVisited = this.registry.get('visitedNodes') as string[] | undefined;
    this.worldMap = new WorldMapManager(nodeData, savedVisited ?? []);
    // Mark Boston prologue nodes as visited since we've already been there
    this.worldMap.markVisited('beacon_hill');
    this.worldMap.markVisited('red_line_tunnels');

    // Restore last-known node from registry
    const savedNode = this.registry.get('currentNodeId') as string | undefined;
    if (savedNode && this.worldMap.getNode(savedNode)) {
      this._currentNodeId = savedNode;
    }

    // Restore survival state if SurvivalManager already set it
    const savedSurvival = this.registry.get('survivalState') as SurvivalState | undefined;
    if (savedSurvival) {
      this._survivalState = { ...savedSurvival };
    }

    this._buildNodeLayer();

    // Survival HUD (top-right panel)
    this.survivalHUD = new SurvivalHUD(this);
    this.survivalHUD.update(this._survivalState);

    // ── Event bus subscriptions ──────────────────────────────────────────────

    this._busOff.push(bus.on(EVENTS.SURVIVAL_TICK, ({ state, event }) => {
      this._survivalState = { ...state };
      this.registry.set('survivalState', this._survivalState);
      this._onSurvivalTick(event);
    }));

    this._busOff.push(bus.on(EVENTS.BATTLE_END, ({ victory }) => {
      this.audioManager.playMusic('music-overworld');
      if (!victory) {
        this.dialogueManager.show('SYSTEM', D.defeated.system);
      }
    }));

    // ── Shutdown cleanup ─────────────────────────────────────────────────────
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
      this.survivalHUD.destroy();
      for (const off of this._busOff) off();
      this._busOff = [];
    });

    this.audioManager.playMusic('music-overworld');
    this.dialogueManager.show('RADIO FRAGMENT — STATIC', D.intro.radio);
  }

  update(): void {
    if (pauseMenu.isOpen()) return;
    this.player.update();
    this._checkEncounter();
  }

  // ─── Travel flow ─────────────────────────────────────────────────────────────

  /**
   * Called when the player clicks / taps a node circle.
   * Validates travel eligibility, then shows a confirmation prompt.
   */
  private _onNodeClick(nodeId: string): void {
    if (this._travelling) return;
    if (this._prompt)     return; // already showing a prompt

    const node = this.worldMap.getNode(nodeId);
    if (!node) return;

    // Cannot travel to current node
    if (nodeId === this._currentNodeId) {
      this._showToast(`You are already at ${node.name}.`);
      return;
    }

    const unlocked  = this.worldMap.isUnlocked(nodeId);
    const connected = this.worldMap.canTravel(this._currentNodeId, nodeId);

    // Is this a fast-travel hub that has been visited?
    const isFastTravelHub = node.type === 'fast_travel_hub' && this.worldMap.isVisited(nodeId);

    if (!connected && !isFastTravelHub) {
      if (!unlocked) {
        this._showToast('Path not yet open — travel there from a connected node first.');
      } else {
        this._showToast('No direct path — travel node by node to reach this location.');
      }
      return;
    }

    // Fast-travel offer (hub visited + current node is also a hub or special case)
    // Per lore: fast travel requires you to be at an unlocked hub.
    const currentNode = this.worldMap.getNode(this._currentNodeId);
    const canFastTravel =
      isFastTravelHub &&
      currentNode?.type === 'fast_travel_hub' &&
      this.worldMap.isVisited(this._currentNodeId) &&
      nodeId !== this._currentNodeId;

    if (canFastTravel) {
      this._showTravelConfirm(node, true);
    } else {
      this._showTravelConfirm(node, false);
    }
  }

  /**
   * Show a confirm / fast-travel dialog over the world map.
   */
  private _showTravelConfirm(node: WorldNode, fastTravel: boolean): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    const panelW = 280;
    const panelH = fastTravel ? 100 : 80;

    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a140a, 0.92)
      .setStrokeStyle(1, 0x44cc44, 0.8);

    const costLine = fastTravel
      ? `Fast travel  −${FAST_TRAVEL_FUEL} fuel  −${FAST_TRAVEL_FOOD} food`
      : `1 day  −${NORMAL_FOOD_COST} food  −${NORMAL_FUEL_COST} fuel`;

    const label = this.add.text(0, -panelH / 2 + 12, `Travel to ${node.name}?`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ccddcc',
    }).setOrigin(0.5, 0);

    const cost = this.add.text(0, -panelH / 2 + 28, costLine, {
      fontFamily: 'monospace', fontSize: '9px', color: '#88aa88',
    }).setOrigin(0.5, 0);

    const confirmBtn = this._makePromptBtn('CONFIRM', 0x226622, () => {
      this._closePrompt();
      void this._doTravel(node.id, fastTravel);
    });
    confirmBtn.setPosition(-50, panelH / 2 - 18);

    const cancelBtn = this._makePromptBtn('CANCEL', 0x442222, () => {
      this._closePrompt();
    });
    cancelBtn.setPosition(50, panelH / 2 - 18);

    const container = this.add.container(cx, cy, [bg, label, cost, confirmBtn, cancelBtn])
      .setDepth(60)
      .setScrollFactor(0);

    this._prompt = container;
  }

  private _makePromptBtn(
    text: string,
    bgColor: number,
    onPress: () => void,
  ): Phaser.GameObjects.Container {
    const btnBg = this.add.rectangle(0, 0, 80, 22, bgColor, 0.9);
    const btnTxt = this.add.text(0, 0, text, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add.zone(0, 0, 80, 22).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onPress);
    // Keyboard fallback is handled by Escape key (cancel) — confirm via click only
    return this.add.container(0, 0, [btnBg, btnTxt, zone]);
  }

  private _closePrompt(): void {
    this._prompt?.destroy();
    this._prompt = null;
  }

  /**
   * Core travel execution: emit event → overlay → tick → route.
   */
  private async _doTravel(toNodeId: string, _fastTravel: boolean): Promise<void> {
    if (this._travelling) return;
    this._travelling = true;

    const fromNode = this.worldMap.getNode(this._currentNodeId);
    const toNode   = this.worldMap.getNode(toNodeId);
    if (!fromNode || !toNode) {
      this._travelling = false;
      return;
    }

    // 1. Emit WORLD_MAP_TRAVEL (SurvivalManager Stream A listens and emits TICK)
    bus.emit(EVENTS.WORLD_MAP_TRAVEL, {
      fromNodeId: this._currentNodeId,
      toNodeId,
      days: 1,
    });

    // 2. Play the 1.5s travel overlay
    const overlay = new TravelOverlay(this);
    await overlay.play(fromNode, toNode);
    overlay.destroy();

    // 3. Wait for SURVIVAL_TICK (with timeout fallback if Stream A not wired yet)
    const tickData = await this._waitForTick();

    // 4. Mark node visited and update current position
    this.worldMap.markVisited(toNodeId);
    this._currentNodeId = toNodeId;
    this.registry.set('currentNodeId', toNodeId);
    this.registry.set('visitedNodes', this.worldMap.getVisitedIds());

    // Rebuild node layer to reflect new visited/unlocked state
    this._rebuildNodeLayer();

    // 5. Ambush or normal entry
    if (tickData?.triggersBattle === true) {
      this._startBattle(tickData.enemyKey ?? 'compliance_drone');
      this._travelling = false;
      return;
    }

    // 6. Route to node scene
    this._travelling = false;
    NodeEntryRouter.launchFromNode(this, toNodeId);
  }

  /**
   * Wait for one SURVIVAL_TICK event. Falls back with a synthetic tick
   * after 800 ms so the map stays playable when Stream A is not yet wired.
   */
  private _waitForTick(): Promise<TravelEvent | null> {
    return new Promise<TravelEvent | null>((resolve) => {
      let settled = false;

      const off = bus.on(EVENTS.SURVIVAL_TICK, ({ state, event }) => {
        if (settled) return;
        settled = true;
        off();
        this._survivalState = { ...state };
        this.survivalHUD.update(this._survivalState);
        resolve(event ?? null);
      });

      // Timeout fallback (SurvivalManager may not be wired yet)
      this.time.delayedCall(800, () => {
        if (settled) return;
        settled = true;
        off();
        resolve(null);
      });
    });
  }

  private _onSurvivalTick(_event: TravelEvent | undefined): void {
    // HUD is already updated via the bus subscription in create().
    // Nothing more needed here during normal (non-travel) ticks.
  }

  // ─── Node layer ──────────────────────────────────────────────────────────────

  private _nodeLayerGroup: Phaser.GameObjects.Group | null = null;

  private _buildNodeLayer(): void {
    this._nodeLayerGroup = this.add.group();
    this._renderNodeLayer();
  }

  private _rebuildNodeLayer(): void {
    // Destroy all existing node-layer objects
    this._nodeLayerGroup?.clear(true, true);
    this._nodeZones.forEach(z => { z.destroy(); });
    this._nodeZones.clear();
    this._renderNodeLayer();
  }

  private _renderNodeLayer(): void {
    const nodes = this.worldMap.getAllNodes();
    const gfx   = this.add.graphics().setDepth(5);
    this._nodeLayerGroup?.add(gfx);

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

    // Draw nodes and add interactive zones
    for (const node of nodes) {
      const unlocked = this.worldMap.isUnlocked(node.id);
      const visited  = this.worldMap.isVisited(node.id);
      const isCurrent = node.id === this._currentNodeId;
      const color    = NODE_COLORS[node.type];
      const alpha    = unlocked ? 1 : 0.3;
      const radius   = node.type === 'fast_travel_hub' ? 7 : 5;

      // Current position indicator
      if (isCurrent) {
        gfx.lineStyle(2, 0xffd700, 0.9);
        gfx.strokeCircle(node.mapX, node.mapY, radius + 5);
      }

      // Outer ring for visited nodes
      if (visited) {
        gfx.lineStyle(1.5, 0xffffff, 0.6);
        gfx.strokeCircle(node.mapX, node.mapY, radius + 3);
      }

      gfx.fillStyle(color, alpha);
      gfx.fillCircle(node.mapX, node.mapY, radius);

      // Label
      const labelTxt = this.add.text(node.mapX, node.mapY + radius + 4, node.name, {
        fontFamily: 'monospace',
        fontSize:   '6px',
        color:      unlocked ? '#aabbaa' : '#445544',
      }).setOrigin(0.5, 0).setDepth(6).setAlpha(unlocked ? 1 : 0.5);
      this._nodeLayerGroup?.add(labelTxt);

      // Interactive zone — minimum 44 px touch target
      const hitR = Math.max(HIT_RADIUS, radius + 4);
      const zone = this.add.zone(node.mapX, node.mapY, hitR * 2, hitR * 2)
        .setDepth(7)
        .setInteractive({ useHandCursor: unlocked });

      zone.on('pointerdown', () => { this._onNodeClick(node.id); });

      this._nodeZones.set(node.id, zone);
      this._nodeLayerGroup?.add(zone);
    }
  }

  // ─── Encounter / battle helpers ──────────────────────────────────────────────

  private _checkEncounter(): void {
    if (!this.player.isMoving) return;
    if (Math.random() < this.encounterRate) {
      this._startBattle('compliance_drone');
    }
  }

  private _startBattle(enemyKey: string): void {
    this.audioManager.stopMusic();
    this.scene.launch('BattleScene', {
      enemyKey,
      returnScene: 'WorldMapScene',
    });
    this.scene.pause();
  }

  // ─── Toast notification ──────────────────────────────────────────────────────

  private _showToast(message: string): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height - 60;

    const bg = this.add
      .rectangle(cx, cy, Math.min(360, width - 40), 32, 0x000000, 0.80)
      .setDepth(70)
      .setScrollFactor(0);

    const txt = this.add
      .text(cx, cy, message, {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#ccddcc',
        align:      'center',
      })
      .setOrigin(0.5)
      .setDepth(71)
      .setScrollFactor(0);

    this.tweens.add({
      targets:  [bg, txt],
      alpha:    { from: 1, to: 0 },
      delay:    1800,
      duration: 400,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }

  // ─── Tilemap / player / camera setup ─────────────────────────────────────────

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
}

import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import type { WasdKeys }   from '../types.js';
import {
  MAP_W, MAP_H,
  PLAYER_START_X, PLAYER_START_Y,
  MARCUS_START_X, MARCUS_START_Y,
  CHECKPOINT_X, CHECKPOINT_Y_TOP, CHECKPOINT_Y_BOT,
  drawNewBoston,
} from './NewBostonRenderer.js';

// ─── Phase keys ──────────────────────────────────────────────────────────────
const PHASE = {
  ARRIVING:    'ARRIVING',
  MEET_MARCUS: 'MEET_MARCUS',
  IN_SCENE:    'IN_SCENE',
  CHECKPOINT:  'CHECKPOINT',
  DONE:        'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

interface CitizenNPC {
  sprite:        Phaser.GameObjects.Rectangle;
  waypoints:     Array<{ x: number; y: number }>;
  waypointIndex: number;
}

/**
 * NewBostonScene — "The New Boston" (2030, Beacon Hill)
 *
 * The player steps outside for the first time in two years.
 * The neighborhood is intact. The people are wrong.
 */
export class NewBostonScene extends Phaser.Scene {
  cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:     WasdKeys;
  player!:   Player;
  dialogMgr!: DialogueManager;

  private _phase:           Phase   = PHASE.ARRIVING;
  private _inputEnabled:    boolean = false;
  private _playerName:      string  = 'YOU';

  // Marcus companion
  private _marcus!:         Phaser.Physics.Arcade.Sprite;
  private _marcusJoined:    boolean = false;
  private _marcusTriggered: boolean = false;

  // Citizens
  private _citizens:        CitizenNPC[] = [];
  private _citizenTimer:    Phaser.Time.TimerEvent | null = null;

  // Tutorial tracking
  private _movedOnce:          boolean = false;
  private _halfMapHintShown:   boolean = false;
  private _citizenHintShown:   boolean = false;
  private _citizenHintTimer:   Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'NewBostonScene' });
  }

  create(): void {
    this._phase        = PHASE.ARRIVING;
    this._inputEnabled = false;
    this._marcusJoined    = false;
    this._marcusTriggered = false;
    this._movedOnce       = false;
    this._halfMapHintShown  = false;
    this._citizenHintShown  = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    drawNewBoston(this);
    this._buildPhysicsBounds();
    this._buildPlayer();
    this._buildMarcus();
    this._buildCitizens();
    this._buildCamera();
    this._buildHUD();
    this._setupInput();

    this.dialogMgr = new DialogueManager(this);

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled) {
      this.player.update();
      this._checkMarcusProximity();
      this._checkTutorialTriggers();
      this._checkCheckpoint();
    }

    if (this._marcusJoined) {
      this._updateMarcusFollow();
    }
  }

  // ─── Physics bounds ───────────────────────────────────────────────────────

  private _buildPhysicsBounds(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  // ─── Marcus NPC ───────────────────────────────────────────────────────────

  private _buildMarcus(): void {
    // Placeholder: warm amber rectangle
    this._marcus = this.physics.add.sprite(MARCUS_START_X, MARCUS_START_Y, '__DEFAULT');
    this._marcus.setVisible(false);

    // Draw his placeholder as a rectangle behind the sprite
    const marcusGfx = this.add.rectangle(MARCUS_START_X, MARCUS_START_Y, 18, 28, 0xddaa44);
    marcusGfx.setDepth(5);

    // Store reference so we can move him in companion mode
    this._marcus.setData('gfx', marcusGfx);
    this._marcus.setCollideWorldBounds(true);
    (this._marcus.body as Phaser.Physics.Arcade.Body).setSize(18, 28);
  }

  private _updateMarcusFollow(): void {
    const gfx = this._marcus.getData('gfx') as Phaser.GameObjects.Rectangle | undefined;

    // Target: slightly behind and to the side of the player
    const targetX = this.player.sprite.x - 36;
    const targetY = this.player.sprite.y + 8;
    const dist = Math.hypot(this._marcus.x - targetX, this._marcus.y - targetY);

    if (dist > 20) {
      const angle = Math.atan2(targetY - this._marcus.y, targetX - this._marcus.x);
      const speed = 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      (this._marcus.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    } else {
      (this._marcus.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Sync the visible rectangle to the physics body
    if (gfx) {
      gfx.setPosition(this._marcus.x, this._marcus.y);
    }
  }

  // ─── Converted Citizens ───────────────────────────────────────────────────

  private _buildCitizens(): void {
    const citizenDefs: Array<{ start: { x: number; y: number }; waypoints: Array<{ x: number; y: number }> }> = [
      {
        start: { x: 500, y: 400 },
        waypoints: [
          { x: 500, y: 400 }, { x: 700, y: 400 },
          { x: 700, y: 600 }, { x: 500, y: 600 },
        ],
      },
      {
        start: { x: 900, y: 350 },
        waypoints: [
          { x: 900, y: 350 }, { x: 1100, y: 350 },
          { x: 1100, y: 550 }, { x: 900, y: 550 },
        ],
      },
      {
        start: { x: 600, y: 700 },
        waypoints: [
          { x: 600, y: 700 }, { x: 800, y: 700 },
          { x: 800, y: 850 }, { x: 600, y: 850 },
        ],
      },
    ];

    this._citizens = citizenDefs.map(def => {
      const sprite = this.add.rectangle(def.start.x, def.start.y, 16, 26, 0xc8c8cc);
      sprite.setDepth(5);
      return {
        sprite,
        waypoints:     def.waypoints,
        waypointIndex: 0,
      };
    });

    // Shared synchronised timer — ALL citizens advance simultaneously
    this._citizenTimer = this.time.addEvent({
      delay:    1600,
      loop:     true,
      callback: this._advanceCitizens,
      callbackScope: this,
    });
  }

  private _advanceCitizens(): void {
    for (const citizen of this._citizens) {
      citizen.waypointIndex = (citizen.waypointIndex + 1) % citizen.waypoints.length;
      const next = citizen.waypoints[citizen.waypointIndex]!;
      this.tweens.add({
        targets:  citizen.sprite,
        x:        next.x,
        y:        next.y,
        duration: 1400,
        ease:     'Linear',
      });
    }
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    const { width } = this.scale;

    // ── Party panel — top-left ──────────────────────────────────────────────
    const panelX = 10;
    const panelY = 10;

    // Panel background
    this.add.rectangle(panelX + 110, panelY + 38, 228, 80, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(20).setOrigin(0.5);

    // Player portrait
    this.add.rectangle(panelX + 4, panelY + 16, 24, 24, 0x4488ff)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);

    // Player name
    this.add.text(panelX + 20, panelY + 8, this._playerName, {
      fontFamily: 'monospace', fontSize: '9px', color: '#88aaff',
    }).setScrollFactor(0).setDepth(21);

    // Player HP bar
    this.add.rectangle(panelX + 110, panelY + 22, 80, 7, 0x333333)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);
    this.add.rectangle(panelX + 71, panelY + 22, 80, 7, 0x44cc44)
      .setScrollFactor(0).setDepth(22).setOrigin(0, 0.5);

    this.add.text(panelX + 158, panelY + 18, '100', {
      fontFamily: 'monospace', fontSize: '8px', color: '#44cc44',
    }).setScrollFactor(0).setDepth(22);

    // Marcus portrait (amber)
    this.add.rectangle(panelX + 4, panelY + 48, 24, 24, 0xddaa44)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);

    // Marcus name
    this.add.text(panelX + 20, panelY + 40, 'MARCUS', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ddaa44',
    }).setScrollFactor(0).setDepth(21);

    // Marcus HP bar
    this.add.rectangle(panelX + 110, panelY + 54, 80, 7, 0x333333)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);
    this.add.rectangle(panelX + 71, panelY + 54, 80, 7, 0x44cc44)
      .setScrollFactor(0).setDepth(22).setOrigin(0, 0.5);

    this.add.text(panelX + 158, panelY + 50, '100', {
      fontFamily: 'monospace', fontSize: '8px', color: '#44cc44',
    }).setScrollFactor(0).setDepth(22);

    // Marcus "no techs" indicator
    this.add.text(panelX + 20, panelY + 65, '⚙ BASIC', {
      fontFamily: 'monospace', fontSize: '8px', color: '#665533',
    }).setScrollFactor(0).setDepth(21);

    // ── Location — top-right ────────────────────────────────────────────────
    this.add.text(width - 10, 10, 'BOSTON, MA  ·  BEACON HILL', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a3a4a',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  private _setupInput(): void {
    // No E-key interactions in this scene — all triggers are proximity-based
  }

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;

    this.dialogMgr.show(this._playerName, [
      'Outside.',
      'Two years.',
      "The street looks exactly the same.",
      "That's the wrong thing to notice first.",
      "You knew that before you finished the thought.",
    ], () => {
      this._phase = PHASE.MEET_MARCUS;
      this._inputEnabled = true;
      this._showHint('Find Marcus', 4000);
    });
  }

  private _checkMarcusProximity(): void {
    if (this._marcusTriggered) return;
    if (this._phase !== PHASE.MEET_MARCUS) return;

    const dist = Math.hypot(
      this.player.sprite.x - MARCUS_START_X,
      this.player.sprite.y - MARCUS_START_Y,
    );
    if (dist > 80) return;

    this._marcusTriggered = true;
    this._inputEnabled    = false;
    this._triggerMarcusDialogue();
  }

  private _triggerMarcusDialogue(): void {
    this.dialogMgr.show('MARCUS', [
      "You look surprised.",
      "Don't be. They started on our block around 4 AM.",
      "Mrs. Halloway from across the street waved at me this morning.",
      "Very normal wave. Very normal smile. Exactly the same as yesterday's wave.",
      "...and the wave before that.",
    ], () => {
      // Brief beat before the punchline
      this.time.delayedCall(600, () => {
        this.dialogMgr.show('MARCUS', [
          "Anyway. You want to hear the good news or the good news?",
          "Good news: the coffee shop on Tremont is still open.",
          "Bad news: the barista made my latte perfectly. No foam. Just how I like it.",
          "First time in six years. Nailed it.",
          "I didn't drink it.",
        ], () => {
          this._marcusJoined    = true;
          this._phase           = PHASE.IN_SCENE;
          this._inputEnabled    = true;
          this._startTutorial();
        });
      });
    });
  }

  // ─── Tutorial ─────────────────────────────────────────────────────────────

  private _startTutorial(): void {
    this._showHint("Marcus: 'Arrow keys or WASD. Stay close.'", 4000);

    // Start the 15-second citizen hint fallback timer
    this._citizenHintTimer = this.time.delayedCall(15000, () => {
      if (!this._citizenHintShown) this._showCitizenHint();
    });
  }

  private _checkTutorialTriggers(): void {
    if (this._phase !== PHASE.IN_SCENE) return;

    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const moving = body.velocity.length() > 5;

    // Step 2: first time player moves
    if (!this._movedOnce && moving) {
      this._movedOnce = true;
      this.time.delayedCall(800, () => {
        this._showHint("Marcus: 'Don't stare. They notice.'", 3000);
      });
    }

    // Step 3: player gets close to a citizen (within 150px)
    if (!this._citizenHintShown) {
      for (const citizen of this._citizens) {
        const dist = Math.hypot(
          this.player.sprite.x - citizen.sprite.x,
          this.player.sprite.y - citizen.sprite.y,
        );
        if (dist < 150) {
          this._showCitizenHint();
          break;
        }
      }
    }

    // Step 4: player crosses the map midpoint
    if (!this._halfMapHintShown && this.player.sprite.x > MAP_W / 2) {
      this._halfMapHintShown = true;
      this._showHint("Marcus: 'Checkpoint's ahead. Harbor side. Should still be clear.'", 4000);
    }
  }

  private _showCitizenHint(): void {
    this._citizenHintShown = true;
    this._citizenHintTimer?.remove();
    this._citizenHintTimer = null;
    this._showHint("Marcus: 'They walk the same route. Every loop. On the dot.'", 4000);
  }

  // ─── Checkpoint trigger ───────────────────────────────────────────────────

  private _checkCheckpoint(): void {
    if (this._phase !== PHASE.IN_SCENE) return;
    const { x, y } = this.player.sprite;
    if (x < CHECKPOINT_X) return;
    if (y < CHECKPOINT_Y_TOP || y > CHECKPOINT_Y_BOT) return;

    this._phase        = PHASE.CHECKPOINT;
    this._inputEnabled = false;

    // Stop citizens
    this._citizenTimer?.remove();
    this._citizenTimer = null;

    this.dialogMgr.show('MARCUS', [
      "Down through here. Subway entrance is about two blocks.",
      "I've got a bad feeling about the checkpoint.",
      "...Well. Worse than usual.",
    ], () => { this._endScene(); });
  }

  private _endScene(): void {
    this._phase = PHASE.DONE;
    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('WorldMapScene');
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 3000): Phaser.GameObjects.Text {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 46, msg, {
      fontFamily: 'monospace', fontSize: '12px', color: '#446688',
    }).setScrollFactor(0).setDepth(25).setOrigin(0.5);

    if (autofade > 0) {
      this.tweens.add({
        targets:  hint,
        alpha:    0,
        delay:    autofade,
        duration: 800,
        onComplete: () => { hint.destroy(); },
      });
    }
    return hint;
  }
}

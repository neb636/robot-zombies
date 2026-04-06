import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import type { Interactable, WasdKeys } from '../../types.js';
import { PV3 }             from './PrologueV3Assets.js';
import D from '../../data/dialogue/prologue.json';
import { pauseMenu } from '../../ui/PauseMenu.js';

// ─── Room layout ────────────────────────────────────────────────────────────
// Compact bedroom: furniture against the back wall (top), floor for movement.
// Matches the asset pack's front-facing room style.

const ROOM_W     = 352;
const ROOM_H     = 272;
const WALL_H     = 80;      // back-wall visual height
const WALL_T     = 10;      // side/bottom wall thickness
const WALL_COLOR = 0x1e2340; // dark navy (bedroom mood)
const TRIM_COLOR = 0x3a2e22; // baseboard

// Door zone on the right wall — leads to living room
const DOOR_Y     = 140;
const DOOR_H     = 56;

// ─── Phases ─────────────────────────────────────────────────────────────────
const PHASE = {
  WAKE_UP:   'WAKE_UP',
  EXPLORING: 'EXPLORING',
  DONE:      'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * PrologueBedroomScene — "Before the Fall" part 1.
 * Player wakes up, explores the bedroom, then walks through the door
 * to the living room (PrologueLivingRoomScene).
 */
export class PrologueBedroomScene extends Phaser.Scene {
  cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:     WasdKeys;
  player!:   Player;

  private _phase:         Phase   = PHASE.WAKE_UP;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';
  private _wallBodies:    Phaser.GameObjects.Zone[] = [];
  private _interactables: Interactable[] = [];
  private _nearInteract:  Interactable | null = null;
  private _promptText!:   Phaser.GameObjects.Text;
  dialogMgr!:             DialogueManager;
  mobileControls!:        MobileControls;

  private _interactTapHandler!: () => void;

  constructor() { super({ key: 'PrologueBedroomScene' }); }

  create(): void {
    this._phase        = PHASE.WAKE_UP;
    this._inputEnabled = false;
    this._playerName   = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawRoom();
    this._buildWalls();
    this._buildInteractables();
    this._buildPlayer();
    this._buildCamera();
    this._buildHUD();
    this._setupInput();

    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      document.removeEventListener('interact:tap', this._interactTapHandler);
      this.mobileControls.destroy();
    });

    this.dialogMgr = new DialogueManager(this);

    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.time.delayedCall(1000, () => { this._startWakeUp(); });
  }

  update(): void {
    if (!this._inputEnabled) return;
    if (pauseMenu.isOpen()) return;
    this.player.update();
    this._checkInteractProximity();
    if (this._phase === PHASE.EXPLORING) this._checkDoor();
  }

  // ─── Room drawing ─────────────────────────────────────────────────────────

  private _drawRoom(): void {
    // Floor
    this.add.tileSprite(
      ROOM_W / 2, WALL_H + (ROOM_H - WALL_H) / 2,
      ROOM_W, ROOM_H - WALL_H,
      PV3.FLOOR_WOOD,
    ).setDepth(0);

    const g = this.add.graphics().setDepth(1);

    // Back wall
    g.fillStyle(WALL_COLOR);
    g.fillRect(0, 0, ROOM_W, WALL_H);

    // Side walls
    g.fillStyle(0x161a2e);
    g.fillRect(0, WALL_H, WALL_T, ROOM_H - WALL_H);                      // left
    g.fillRect(ROOM_W - WALL_T, WALL_H, WALL_T, DOOR_Y - WALL_H);        // right above door
    g.fillRect(ROOM_W - WALL_T, DOOR_Y + DOOR_H, WALL_T, ROOM_H - DOOR_Y - DOOR_H); // right below door
    g.fillRect(0, ROOM_H - WALL_T, ROOM_W, WALL_T);                       // bottom

    // Baseboard trim
    g.lineStyle(2, TRIM_COLOR, 0.7);
    g.beginPath();
    g.moveTo(0, WALL_H);
    g.lineTo(ROOM_W, WALL_H);
    g.strokePath();

    // Door frame on right wall
    g.lineStyle(3, 0x5a4030, 1);
    g.beginPath();
    g.moveTo(ROOM_W - WALL_T, DOOR_Y);
    g.lineTo(ROOM_W, DOOR_Y);
    g.moveTo(ROOM_W - WALL_T, DOOR_Y + DOOR_H);
    g.lineTo(ROOM_W, DOOR_Y + DOOR_H);
    g.strokePath();

    // Door opening (dark to suggest hallway)
    g.fillStyle(0x0a0a12);
    g.fillRect(ROOM_W - WALL_T, DOOR_Y, WALL_T, DOOR_H);

    // ── Furniture — back wall (front-facing style) ──────────────────────

    // Wardrobe — far left against back wall
    this.add.image(40, WALL_H - 16, PV3.WARDROBE)
      .setDepth(2).setOrigin(0.5, 1);

    // Window — center of back wall
    this.add.image(130, 20, PV3.WINDOW)
      .setDepth(2);

    // Poster — between window and bed
    this.add.image(200, 28, PV3.SMALL_FRAMES)
      .setDepth(2);

    // Bed — right side against back wall (64x64 sprite)
    this.add.image(280, WALL_H - 2, PV3.BED)
      .setDepth(3).setOrigin(0.5, 1);

    // Nightstand next to bed (left side)
    this.add.image(234, WALL_H - 2, PV3.NIGHTSTAND)
      .setDepth(3).setOrigin(0.5, 1);

    // Lamp on nightstand
    this.add.image(234, WALL_H - 24, PV3.LAMP)
      .setDepth(4).setOrigin(0.5, 1);

    // ── Furniture — floor area ──────────────────────────────────────────

    // Rug — center of floor
    this.add.image(ROOM_W / 2, 180, PV3.RUG_BLUE)
      .setDepth(1).setAlpha(0.85);

    // Desk + monitor — left side
    this.add.image(70, 150, PV3.DESK)
      .setDepth(3).setOrigin(0.5, 1);
    this.add.image(70, 118, PV3.MONITOR)
      .setDepth(4).setOrigin(0.5, 1);
    this.add.image(90, 152, PV3.DESK_CHAIR)
      .setDepth(2).setOrigin(0.5, 1);

    // Bookshelf — bottom-left corner
    this.add.image(24, 220, PV3.BOOKSHELF)
      .setDepth(3).setOrigin(0.5, 1).setScale(1.5);

    // Dresser — bottom area near door
    this.add.image(240, 240, PV3.DRESSER)
      .setDepth(3).setOrigin(0.5, 1);

    // Small plant on dresser
    this.add.image(256, 206, PV3.PLANT)
      .setDepth(4).setOrigin(0.5, 1);

    // ── Door arrow hint ─────────────────────────────────────────────────
    this.add.text(ROOM_W - 6, DOOR_Y + DOOR_H / 2, '→', {
      fontFamily: 'monospace', fontSize: '14px', color: '#556688',
    }).setDepth(5).setOrigin(0.5).setAlpha(0.5);
  }

  // ─── Physics walls ────────────────────────────────────────────────────────

  private _buildWalls(): void {
    this._wallBodies = [];
    const add = (cx: number, cy: number, w: number, h: number): void => {
      const z = this.add.zone(cx, cy, w, h);
      this.physics.world.enable(z, Phaser.Physics.Arcade.STATIC_BODY);
      this._wallBodies.push(z);
    };

    // Back wall
    add(ROOM_W / 2, WALL_H / 2, ROOM_W, WALL_H);
    // Left wall
    add(WALL_T / 2, WALL_H + (ROOM_H - WALL_H) / 2, WALL_T, ROOM_H - WALL_H);
    // Bottom wall
    add(ROOM_W / 2, ROOM_H - WALL_T / 2, ROOM_W, WALL_T);
    // Right wall above door
    add(ROOM_W - WALL_T / 2, (WALL_H + DOOR_Y) / 2, WALL_T, DOOR_Y - WALL_H);
    // Right wall below door
    const belowH = ROOM_H - WALL_T - (DOOR_Y + DOOR_H);
    add(ROOM_W - WALL_T / 2, DOOR_Y + DOOR_H + belowH / 2, WALL_T, belowH);

    // Furniture collision — bed area
    add(280, WALL_H + 10, 60, 20);
    // Desk area
    add(70, 132, 48, 20);
  }

  // ─── Interactables ────────────────────────────────────────────────────────

  private _buildInteractables(): void {
    const n = this._playerName;
    this._interactables = [
      {
        id: 'bed', x: 280, y: WALL_H + 16, range: 50, label: 'Bed',
        interact: () => { this.dialogMgr.show(n, D.interactable.bed); },
      },
      {
        id: 'alarm', x: 234, y: WALL_H + 4, range: 44, label: 'Alarm Clock',
        interact: () => { this.dialogMgr.show('ALARM CLOCK', D.interactable.alarm_clock); },
      },
      {
        id: 'computer', x: 70, y: 140, range: 50, label: 'Computer',
        interact: () => { this.dialogMgr.show('BROWSER', D.interactable.computer); },
      },
      {
        id: 'bookshelf', x: 24, y: 210, range: 50, label: 'Bookshelf',
        interact: () => { this.dialogMgr.show(n, D.interactable.bookshelf); },
      },
      {
        id: 'poster', x: 200, y: WALL_H - 10, range: 46, label: 'Poster',
        interact: () => { this.dialogMgr.show(n, D.interactable.poster); },
      },
    ];

    this._promptText = this.add.text(0, 0, '', {
      fontFamily:      'monospace',
      fontSize:        '11px',
      color:           '#88ccff',
      backgroundColor: '#00001acc',
      padding: { x: 6, y: 3 },
    }).setDepth(15).setVisible(false);
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, 200, 190);
    this.player.name = this._playerName;

    this.physics.world.setBounds(WALL_T, WALL_H, ROOM_W - WALL_T * 2, ROOM_H - WALL_H - WALL_T);

    if (this._wallBodies.length) {
      this.physics.add.collider(this.player.sprite, this._wallBodies);
    }
  }

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    this.add.text(10, 10, 'BOSTON, MA  ·  JUNE 12, 2028', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#2a3a4a',
    }).setScrollFactor(0).setDepth(20);
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  private _setupInput(): void {
    this.input.keyboard!.on('keydown-E', () => {
      if (!this._inputEnabled || pauseMenu.isOpen() || this.dialogMgr?.isActive()) return;
      if (this._nearInteract) this._nearInteract.interact();
    });

    this._interactTapHandler = () => {
      if (!this._inputEnabled || pauseMenu.isOpen() || this.dialogMgr?.isActive()) return;
      if (this._nearInteract) this._nearInteract.interact();
    };
    document.addEventListener('interact:tap', this._interactTapHandler);
  }

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startWakeUp(): void {
    const n = this._playerName;
    this.dialogMgr.show('ALARM', D.wake_up.alarm, () => {
      this.dialogMgr.show(n, D.wake_up.player, () => {
        this._phase = PHASE.EXPLORING;
        this._inputEnabled = true;
        this._showHint('Arrow keys / WASD to move  ·  E / tap to interact', 3800);
      });
    });
  }

  // ─── Door check — transition to living room ──────────────────────────────

  private _checkDoor(): void {
    const { x, y } = this.player.sprite;
    if (x > ROOM_W - 30 && y > DOOR_Y && y < DOOR_Y + DOOR_H) {
      this._phase = PHASE.DONE;
      this._inputEnabled = false;

      this.cameras.main.fadeOut(500, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('PrologueLivingRoomScene');
      });
    }
  }

  // ─── Interaction proximity ────────────────────────────────────────────────

  private _checkInteractProximity(): void {
    if (this.dialogMgr.isActive()) {
      this._promptText.setVisible(false);
      this._nearInteract = null;
      return;
    }

    const { x: px, y: py } = this.player.sprite;
    let closest:     Interactable | null = null;
    let closestDist = Infinity;

    for (const item of this._interactables) {
      if (item.available === false) continue;
      const d = Math.hypot(px - item.x, py - item.y);
      if (d < item.range && d < closestDist) {
        closest     = item;
        closestDist = d;
      }
    }

    this._nearInteract = closest;
    if (closest) {
      this._promptText
        .setText(`[ E ]  ${closest.label}`)
        .setPosition(px, py - 44)
        .setVisible(true);
      this.mobileControls.showInteract(closest.label);
    } else {
      this._promptText.setVisible(false);
      this.mobileControls.hideInteract();
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 3000): Phaser.GameObjects.Text {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 46, msg, {
      fontFamily: 'monospace', fontSize: '12px', color: '#446688',
    }).setScrollFactor(0).setDepth(25).setOrigin(0.5);

    if (autofade > 0) {
      this.tweens.add({
        targets: hint, alpha: 0, delay: autofade, duration: 800,
        onComplete: () => { hint.destroy(); },
      });
    }
    return hint;
  }
}

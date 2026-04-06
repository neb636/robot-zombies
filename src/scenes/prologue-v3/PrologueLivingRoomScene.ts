import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import type { Interactable, WasdKeys } from '../../types.js';
import { PV3 }             from './PrologueV3Assets.js';
import D from '../../data/dialogue/prologue.json';
import { pauseMenu } from '../../ui/PauseMenu.js';

// ─── Room layout ────────────────────────────────────────────────────────────
const ROOM_W     = 416;
const ROOM_H     = 288;
const WALL_H     = 80;
const WALL_T     = 10;
const WALL_COLOR = 0x2a2420; // warm brown for living room

// Door to bedroom — left wall
const BDOOR_Y    = 140;
const BDOOR_H    = 56;

// Front door — right wall
const FDOOR_Y    = 150;
const FDOOR_H    = 56;

// TV position (for overlay effects)
const TV_X       = ROOM_W / 2;
const TV_Y       = 44;

// ─── Phases ─────────────────────────────────────────────────────────────────
const PHASE = {
  ENTER:     'ENTER',
  EXPLORING: 'EXPLORING',
  NEWSCAST:  'NEWSCAST',
  MARCUS:    'MARCUS',
  OUTRO:     'OUTRO',
  DONE:      'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * PrologueLivingRoomScene — "Before the Fall" part 2.
 * Player enters from bedroom, watches the newscast, gets Marcus's call,
 * then exits through the front door.
 */
export class PrologueLivingRoomScene extends Phaser.Scene {
  cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:     WasdKeys;
  player!:   Player;

  private _phase:         Phase   = PHASE.ENTER;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';
  private _wallBodies:    Phaser.GameObjects.Zone[] = [];
  private _interactables: Interactable[] = [];
  private _nearInteract:  Interactable | null = null;
  private _promptText!:   Phaser.GameObjects.Text;
  private _tvLabel?:      Phaser.GameObjects.Text;
  private _tvBroadcastBar?: Phaser.GameObjects.Rectangle;
  private _outroHintObj?: Phaser.GameObjects.Text;
  dialogMgr!:             DialogueManager;
  mobileControls!:        MobileControls;

  private _interactTapHandler!: () => void;

  constructor() { super({ key: 'PrologueLivingRoomScene' }); }

  create(): void {
    this._phase        = PHASE.ENTER;
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

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => { this._enterLivingRoom(); });
  }

  update(): void {
    if (!this._inputEnabled) return;
    if (pauseMenu.isOpen()) return;
    this.player.update();
    this._checkInteractProximity();
    if (this._phase === PHASE.OUTRO) this._checkFrontDoor();
  }

  // ─── Room drawing ─────────────────────────────────────────────────────────

  private _drawRoom(): void {
    // Floor
    this.add.tileSprite(
      ROOM_W / 2, WALL_H + (ROOM_H - WALL_H) / 2,
      ROOM_W, ROOM_H - WALL_H,
      PV3.FLOOR_LIGHT,
    ).setDepth(0);

    const g = this.add.graphics().setDepth(1);

    // Back wall
    g.fillStyle(WALL_COLOR);
    g.fillRect(0, 0, ROOM_W, WALL_H);

    // Side walls
    const sideColor = 0x221e1a;
    g.fillStyle(sideColor);
    // Left wall (with bedroom door gap)
    g.fillRect(0, WALL_H, WALL_T, BDOOR_Y - WALL_H);
    g.fillRect(0, BDOOR_Y + BDOOR_H, WALL_T, ROOM_H - BDOOR_Y - BDOOR_H);
    // Right wall (with front door gap)
    g.fillRect(ROOM_W - WALL_T, WALL_H, WALL_T, FDOOR_Y - WALL_H);
    g.fillRect(ROOM_W - WALL_T, FDOOR_Y + FDOOR_H, WALL_T, ROOM_H - FDOOR_Y - FDOOR_H);
    // Bottom wall
    g.fillRect(0, ROOM_H - WALL_T, ROOM_W, WALL_T);

    // Baseboard trim
    g.lineStyle(2, 0x4a3828, 0.7);
    g.beginPath();
    g.moveTo(0, WALL_H);
    g.lineTo(ROOM_W, WALL_H);
    g.strokePath();

    // Bedroom door frame (left wall)
    g.lineStyle(3, 0x5a4030, 1);
    g.beginPath();
    g.moveTo(0, BDOOR_Y);
    g.lineTo(WALL_T, BDOOR_Y);
    g.moveTo(0, BDOOR_Y + BDOOR_H);
    g.lineTo(WALL_T, BDOOR_Y + BDOOR_H);
    g.strokePath();
    g.fillStyle(0x0a0a12);
    g.fillRect(0, BDOOR_Y, WALL_T, BDOOR_H);

    // Front door (right wall) — closed wooden door
    this.add.image(ROOM_W - 5, FDOOR_Y + FDOOR_H / 2, PV3.DOOR_WOOD)
      .setDepth(2).setOrigin(0.5, 0.5);

    // Door handle
    g.fillStyle(0xd4aa20);
    g.fillRect(ROOM_W - 16, FDOOR_Y + FDOOR_H / 2 - 2, 5, 5);

    // ── Back wall furniture ─────────────────────────────────────────────

    // Wall frames — left side of back wall
    this.add.image(80, 26, PV3.WALL_FRAMES).setDepth(2);

    // TV — center of back wall (drawn with graphics for screen effects)
    g.fillStyle(0x111111);
    g.fillRect(TV_X - 52, TV_Y - 14, 104, 48);  // TV frame
    g.fillStyle(0x0c0c0c);
    g.fillRect(TV_X - 48, TV_Y - 10, 96, 40);   // inner bezel
    g.fillStyle(0x050508);
    g.fillRect(TV_X - 44, TV_Y - 6, 88, 32);    // screen
    // Stand
    g.fillStyle(0x2a2a2a);
    g.fillRect(TV_X - 14, TV_Y + 34, 28, 5);
    g.fillRect(TV_X - 20, TV_Y + 39, 40, 3);
    // Power LED
    g.fillStyle(0x00cc44);
    g.fillRect(TV_X - 2, TV_Y + 28, 4, 3);

    // TV stand/cabinet below TV
    this.add.image(TV_X, WALL_H - 2, PV3.TV_STAND)
      .setDepth(2).setOrigin(0.5, 1);

    // Wall frames — right side
    this.add.image(ROOM_W - 80, 26, PV3.SMALL_FRAMES).setDepth(2);

    // Window — far right of back wall
    this.add.image(ROOM_W - 40, 20, PV3.WINDOW_LIGHT)
      .setDepth(2).setScale(0.8);

    // ── Floor furniture ─────────────────────────────────────────────────

    // Rug — center
    this.add.image(ROOM_W / 2, 190, PV3.RUG_GREEN)
      .setDepth(1).setAlpha(0.85);

    // Couch — center, facing TV
    this.add.image(ROOM_W / 2, 170, PV3.COUCH)
      .setDepth(3).setOrigin(0.5, 0.5).setScale(1.8);

    // Coffee table — between TV and couch
    this.add.image(ROOM_W / 2, 130, PV3.COFFEE_TABLE)
      .setDepth(3).setOrigin(0.5, 0.5).setScale(1.3);

    // Armchair — right side
    this.add.image(320, 180, PV3.ARMCHAIR)
      .setDepth(3).setOrigin(0.5, 0.5);

    // Floor lamp — far left
    this.add.image(50, 170, PV3.FLOOR_LAMP)
      .setDepth(3).setOrigin(0.5, 1);

    // Plant — bottom right corner
    this.add.image(ROOM_W - 40, 240, PV3.PLANT_TALL)
      .setDepth(3).setOrigin(0.5, 1).setScale(1.3);

    // Cabinet — left side
    this.add.image(80, WALL_H + 6, PV3.CABINET)
      .setDepth(3).setOrigin(0.5, 0);

    // ── Hints ───────────────────────────────────────────────────────────

    // Left door arrow (back to bedroom)
    this.add.text(4, BDOOR_Y + BDOOR_H / 2, '←', {
      fontFamily: 'monospace', fontSize: '14px', color: '#556688',
    }).setDepth(5).setOrigin(0.5).setAlpha(0.4);
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
    // Bottom wall
    add(ROOM_W / 2, ROOM_H - WALL_T / 2, ROOM_W, WALL_T);
    // Left wall above bedroom door
    add(WALL_T / 2, (WALL_H + BDOOR_Y) / 2, WALL_T, BDOOR_Y - WALL_H);
    // Left wall below bedroom door
    const lBelowH = ROOM_H - WALL_T - (BDOOR_Y + BDOOR_H);
    add(WALL_T / 2, BDOOR_Y + BDOOR_H + lBelowH / 2, WALL_T, lBelowH);
    // Right wall above front door
    add(ROOM_W - WALL_T / 2, (WALL_H + FDOOR_Y) / 2, WALL_T, FDOOR_Y - WALL_H);
    // Right wall below front door
    const rBelowH = ROOM_H - WALL_T - (FDOOR_Y + FDOOR_H);
    add(ROOM_W - WALL_T / 2, FDOOR_Y + FDOOR_H + rBelowH / 2, WALL_T, rBelowH);

    // Couch collision
    add(ROOM_W / 2, 170, 80, 24);
    // Coffee table collision
    add(ROOM_W / 2, 130, 40, 16);
  }

  // ─── Interactables ────────────────────────────────────────────────────────

  private _buildInteractables(): void {
    this._interactables = [
      {
        id: 'couch', x: ROOM_W / 2, y: 175, range: 55, label: 'Couch',
        available: true,
        used: false,
        interact: () => { this._triggerNewscast(); },
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
    // Spawn near the left door (coming from bedroom)
    this.player  = new Player(this, 30, BDOOR_Y + BDOOR_H / 2);
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

  private _enterLivingRoom(): void {
    this.dialogMgr.show(this._playerName, D.living_trigger.player, () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
      this._showHint('[ E ]  Sit on the couch', 4000);
    });
  }

  private _triggerNewscast(): void {
    const couch = this._interactables.find(i => i.id === 'couch');
    if (!couch || couch.used) return;
    couch.used = true;

    this._phase        = PHASE.NEWSCAST;
    this._inputEnabled = false;
    this._tvScreenFlash();
  }

  private _tvScreenFlash(): void {
    const flash = this.add.rectangle(TV_X, TV_Y + 6, 88, 32, 0x003399)
      .setDepth(8).setAlpha(0);

    this.tweens.add({
      targets:  flash,
      alpha:    0.9,
      duration: 120,
      yoyo:     true,
      repeat:   3,
      onComplete: () => {
        flash.setFillStyle(0x000822).setAlpha(1);
        this._addTVOverlay();
        this.time.delayedCall(300, () => { this._playNewscast(); });
      },
    });
  }

  private _addTVOverlay(): void {
    this._tvLabel = this.add.text(TV_X, TV_Y, 'SUPERINTELLIGENCE INC — LIVE', {
      fontFamily: 'monospace', fontSize: '5px', color: '#3366cc',
    }).setOrigin(0.5).setDepth(9);

    this._tvBroadcastBar = this.add.rectangle(TV_X, TV_Y + 24, 88, 5, 0x003366)
      .setDepth(9).setAlpha(0.6);
  }

  private _playNewscast(): void {
    this.dialogMgr.show(
      '📺  SUPERINTELLIGENCE INC — LIVE BROADCAST',
      D.newscast.broadcast,
      () => { this._newscastEnd(); },
    );
  }

  private _newscastEnd(): void {
    if (this._tvLabel) this._tvLabel.setText('— SIGNAL LOST —').setColor('#444444');
    if (this._tvBroadcastBar) this._tvBroadcastBar.setFillStyle(0x111111);

    this.time.delayedCall(700, () => {
      this.dialogMgr.show(this._playerName, D.newscast_end.player, () => {
        this._phase = PHASE.MARCUS;
        this.time.delayedCall(600, () => { this._triggerMarcusCall(); });
      });
    });
  }

  private _triggerMarcusCall(): void {
    const { width, height } = this.scale;
    const buzz = this.add.text(
      width / 2, height / 2 - 80,
      '📱  INCOMING CALL — MARCUS', {
        fontFamily:      'monospace',
        fontSize:        '14px',
        color:           '#44dd88',
        backgroundColor: '#001100ee',
        padding: { x: 10, y: 6 },
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets: buzz,
      alpha:   1,
      duration: 200,
      onComplete: () => {
        this.tweens.add({
          targets:  buzz,
          x:        buzz.x + 5,
          yoyo:     true,
          duration: 60,
          repeat:   6,
          onComplete: () => {
            this.time.delayedCall(600, () => {
              buzz.destroy();
              this.dialogMgr.show('MARCUS  [ PHONE ]', D.marcus_call.phone, () => {
                this._phase = PHASE.OUTRO;
                this._inputEnabled = true;
                this._showOutroHint();
              });
            });
          },
        });
      },
    });
  }

  private _showOutroHint(): void {
    const hint = this._showHint('Get to the front door →', 0);
    if (hint) {
      this.tweens.add({ targets: hint, alpha: 0.4, yoyo: true, duration: 900, repeat: -1 });
      this._outroHintObj = hint;
    }
  }

  private _checkFrontDoor(): void {
    const { x, y } = this.player.sprite;
    if (x > ROOM_W - 30 && y > FDOOR_Y - 10 && y < FDOOR_Y + FDOOR_H + 10) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;
      this._outroHintObj?.destroy();
      this._endPrologue();
    }
  }

  private _endPrologue(): void {
    this.dialogMgr.show(this._playerName, D.end.player, () => {
      this.cameras.main.fade(1200, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) this._showTimeskip();
      });
    });
  }

  private _showTimeskip(): void {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x000000)
      .setScrollFactor(0).setDepth(50);

    const t1 = this.add.text(cx, cy - 24, 'TWO YEARS LATER', {
      fontFamily: 'monospace', fontSize: '28px', color: '#7aaeff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);

    const t2 = this.add.text(cx, cy + 20, 'Boston, Massachusetts  —  2030', {
      fontFamily: 'monospace', fontSize: '14px', color: '#446688',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);

    this.tweens.add({ targets: t1, alpha: 1, duration: 700, delay: 1000 });
    this.tweens.add({
      targets: t2, alpha: 1, duration: 700, delay: 1400,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.cameras.main.fadeOut(900, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
            if (p === 1) this.scene.start('NewBostonScene');
          });
        });
      },
    });
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

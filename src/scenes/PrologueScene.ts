import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { MobileControls }  from '../utils/MobileControls.js';
import type { Interactable, WasdKeys } from '../types.js';
import {
  MAP_W, MAP_H, WALL_T, TOP_WALL_H, DIVIDER_X,
  DOOR_TOP, DOOR_BOT, FDOOR_TOP, FDOOR_BOT,
  drawPrologueRoom,
} from './PrologueRoomRenderer.js';
import D from '../data/dialogue/prologue.json';
import { pauseMenu } from '../ui/PauseMenu.js';

// ─── Phase keys ──────────────────────────────────────────────────────────────
const PHASE = {
  WAKE_UP:   'WAKE_UP',
  EXPLORING: 'EXPLORING',
  NEWSCAST:  'NEWSCAST',
  MARCUS:    'MARCUS',
  OUTRO:     'OUTRO',
  DONE:      'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * PrologueScene — "Before the Fall" (June 2028, Boston MA)
 */
export class PrologueScene extends Phaser.Scene {
  cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:     WasdKeys;
  player!:   Player;

  private _phase:          Phase   = PHASE.WAKE_UP;
  private _inputEnabled:   boolean = false;
  private _enteredLiving:  boolean = false;
  private _playerName:     string  = 'YOU';
  private _wallBodies:     Phaser.GameObjects.Zone[] = [];
  private _interactables:  Interactable[] = [];
  private _nearInteract:   Interactable | null = null;
  private _promptText!:    Phaser.GameObjects.Text;
  private _tvLabel?:       Phaser.GameObjects.Text;
  private _tvBroadcastBar?: Phaser.GameObjects.Rectangle;
  private _outroHintObj?:  Phaser.GameObjects.Text;
  dialogMgr!:              DialogueManager;
  mobileControls!:         MobileControls;

  private _interactTapHandler!: () => void;

  constructor() {
    super({ key: 'PrologueScene' });
  }

  create(): void {
    this._phase         = PHASE.WAKE_UP;
    this._inputEnabled  = false;
    this._enteredLiving = false;
    this._playerName    = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    drawPrologueRoom(this);
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
    this._checkLivingTrigger();
    this._checkInteractProximity();
    if (this._phase === PHASE.OUTRO) this._checkFrontDoor();
  }

  // ─── Physics Walls ────────────────────────────────────────────────────────

  private _buildWalls(): void {
    this._wallBodies = [];

    const addWall = (cx: number, cy: number, w: number, h: number): void => {
      const zone = this.add.zone(cx, cy, w, h);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      this._wallBodies.push(zone);
    };

    addWall(MAP_W / 2, TOP_WALL_H / 2,     MAP_W,  TOP_WALL_H);
    addWall(MAP_W / 2, MAP_H - WALL_T / 2, MAP_W,  WALL_T);
    addWall(WALL_T / 2, MAP_H / 2,         WALL_T, MAP_H);

    const rTop = FDOOR_TOP / 2;
    addWall(MAP_W - WALL_T / 2, rTop, WALL_T, FDOOR_TOP);
    const rBotH = MAP_H - FDOOR_BOT;
    addWall(MAP_W - WALL_T / 2, FDOOR_BOT + rBotH / 2, WALL_T, rBotH);

    addWall(DIVIDER_X, DOOR_TOP / 2,           WALL_T, DOOR_TOP);
    const dBotH = MAP_H - DOOR_BOT;
    addWall(DIVIDER_X, DOOR_BOT + dBotH / 2,  WALL_T, dBotH);
  }

  // ─── Interactables ────────────────────────────────────────────────────────

  private _buildInteractables(): void {
    const n = this._playerName;

    this._interactables = [
      {
        id: 'bed', x: 88, y: 128, range: 70, label: 'Bed',
        interact: () => { this.dialogMgr.show(n, D.interactable.bed); },
      },
      {
        id: 'alarm', x: 240, y: 96, range: 54, label: 'Alarm Clock',
        interact: () => { this.dialogMgr.show('ALARM CLOCK', D.interactable.alarm_clock); },
      },
      {
        id: 'computer', x: 260, y: 220, range: 60, label: 'Computer',
        interact: () => { this.dialogMgr.show('BROWSER', D.interactable.computer); },
      },
      {
        id: 'bookshelf', x: 48, y: 300, range: 60, label: 'Bookshelf',
        interact: () => { this.dialogMgr.show(n, D.interactable.bookshelf); },
      },
      {
        id: 'poster', x: 240, y: 56, range: 56, label: 'Poster',
        interact: () => { this.dialogMgr.show(n, D.interactable.poster); },
      },
      {
        id: 'couch', x: 472, y: 300, range: 70, label: 'Couch',
        available: false,
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
    this.player  = new Player(this, 200, 370);
    this.player.name = this._playerName;
    this.physics.world.setBounds(WALL_T, TOP_WALL_H, MAP_W - WALL_T * 2, MAP_H - TOP_WALL_H - WALL_T);

    if (this._wallBodies.length) {
      this.physics.add.collider(this.player.sprite, this._wallBodies);
    }
  }

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
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
      if (!this._inputEnabled)          return;
      if (pauseMenu.isOpen())           return;
      if (this.dialogMgr?.isActive())   return;
      if (this._nearInteract) {
        this._nearInteract.interact();
      }
    });

    this._interactTapHandler = () => {
      if (!this._inputEnabled)          return;
      if (pauseMenu.isOpen())           return;
      if (this.dialogMgr?.isActive())   return;
      if (this._nearInteract) {
        this._nearInteract.interact();
      }
    };
    document.addEventListener('interact:tap', this._interactTapHandler);
  }

  // ─── Story Flow ───────────────────────────────────────────────────────────

  private _startWakeUp(): void {
    const n = this._playerName;
    this.dialogMgr.show('ALARM', D.wake_up.alarm, () => {
      this.dialogMgr.show(n, D.wake_up.player, () => {
        this._phase = PHASE.EXPLORING;
        this._inputEnabled = true;
        this._showHint('Arrow keys / WASD to move  ·  [ E ] to interact', 3800);
      });
    });
  }

  private _checkLivingTrigger(): void {
    if (this._enteredLiving) return;
    if (this._phase !== PHASE.EXPLORING) return;
    if (this.player.sprite.x <= DIVIDER_X + 15) return;

    this._enteredLiving = true;
    this._inputEnabled  = false;

    const couch = this._interactables.find(i => i.id === 'couch');
    if (couch) couch.available = true;

    this.dialogMgr.show(this._playerName, D.living_trigger.player, () => {
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
    const flash = this.add.rectangle(480, 92, 40, 28, 0x003399).setDepth(8).setAlpha(0);

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
    this._tvLabel = this.add.text(480, 60, 'SI INC — LIVE', {
      fontFamily: 'monospace', fontSize: '5px', color: '#3366cc',
    }).setOrigin(0.5).setDepth(9);

    this._tvBroadcastBar = this.add.rectangle(480, 116, 44, 4, 0x003366).setDepth(9).setAlpha(0.6);
  }

  private _playNewscast(): void {
    this.dialogMgr.show('📺  SUPERINTELLIGENCE INC — LIVE BROADCAST', D.newscast.broadcast, () => { this._newscastEnd(); });
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
      targets:  buzz,
      alpha:    1,
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
    if (x > MAP_W - 60 && y > FDOOR_TOP - 10 && y < FDOOR_BOT + 10) {
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

  // ─── Interaction Proximity ────────────────────────────────────────────────

  private _checkInteractProximity(): void {
    if (this.dialogMgr.isActive()) {
      this._promptText.setVisible(false);
      this._nearInteract = null;
      return;
    }

    const { x: px, y: py } = this.player.sprite;
    let closest:     Interactable | null = null;
    let closestDist: number = Infinity;

    for (const item of this._interactables) {
      if (item.available === false) continue;

      const d = Math.hypot(px - item.x, py - item.y);
      if (d < (item.range) && d < closestDist) {
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

  /**
   * Show a transient hint text at the bottom of the screen.
   * autofade=0 means the text is returned and caller manages lifetime.
   */
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

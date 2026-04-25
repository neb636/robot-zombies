/**
 * ValleyApproachScene — Chapter 5, scene 1.
 *
 * Silicon Valley is pristine. No ruins. The horror is how beautiful it looks.
 * Robots ignore the party unless provoked. Observe-only travel option available.
 * Leads to CampusPerimeterScene on exit.
 */
import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import D from '../../data/dialogue/chapter5/valley_approach.json';
import { pauseMenu }       from '../../ui/PauseMenu.js';

const MAP_W = 2400;
const MAP_H = 1600;

const PLAYER_START_X = 120;
const PLAYER_START_Y = MAP_H / 2;

const EXIT_X    = MAP_W - 60;
const EXIT_Y_T  = MAP_H / 2 - 100;
const EXIT_Y_B  = MAP_H / 2 + 100;

const PHASE = {
  ARRIVING:   'ARRIVING',
  EXPLORING:  'EXPLORING',
  EXITING:    'EXITING',
  DONE:       'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

export class ValleyApproachScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:          Phase   = PHASE.ARRIVING;
  private _inputEnabled:   boolean = false;
  private _playerName:     string  = 'Arlo';
  private _robotsDialogue: boolean = false;
  private _citizenDialogue:boolean = false;
  private _chenDialogue:   boolean = false;

  constructor() {
    super({ key: 'ValleyApproachScene' });
  }

  create(): void {
    this._phase           = PHASE.ARRIVING;
    this._inputEnabled    = false;
    this._robotsDialogue  = false;
    this._citizenDialogue = false;
    this._chenDialogue    = false;

    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._buildWorld();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(1400, () => { this._startArrival(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkProximityTriggers();
      this._checkExit();
    }
  }

  // ─── World ───────────────────────────────────────────────────────────────

  private _buildWorld(): void {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // Sky gradient — pale, clean, wrong
    const sky = this.add.graphics();
    sky.fillGradientStyle(0xddeeff, 0xddeeff, 0xeef8ff, 0xeef8ff, 1);
    sky.fillRect(0, 0, MAP_W, MAP_H);

    // Ground
    this.add.graphics().fillStyle(0xc8d8c0).fillRect(0, MAP_H * 0.5, MAP_W, MAP_H * 0.5);

    // Perfect rows of trees (too perfect)
    for (let col = 0; col < 12; col++) {
      for (let row = 0; row < 3; row++) {
        const tx = 200 + col * 180;
        const ty = 200 + row * 220;
        this.add.rectangle(tx, ty, 12, 40, 0x7a9c55);
        this.add.circle(tx, ty - 30, 22, 0x4a8c35);
      }
    }

    // Pristine road markings
    const road = this.add.graphics();
    road.fillStyle(0xaaaaaa);
    road.fillRect(0, MAP_H / 2 - 40, MAP_W, 80);
    road.fillStyle(0xffffff);
    for (let x = 0; x < MAP_W; x += 120) {
      road.fillRect(x, MAP_H / 2 - 4, 60, 8);
    }

    // Robot sentinels (passive, do not attack)
    for (let i = 0; i < 5; i++) {
      const rx = 400 + i * 420;
      const ry = MAP_H / 2 - 80;
      const sentinel = this.add.rectangle(rx, ry, 14, 22, 0x334455);
      // Slowly oscillate — they see you but don't act
      this.tweens.add({
        targets:  sentinel,
        y:        ry + 6,
        duration: 1800 + i * 200,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      });
    }

    // NPC interaction zones (invisible rectangles for proximity checks)
    // Zone 1: robots near entrance (robotsDialogue)
    this.add.zone(500, MAP_H / 2, 120, 120).setName('robots_zone');
    // Zone 2: converted citizens (citizenDialogue)
    this.add.zone(1200, MAP_H / 2, 120, 120).setName('citizens_zone');
    // Zone 3: Dr. Chen reveals the back door plan (chenDialogue)
    this.add.zone(1900, MAP_H / 2, 120, 120).setName('chen_zone');

    // Decorative SI Inc. signage far right
    this.add.rectangle(MAP_W - 100, MAP_H / 2 - 120, 80, 40, 0x223344);
    this.add.text(MAP_W - 100, MAP_H / 2 - 120, 'SI INC.', {
      fontFamily: 'monospace', fontSize: '8px', color: '#88aacc',
    }).setOrigin(0.5).setDepth(5);

    // Hint arrow at right edge
    this.add.text(MAP_W - 40, MAP_H / 2, '→', {
      fontFamily: 'monospace', fontSize: '20px', color: '#446688',
    }).setDepth(5);

    void width; void height;
  }

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArrival(): void {
    this._phase = PHASE.ARRIVING;

    this.dialogMgr.show('MAYA', D.arrival.maya, () => {
      this.dialogMgr.show(this._playerName, D.arrival.player, () => {
        this.dialogMgr.show('MAYA', D.arrival.maya_2, () => {
          this.dialogMgr.show('JEROME', D.arrival.jerome, () => {
            this.dialogMgr.show('DR. CHEN', D.arrival.dr_chen, () => {
              this._phase        = PHASE.EXPLORING;
              this._inputEnabled = true;
              this._showHint('Head east toward the campus. Tap/press E near points of interest.', 5000);
            });
          });
        });
      });
    });
  }

  // ─── Proximity triggers ──────────────────────────────────────────────────

  private _checkProximityTriggers(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    if (!this._robotsDialogue && this._nearPoint(px, py, 500, MAP_H / 2, 100)) {
      this._robotsDialogue  = true;
      this._inputEnabled    = false;
      this.dialogMgr.show('MAYA', D.robots_passive.maya, () => {
        this.dialogMgr.show('DR. CHEN', D.robots_passive.dr_chen, () => {
          this._inputEnabled = true;
        });
      });
    }

    if (!this._citizenDialogue && this._nearPoint(px, py, 1200, MAP_H / 2, 100)) {
      this._citizenDialogue = true;
      this._inputEnabled    = false;
      this.dialogMgr.show(this._playerName, D.converted_citizens.player, () => {
        this.dialogMgr.show('MAYA', D.converted_citizens.maya, () => {
          this.dialogMgr.show('JEROME', D.converted_citizens.jerome, () => {
            this._inputEnabled = true;
          });
        });
      });
    }

    if (!this._chenDialogue && this._nearPoint(px, py, 1900, MAP_H / 2, 100)) {
      this._chenDialogue = true;
      this._inputEnabled = false;
      this.dialogMgr.show('DR. CHEN', D.dr_chen_route.dr_chen, () => {
        this.dialogMgr.show('MAYA', D.dr_chen_route.maya, () => {
          this._inputEnabled = true;
        });
      });
    }
  }

  private _checkExit(): void {
    if (this._phase !== PHASE.EXPLORING) return;

    const { x, y } = this.player.sprite;
    if (x < EXIT_X)  return;
    if (y < EXIT_Y_T || y > EXIT_Y_B) return;

    this._phase        = PHASE.DONE;
    this._inputEnabled = false;

    // Mark chapter 5 as active
    setFlag(this.registry, 'CH5_STARTED', true);
    this.registry.set('chapter', 5);

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) {
        this.scene.start('CampusPerimeterScene');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _nearPoint(px: number, py: number, tx: number, ty: number, range: number): boolean {
    return Math.hypot(px - tx, py - ty) < range;
  }

  private _showHint(msg: string, autofade = 3000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688',
    }).setScrollFactor(0).setDepth(25).setOrigin(0.5);

    this.tweens.add({
      targets:  hint,
      alpha:    0,
      delay:    autofade,
      duration: 800,
      onComplete: () => { hint.destroy(); },
    });
  }
}

import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS }          from '../../utils/constants.js';
import { PartyManager }    from '../../party/PartyManager.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter1/mountain_pass.json';

// ─── Layout ──────────────────────────────────────────────────────────────────

const MAP_W = 1400;
const MAP_H = 600;

const PLAYER_START_X = 80;
const PLAYER_START_Y = 340;

// Scene trigger x-positions (left → right)
const EXPOSED_RIDGE_X = 280;
const WEATHER_SIGN_X  = 500;
const VEHICLE_X       = 700;
const PATROL_X        = 1000;
const VISTA_X         = 1200;

// Exit to WorldMapScene (east end)
const EXIT_X     = 1360;
const EXIT_Y_TOP = 260;
const EXIT_Y_BOT = 420;

// ─── Phase ───────────────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING:           'ARRIVING',
  TRAVERSING:         'TRAVERSING',
  EXPOSED:            'EXPOSED',
  WEATHER:            'WEATHER',
  VEHICLE:            'VEHICLE',
  PATROL_ENCOUNTER:   'PATROL_ENCOUNTER',
  VISTA:              'VISTA',
  DONE:               'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * MountainPassScene — Mountain Pass transition zone (Chapter 1 exit).
 * Above the tree line. Higher survival drain. Weather event. Vehicle discovery.
 * Optional patrol encounter. Vista scene ends Chapter 1.
 * Exits east to WorldMapScene.
 */
export class MountainPassScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:            Phase   = PHASE.ARRIVING;
  private _inputEnabled:     boolean = false;
  private _playerName:       string  = 'YOU';
  private _exposedDone:      boolean = false;
  private _weatherDone:      boolean = false;
  private _vehicleDone:      boolean = false;
  private _patrolDone:       boolean = false;
  private _vistaDone:        boolean = false;

  constructor() {
    super({ key: 'MountainPassScene' });
  }

  create(): void {
    this._phase         = PHASE.ARRIVING;
    this._inputEnabled  = false;
    this._exposedDone   = false;
    this._weatherDone   = false;
    this._vehicleDone   = false;
    this._patrolDone    = false;
    this._vistaDone     = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawWorld();
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this._buildPlayer();
    this._buildCamera();
    this._buildHUD();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;
    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkTriggers();
      this._checkExit();
    }
  }

  // ─── World ────────────────────────────────────────────────────────────────

  private _drawWorld(): void {
    const g = this.add.graphics();

    // Open sky (grey-blue before storm)
    g.fillStyle(0x1a2030);
    g.fillRect(0, 0, MAP_W, 200);

    // Mountain silhouettes in background
    g.fillStyle(0x0d1520);
    g.fillTriangle(0, 200, 200, 80, 400, 200);
    g.fillTriangle(300, 200, 600, 60, 900, 200);
    g.fillTriangle(700, 200, 1000, 50, 1300, 200);

    // Rocky ground (above tree line)
    g.fillStyle(0x2a2018);
    g.fillRect(0, 200, MAP_W, MAP_H - 200);

    // Scree / loose rock texture
    g.fillStyle(0x3a3028);
    for (let x = 0; x < MAP_W; x += 80) {
      g.fillRect(x, 220 + (x % 3) * 8, 70, 20);
    }

    // Path
    g.fillStyle(0x2e2416);
    g.fillRect(0, 300, MAP_W, 80);

    // Snow patches on high rocks
    g.fillStyle(0xdde8ee, 0.4);
    g.fillRect(200, 180, 60, 20);
    g.fillRect(800, 160, 80, 15);
    g.fillRect(1100, 185, 50, 18);

    // Burned-out truck wreck
    g.fillStyle(0x3a2a1a);
    g.fillRect(VEHICLE_X - 40, 320, 80, 40);
    g.fillStyle(0x1a1010);
    g.fillRect(VEHICLE_X - 36, 316, 72, 10);
    // Scorch marks
    g.fillStyle(0x2a1808, 0.6);
    g.fillEllipse(VEHICLE_X, 360, 100, 20);

    // Working vehicle (further east, distinct color)
    g.fillStyle(0x224422);
    g.fillRect(VEHICLE_X + 200, 320, 90, 42);
    g.fillStyle(0x334433);
    g.fillRect(VEHICLE_X + 204, 316, 82, 12);

    // Vista point (east, slight ledge)
    g.fillStyle(0x1a2820);
    g.fillRect(VISTA_X - 40, 290, 80, 50);
    g.lineStyle(1, 0x334433);
    g.lineBetween(VISTA_X - 40, 290, VISTA_X + 40, 290);

    // Storm clouds (bruise-purple, high up)
    g.fillStyle(0x1a0a28, 0.6);
    g.fillEllipse(700, 80, 400, 100);
    g.fillEllipse(1000, 60, 300, 80);

    // Exit marker
    g.fillStyle(0x334433, 0.3);
    g.fillRect(EXIT_X, EXIT_Y_TOP, 40, EXIT_Y_BOT - EXIT_Y_TOP);
  }

  // ─── Player ──────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.4);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'APPALACHIA  ·  MOUNTAIN PASS', {
      fontFamily: 'monospace', fontSize: '10px', color: '#3a4a5a',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('ELIAS', D.arriving.elias, () => {
        this._phase = PHASE.TRAVERSING;
        this._inputEnabled = true;
        this._showHint('Head east through the pass.', 4000);
      });
    });
  }

  // ─── Trigger checks ──────────────────────────────────────────────────────

  private _checkTriggers(): void {
    const { x } = this.player.sprite;

    if (!this._exposedDone && x > EXPOSED_RIDGE_X) {
      this._exposedDone = true;
      this._triggerExposedRidge();
      return;
    }
    if (!this._weatherDone && x > WEATHER_SIGN_X) {
      this._weatherDone = true;
      this._triggerWeather();
      return;
    }
    if (!this._vehicleDone && x > VEHICLE_X) {
      this._vehicleDone = true;
      this._triggerVehicle();
      return;
    }
    if (!this._patrolDone && x > PATROL_X) {
      this._patrolDone = true;
      this._triggerPatrol();
      return;
    }
    if (!this._vistaDone && x > VISTA_X) {
      this._vistaDone = true;
      this._triggerVista();
    }
  }

  // ─── Scene events ────────────────────────────────────────────────────────

  private _triggerExposedRidge(): void {
    this._inputEnabled = false;
    this._phase = PHASE.EXPOSED;
    this.dialogMgr.show('MAYA', D.exposed_ridge.maya, () => {
      this.dialogMgr.show('ELIAS', D.exposed_ridge.elias, () => {
        this._phase = PHASE.TRAVERSING;
        this._inputEnabled = true;
      });
    });
  }

  private _triggerWeather(): void {
    this._inputEnabled = false;
    this._phase = PHASE.WEATHER;
    this.dialogMgr.show('ELIAS', D.weather_sign.elias, () => {
      this.dialogMgr.show(this._playerName, D.weather_sign.player, () => {
        this.dialogMgr.show('ELIAS', D.weather_sign.elias2 as string[], () => {
          this._phase = PHASE.TRAVERSING;
          this._inputEnabled = true;
        });
      });
    });
  }

  private _triggerVehicle(): void {
    this._inputEnabled = false;
    this._phase = PHASE.VEHICLE;
    // Wreck first, then working vehicle
    this.dialogMgr.show(this._playerName, D.vehicle_wreck.player, () => {
      this.dialogMgr.show('ELIAS', D.vehicle_wreck.elias, () => {
        this.dialogMgr.show('MAYA', D.vehicle_wreck.maya, () => {
          // Working vehicle
          this.time.delayedCall(300, () => {
            this.dialogMgr.show(this._playerName, D.vehicle_working.player, () => {
              this.dialogMgr.show('MAYA', D.vehicle_working.maya, () => {
                this.dialogMgr.show('ELIAS', D.vehicle_working.elias, () => {
                  this.time.delayedCall(800, () => {
                    this.dialogMgr.show('MAYA', D.vehicle_running.maya, () => {
                      this.dialogMgr.show(this._playerName, D.vehicle_running.player, () => {
                        this.dialogMgr.show('MAYA', D.vehicle_running.maya2 as string[], () => {
                          this._phase = PHASE.TRAVERSING;
                          this._inputEnabled = true;
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  private _triggerPatrol(): void {
    this._inputEnabled = false;
    this._phase = PHASE.PATROL_ENCOUNTER;
    this.dialogMgr.show('SYSTEM', D.random_patrol_encounter.system, () => {
      this.dialogMgr.show('MAYA', D.random_patrol_encounter.maya, () => {
        // 50% chance: fight or stealth past
        const fightIt = Math.random() < 0.5;
        if (fightIt) {
          this._launchPatrolBattle();
        } else {
          // Stealth past — no battle
          this.dialogMgr.show(this._playerName, [
            "They didn't spot us.",
            "Close."
          ], () => {
            this._phase = PHASE.TRAVERSING;
            this._inputEnabled = true;
          });
        }
      });
    });
  }

  private _launchPatrolBattle(): void {
    const initData: BattleInitData = {
      enemyKey:    'sentinel',
      returnScene: 'MountainPassScene',
      allies:      new PartyManager(this.registry).toAllyConfigs(),
    };
    bus.once(EVENTS.BATTLE_END, () => {
      this._phase = PHASE.TRAVERSING;
      this._inputEnabled = true;
    });
    this.scene.pause();
    this.scene.launch('BattleScene', initData);
  }

  private _triggerVista(): void {
    this._inputEnabled = false;
    this._phase = PHASE.VISTA;
    this.dialogMgr.show(this._playerName, D.chapter_end_vista.player, () => {
      this.dialogMgr.show('ELIAS', D.chapter_end_vista.elias, () => {
        this.dialogMgr.show('MAYA', D.chapter_end_vista.maya, () => {
          this.dialogMgr.show(this._playerName, D.chapter_end_vista.player2 as string[], () => {
            this._inputEnabled = true;
            this._showHint('Head to the exit.', 4000);
          });
        });
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;

    this.dialogMgr.show('SYSTEM', D.chapter_transition.system, () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('WorldMapScene');
      });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 3000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#3a4a5a',
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

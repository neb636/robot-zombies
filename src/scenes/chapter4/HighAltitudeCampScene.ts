import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter4/rockies.json';
import { ECHO_NPC }        from '../../characters/echo.js';

/** Flags used by this scene. */
const FLAG_ALTITUDE_RESTED    = 'altitude_sickness_rested';
const FLAG_CAMPFIRE_SEEN      = 'ch4_campfire_seen';
const FLAG_ECHO_ENCOUNTERED   = 'echo_encountered';

const MAP_W = 1200;
const MAP_H =  800;

const PLAYER_START_X = 200;
const PLAYER_START_Y = 400;

/** Echo NPC position — appears near the north edge of camp, after nightfall. */
const ECHO_X = 900;
const ECHO_Y = 220;

/** Rest marker position (campfire / sleeping area). */
const REST_X = 600;
const REST_Y = 420;
const REST_RANGE = 90;

/** Exit trigger (east edge — leads to GhostTownScene). */
const EXIT_X_THRESHOLD = MAP_W - 60;

const PHASE = {
  ARRIVING:        'ARRIVING',
  EXPLORING:       'EXPLORING',
  REST_PROMPT:     'REST_PROMPT',
  RESTING:         'RESTING',
  AFTER_REST:      'AFTER_REST',
  CAMPFIRE:        'CAMPFIRE',
  ECHO_ENCOUNTER:  'ECHO_ENCOUNTER',
  DONE:            'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * HighAltitudeCampScene — Ch.4, Node 1.
 *
 * Drone-free safe zone (altitude). First entry applies –10% stat penalty
 * (ALTITUDE_SICKNESS flag) until the party rests 1 day here.
 * Echo (Converted NPC) appears at camp edge after resting — optional subplot.
 * Exit leads east to GhostTownScene.
 */
export class HighAltitudeCampScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = PHASE.ARRIVING;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';
  private _isFirstVisit:  boolean = true;
  private _echoRect:      Phaser.GameObjects.Rectangle | null = null;
  private _restLabel:     Phaser.GameObjects.Text | null      = null;
  private _interactKey!:  Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'HighAltitudeCampScene' });
  }

  create(): void {
    this._phase        = PHASE.ARRIVING;
    this._inputEnabled = false;
    this._playerName   = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    const flags      = getFlags(this.registry);
    this._isFirstVisit = !flags[FLAG_ALTITUDE_RESTED];

    this._buildMap();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this._interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );
    document.addEventListener('interact:tap', this._onInteractTap);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.time.delayedCall(1100, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkProximity();
      this._checkExit();
    }
  }

  shutdown(): void {
    document.removeEventListener('interact:tap', this._onInteractTap);
  }

  // ─── Map ─────────────────────────────────────────────────────────────────

  private _buildMap(): void {
    // Sky gradient — cool alpine blues
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4a6fa8, 0x4a6fa8, 0x1a3050, 0x1a3050, 1);
    bg.fillRect(0, 0, MAP_W, MAP_H);

    // Ground
    this.add.graphics()
      .fillStyle(0x7a8a7a)
      .fillRect(0, MAP_H - 120, MAP_W, 120);

    // Snow patches
    this.add.graphics()
      .fillStyle(0xdde8ee)
      .fillRect(50, MAP_H - 140, 180, 30)
      .fillRect(700, MAP_H - 150, 220, 35)
      .fillRect(400, MAP_H - 130, 90, 20);

    // Mountain silhouettes (far)
    const mtn = this.add.graphics().fillStyle(0x2a3a4a);
    mtn.fillTriangle(0, MAP_H - 100, 250, 80, 500, MAP_H - 100);
    mtn.fillTriangle(380, MAP_H - 100, 650, 60, 900, MAP_H - 100);
    mtn.fillTriangle(750, MAP_H - 100, 1000, 40, MAP_W, MAP_H - 100);

    // Campfire visual
    this.add.graphics()
      .fillStyle(0xcc6600)
      .fillCircle(REST_X, REST_Y, 14);
    this.add.graphics()
      .fillStyle(0xff9900)
      .fillCircle(REST_X, REST_Y - 4, 8);
    this.add.text(REST_X, REST_Y - 32, 'CAMPFIRE', {
      fontFamily: 'monospace', fontSize: '8px', color: '#cc8844',
    }).setOrigin(0.5).setDepth(4);

    // Rocks / cover
    this.add.graphics()
      .fillStyle(0x556655)
      .fillRect(100, 280, 60, 40)
      .fillRect(800, 350, 80, 50)
      .fillRect(400, 200, 50, 35);

    // "SAFE ZONE" marker
    this.add.text(MAP_W / 2, 30, '— HIGH ALTITUDE CAMP —', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446688',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
  }

  private _buildPlayer(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.6);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;

    const arrivalLines = D.high_altitude_camp.arrival.player;
    this.dialogMgr.show(this._playerName, arrivalLines, () => {
      this.dialogMgr.show('MAYA', D.high_altitude_camp.arrival.maya, () => {
        if (this._isFirstVisit) {
          this._applyAltitudeSickness();
          this.dialogMgr.show(
            'SYSTEM',
            D.high_altitude_camp.altitude_sickness_warning,
            () => { this._enterExploring(); },
          );
        } else {
          this._enterExploring();
        }
      });
    });
  }

  private _applyAltitudeSickness(): void {
    // Mark the sickness flag — reduces all party stats by 10% until rested
    setFlag(this.registry, 'altitude_sickness_active', true);
    this._showHint('Altitude sickness: party at –10% stats. Rest at the campfire.', 6000);
  }

  private _enterExploring(): void {
    this._phase        = PHASE.EXPLORING;
    this._inputEnabled = true;

    // Show party arrival lines briefly
    this.time.delayedCall(800, () => {
      this.dialogMgr.show('DEJA', D.high_altitude_camp.arrival.deja, () => {});
    });
  }

  // ─── Proximity checks ────────────────────────────────────────────────────

  private _checkProximity(): void {
    this._checkRestArea();
    this._checkEchoProximity();
  }

  private _checkRestArea(): void {
    if (
      this._phase !== PHASE.EXPLORING &&
      this._phase !== PHASE.AFTER_REST
    ) return;

    const dist = Math.hypot(
      this.player.sprite.x - REST_X,
      this.player.sprite.y - REST_Y,
    );

    if (dist < REST_RANGE) {
      const flags = getFlags(this.registry);

      if (!flags[FLAG_ALTITUDE_RESTED]) {
        // Show interact hint
        this.mobileControls.showInteract('Rest');
        if (this._restLabel === null) {
          this._restLabel = this.add.text(REST_X, REST_Y - 50, '[E] Rest', {
            fontFamily: 'monospace', fontSize: '9px', color: '#88bb88',
          }).setOrigin(0.5).setDepth(10);
        }

        if (
          Phaser.Input.Keyboard.JustDown(this._interactKey)
        ) {
          this._triggerRest();
        }
      } else if (!flags[FLAG_CAMPFIRE_SEEN]) {
        this._triggerCampfire();
      }
    } else {
      this.mobileControls.hideInteract();
      if (this._restLabel) {
        this._restLabel.destroy();
        this._restLabel = null;
      }
    }
  }

  private _onInteractTap = (): void => {
    if (!this._inputEnabled || pauseMenu.isOpen()) return;
    const flags = getFlags(this.registry);
    const distToRest = Math.hypot(
      this.player.sprite.x - REST_X,
      this.player.sprite.y - REST_Y,
    );
    if (distToRest < REST_RANGE && !flags[FLAG_ALTITUDE_RESTED]) {
      this._triggerRest();
    }
  };

  private _triggerRest(): void {
    if (this._phase !== PHASE.EXPLORING) return;
    this._phase        = PHASE.RESTING;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    if (this._restLabel) {
      this._restLabel.destroy();
      this._restLabel = null;
    }

    // Fade to black — simulate one day passing
    this.cameras.main.fadeOut(800, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p < 1) return;

      // Clear altitude sickness
      setFlag(this.registry, 'altitude_sickness_active', false);
      setFlag(this.registry, FLAG_ALTITUDE_RESTED, true);

      this.cameras.main.fadeIn(800, 0, 0, 0, (_c: Phaser.Cameras.Scene2D.Camera, p2: number) => {
        if (p2 < 1) return;

        this._phase = PHASE.AFTER_REST;
        this.dialogMgr.show(this._playerName, D.high_altitude_camp.after_rest.player, () => {
          this.dialogMgr.show('DEJA', D.high_altitude_camp.after_rest.deja, () => {
            this.dialogMgr.show('MAYA', D.high_altitude_camp.after_rest.maya, () => {
              this._phase        = PHASE.EXPLORING;
              this._inputEnabled = true;
              // Spawn Echo now that the party has rested
              this._spawnEcho();
            });
          });
        });
      });
    });
  }

  private _triggerCampfire(): void {
    const flags = getFlags(this.registry);
    if (flags[FLAG_CAMPFIRE_SEEN]) return;
    setFlag(this.registry, FLAG_CAMPFIRE_SEEN, true);

    this._phase        = PHASE.CAMPFIRE;
    this._inputEnabled = false;

    this.dialogMgr.show('JEROME', D.high_altitude_camp.camp_fire_night.jerome, () => {
      this.dialogMgr.show('MAYA', D.high_altitude_camp.camp_fire_night.maya, () => {
        this.dialogMgr.show('DEJA', D.high_altitude_camp.camp_fire_night.deja, () => {
          this.dialogMgr.show('JEROME', D.high_altitude_camp.camp_fire_night.jerome_2, () => {
            this.dialogMgr.show('DEJA', D.high_altitude_camp.camp_fire_night.deja_2, () => {
              this._phase        = PHASE.EXPLORING;
              this._inputEnabled = true;
            });
          });
        });
      });
    });
  }

  // ─── Echo encounter ─────────────────────────────────────────────────────

  private _spawnEcho(): void {
    const flags = getFlags(this.registry);
    if (flags[FLAG_ECHO_ENCOUNTERED]) return;
    if (!flags['dr_chen_recruited']) return;

    this._echoRect = this.add.rectangle(ECHO_X, ECHO_Y, ECHO_NPC.width, ECHO_NPC.height, ECHO_NPC.color);
    this._echoRect.setDepth(5);
    this.add.text(ECHO_X, ECHO_Y - 30, ECHO_NPC.displayName, {
      fontFamily: 'monospace', fontSize: '8px', color: '#6688aa',
    }).setOrigin(0.5).setDepth(6);
  }

  private _checkEchoProximity(): void {
    if (!this._echoRect) return;
    const flags = getFlags(this.registry);
    if (flags[FLAG_ECHO_ENCOUNTERED]) return;
    if (!flags['dr_chen_recruited']) return;

    const dist = Math.hypot(
      this.player.sprite.x - ECHO_X,
      this.player.sprite.y - ECHO_Y,
    );

    if (dist < 80) {
      setFlag(this.registry, FLAG_ECHO_ENCOUNTERED, true);
      this._inputEnabled = false;
      this._phase        = PHASE.ECHO_ENCOUNTER;
      this._triggerEchoEncounter();
    }
  }

  private _triggerEchoEncounter(): void {
    const echoData = D.echo['rockies.echo.plea'];

    this.dialogMgr.show('SYSTEM', echoData.approach.system, () => {
      this.dialogMgr.show(ECHO_NPC.displayName, echoData.approach.echo, () => {
        this.dialogMgr.show(this._playerName, ['...'], () => {
          this.dialogMgr.show('DR. CHEN', echoData.approach.chen, () => {
            this._showEchoChoice();
          });
        });
      });
    });
  }

  private _showEchoChoice(): void {
    const { width, height } = this.scale;
    const echoData  = D.echo['rockies.echo.plea'];

    const overlay = this.add.rectangle(width / 2, height / 2, 360, 100, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(50);
    const prompt = this.add.text(width / 2, height / 2 - 24, echoData.choice_prompt, {
      fontFamily: 'monospace', fontSize: '13px', color: '#cccccc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    const btnCure = this.add.text(width / 2, height / 2 + 4, `[1] ${echoData.choice_cure.label}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#88dd88',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true });

    const btnRefuse = this.add.text(width / 2, height / 2 + 24, `[2] ${echoData.choice_refuse.label}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#dd8866',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true });

    const cleanup = (): void => {
      overlay.destroy(); prompt.destroy();
      btnCure.destroy(); btnRefuse.destroy();
    };

    const handleCure = (): void => {
      cleanup();
      this._resolveEchoChoice('cure');
    };
    const handleRefuse = (): void => {
      cleanup();
      this._resolveEchoChoice('refuse');
    };

    btnCure.on('pointerdown', handleCure);
    btnRefuse.on('pointerdown', handleRefuse);

    const key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (Phaser.Input.Keyboard.JustDown(key1)) { handleCure(); }
        if (Phaser.Input.Keyboard.JustDown(key2)) { handleRefuse(); }
      },
      loop: true,
    });
  }

  private _resolveEchoChoice(choice: 'cure' | 'refuse'): void {
    const echoData = D.echo['rockies.echo.plea'];

    if (choice === 'cure') {
      setFlag(this.registry, ECHO_NPC.curedFlag, true);

      this.dialogMgr.show('SYSTEM', echoData.choice_cure.lines_before, () => {
        this.dialogMgr.show(ECHO_NPC.displayName, echoData.choice_cure.echo_response, () => {
          this.dialogMgr.show('DR. CHEN', echoData.choice_cure.chen, () => {
            // Tint Echo to signal cure
            if (this._echoRect) {
              this._echoRect.setFillStyle(0xaabbaa);
            }
            this._phase        = PHASE.EXPLORING;
            this._inputEnabled = true;
          });
        });
      });
    } else {
      setFlag(this.registry, ECHO_NPC.refusedFlag, true);

      this.dialogMgr.show('SYSTEM', echoData.choice_refuse.lines, () => {
        this._phase        = PHASE.EXPLORING;
        this._inputEnabled = true;
      });
    }
  }

  // ─── Exit ─────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (
      this._phase !== PHASE.EXPLORING &&
      this._phase !== PHASE.AFTER_REST
    ) return;

    const flags = getFlags(this.registry);
    // Must rest before leaving (altitude sickness gate)
    if (!flags[FLAG_ALTITUDE_RESTED]) return;

    if (this.player.sprite.x > EXIT_X_THRESHOLD) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;
      this.mobileControls.hideInteract();

      this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('GhostTownScene');
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '10px', color: '#4488aa',
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

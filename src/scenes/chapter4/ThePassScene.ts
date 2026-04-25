import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import { PartyManager }    from '../../party/PartyManager.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter4/rockies.json';
import {
  GATE_COLOSSUS_KEY,
  GATE_COLOSSUS_BOSS_CONFIG,
  BLOCKADE_SENTRY_KEY,
} from '../../entities/enemies/chapter4/index.js';

const FLAG_THE_PASS_STARTED   = 'the_pass_started';
const FLAG_ROOM_1_CLEAR       = 'the_pass_room1_clear';
const FLAG_ROOM_2_CLEAR       = 'the_pass_room2_clear';
const FLAG_ROOM_3_CLEAR       = 'the_pass_room3_clear';
const FLAG_DEJA_LOST          = 'deja_lost';
const FLAG_SMOKE_LOST         = 'smoke_lost';
const FLAG_THE_PASS_COMPLETE  = 'the_pass_complete';

const MAP_W = 1000;
const MAP_H =  600;

const PLAYER_START_X = 100;
const PLAYER_START_Y = 300;

/** Room trigger thresholds (player x position enters next room). */
const ROOM_THRESHOLDS = [250, 450, 660, 800] as const;

/** Exit — east edge into WorldMapScene / Ch.5 approach. */
const EXIT_X_THRESHOLD = MAP_W - 80;

const PHASE = {
  ARRIVING:       'ARRIVING',
  APPROACH:       'APPROACH',
  ROOM_1:         'ROOM_1',
  ROOM_2:         'ROOM_2',
  ROOM_3:         'ROOM_3',
  ROOM_3_BATTLE:  'ROOM_3_BATTLE',
  ROOM_4:         'ROOM_4',
  ROOM_4_DEJA:    'ROOM_4_DEJA',
  ROOM_5:         'ROOM_5',
  DONE:           'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * ThePassScene — Ch.4, Node 4. Nevada-California border blockade.
 *
 * Five-room gauntlet. All scripted — maximum intensity.
 * Critical beats:
 *   Room 3: Gate Colossus boss fight (3-phase BossConfig).
 *   Room 4: Deja loss event. Bad luck. Not a sacrifice. Cruel.
 *
 * After Room 4:
 *   - PartyManager.removeMember('deja')
 *   - Flag DEJA_LOST = true
 *   - Flag SMOKE_LOST = true (party permanently loses Smoke escape ability)
 *
 * Exit east to WorldMapScene (Ch.5 unlocked).
 */
export class ThePassScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:        Phase   = PHASE.ARRIVING;
  private _inputEnabled: boolean = false;
  private _playerName:   string  = 'Arlo';

  constructor() {
    super({ key: 'ThePassScene' });
  }

  init(): void {
    // Called when returning from BattleScene
    // BattleScene resumes the paused scene — this init is for fresh starts
  }

  create(): void {
    this._phase        = PHASE.ARRIVING;
    this._inputEnabled = false;
    this._playerName   = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    const flags = getFlags(this.registry);

    this._buildMap();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    // Battle return listener — resume from correct room after Gate Colossus fight
    this.events.on('resume', (_scene: Phaser.Scene, data: unknown) => {
      const victory = (data as { victory?: boolean } | undefined)?.victory ?? false;
      if (this._phase === PHASE.ROOM_3_BATTLE) {
        if (victory) {
          this._onGateColossusFallen();
        } else {
          // Defeat — handle gracefully (retry)
          this.dialogMgr.show('SYSTEM', ['The blockade holds. Try again.'], () => {
            this._phase        = PHASE.ROOM_3;
            this._inputEnabled = true;
          });
        }
      }
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => {
      if (!flags[FLAG_THE_PASS_STARTED]) {
        setFlag(this.registry, FLAG_THE_PASS_STARTED, true);
        this._startApproach();
      } else {
        this._resumeFromFlags(flags);
      }
    });
  }

  update(): void {
    if (this._phase === PHASE.DONE || this._phase === PHASE.ROOM_3_BATTLE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkRoomTriggers();
      this._checkExit();
    }
  }

  // ─── Map ─────────────────────────────────────────────────────────────────

  private _buildMap(): void {
    // Dark industrial — robot blockade
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080812, 0x080812, 0x0a0a1e, 0x0a0a1e, 1);
    bg.fillRect(0, 0, MAP_W, MAP_H);

    // Corridor walls (top and bottom)
    this.add.graphics()
      .fillStyle(0x1a1a2a)
      .fillRect(0, 0, MAP_W, 80)
      .fillRect(0, MAP_H - 80, MAP_W, 80);

    // Room dividers (vertical lines)
    ROOM_THRESHOLDS.forEach(x => {
      this.add.graphics()
        .lineStyle(2, 0x334455, 0.5)
        .lineBetween(x, 80, x, MAP_H - 80);
    });

    // Warning lights at room transitions
    ROOM_THRESHOLDS.forEach(x => {
      const light = this.add.graphics()
        .fillStyle(0xcc2200)
        .fillCircle(x, 40, 8);

      this.tweens.add({
        targets:  light,
        alpha:    { from: 1, to: 0.2 },
        duration: 600,
        yoyo:     true,
        repeat:   -1,
      });
    });

    // Cover objects
    this.add.graphics()
      .fillStyle(0x333344)
      .fillRect(180, 160, 40, 60)
      .fillRect(380, 300, 50, 40)
      .fillRect(580, 140, 40, 70)
      .fillRect(700, 280, 45, 50);

    // California border marker (far right)
    this.add.text(MAP_W - 60, MAP_H / 2, 'CA', {
      fontFamily: 'monospace', fontSize: '9px', color: '#336633',
    }).setOrigin(0.5).setDepth(3).setAlpha(0.4);

    this.add.text(MAP_W / 2, 20, '— THE PASS —', {
      fontFamily: 'monospace', fontSize: '11px', color: '#cc2200',
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
    this.cameras.main.setZoom(1.5);
  }

  // ─── Resume logic ─────────────────────────────────────────────────────────

  private _resumeFromFlags(flags: Record<string, boolean>): void {
    if (flags[FLAG_THE_PASS_COMPLETE]) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;
      this.scene.start('WorldMapScene');
      return;
    }
    if (flags[FLAG_DEJA_LOST]) {
      this._phase        = PHASE.ROOM_5;
      this._inputEnabled = true;
      return;
    }
    if (flags[FLAG_ROOM_3_CLEAR]) {
      this._phase        = PHASE.ROOM_4;
      this._inputEnabled = true;
      return;
    }
    if (flags[FLAG_ROOM_2_CLEAR]) {
      this._phase        = PHASE.ROOM_3;
      this._inputEnabled = true;
      return;
    }
    if (flags[FLAG_ROOM_1_CLEAR]) {
      this._phase        = PHASE.ROOM_2;
      this._inputEnabled = true;
      return;
    }
    this._startApproach();
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startApproach(): void {
    this._phase = PHASE.APPROACH;
    const passData = D.the_pass;

    this.dialogMgr.show(this._playerName, passData.approach.player, () => {
      this.dialogMgr.show('DEJA', passData.approach.deja_1, () => {
        this.dialogMgr.show('DR. CHEN', passData.approach.chen, () => {
          this.dialogMgr.show('MAYA', passData.approach.maya, () => {
            this.dialogMgr.show('JEROME', passData.approach.jerome, () => {
              this.dialogMgr.show('DEJA', passData.approach.deja_2, () => {
                this._phase        = PHASE.ROOM_1;
                this._inputEnabled = true;
                this._showHint('Push east through the blockade.', 4000);
              });
            });
          });
        });
      });
    });
  }

  // ─── Room triggers ────────────────────────────────────────────────────────

  private _checkRoomTriggers(): void {
    const px = this.player.sprite.x;
    const flags = getFlags(this.registry);

    if (
      this._phase === PHASE.ROOM_1 &&
      px > (ROOM_THRESHOLDS[0] ?? 250) &&
      !flags[FLAG_ROOM_1_CLEAR]
    ) {
      this._triggerRoom1Battle();
    }

    if (
      this._phase === PHASE.ROOM_2 &&
      px > (ROOM_THRESHOLDS[1] ?? 450) &&
      !flags[FLAG_ROOM_2_CLEAR]
    ) {
      this._triggerRoom2Battle();
    }

    if (
      this._phase === PHASE.ROOM_3 &&
      px > (ROOM_THRESHOLDS[2] ?? 660) &&
      !flags[FLAG_ROOM_3_CLEAR]
    ) {
      this._triggerRoom3Boss();
    }

    if (
      this._phase === PHASE.ROOM_4 &&
      px > (ROOM_THRESHOLDS[3] ?? 800) &&
      !flags[FLAG_DEJA_LOST]
    ) {
      this._triggerRoom4Deja();
    }
  }

  private _triggerRoom1Battle(): void {
    this._inputEnabled = false;
    this.dialogMgr.show('SYSTEM', D.the_pass.room_1.clear, () => {
      setFlag(this.registry, FLAG_ROOM_1_CLEAR, true);
      const party = new PartyManager(this.registry);
      const initData: BattleInitData = {
        enemyKey:    BLOCKADE_SENTRY_KEY,
        returnScene: 'ThePassScene',
        allies:      party.toAllyConfigs(),
        scripted:    false,
      };
      this._phase = PHASE.ROOM_2;
      this.scene.launch('BattleScene', initData);
      this.scene.pause();
    });
  }

  private _triggerRoom2Battle(): void {
    this._inputEnabled = false;
    this.dialogMgr.show('DR. CHEN', D.the_pass.room_2.clear, () => {
      setFlag(this.registry, FLAG_ROOM_2_CLEAR, true);
      const party = new PartyManager(this.registry);
      const initData: BattleInitData = {
        enemyKey:    BLOCKADE_SENTRY_KEY,
        returnScene: 'ThePassScene',
        allies:      party.toAllyConfigs(),
        scripted:    false,
      };
      this.scene.launch('BattleScene', initData);
      this.scene.pause();
    });
  }

  private _triggerRoom3Boss(): void {
    this._inputEnabled = false;
    this._phase        = PHASE.ROOM_3_BATTLE;

    const passData = D.the_pass;

    // Pre-boss dialogue
    this.dialogMgr.show('DEJA', passData.room_3.before_boss.deja, () => {
      this.dialogMgr.show(this._playerName, passData.room_3.before_boss.player, () => {
        this.dialogMgr.show('DR. CHEN', passData.room_3.before_boss.chen, () => {
          setFlag(this.registry, FLAG_ROOM_3_CLEAR, true);
          const party = new PartyManager(this.registry);
          const initData: BattleInitData = {
            enemyKey:    GATE_COLOSSUS_KEY,
            returnScene: 'ThePassScene',
            allies:      party.toAllyConfigs(),
            scripted:    true,
            bossConfig:  GATE_COLOSSUS_BOSS_CONFIG,
          };
          this.scene.launch('BattleScene', initData);
          this.scene.pause();
        });
      });
    });
  }

  private _onGateColossusFallen(): void {
    const passData = D.the_pass;
    this.dialogMgr.show('MAYA', passData.room_3.victory.maya, () => {
      this._phase        = PHASE.ROOM_4;
      this._inputEnabled = true;
    });
  }

  /** Room 4 — Deja's death. Tone is everything here. Unhurried. No redemption. */
  private _triggerRoom4Deja(): void {
    if (getFlags(this.registry)[FLAG_DEJA_LOST]) return;
    this._inputEnabled = false;
    this._phase        = PHASE.ROOM_4_DEJA;

    const dejaData = D.the_pass.room_4['rockies.deja.final'];

    // Deja's first line — cut off mid-sentence
    this.dialogMgr.show('DEJA', dejaData.before.deja_1, () => {
      this.dialogMgr.show('SYSTEM', dejaData.before.system_1, () => {
        this.dialogMgr.show('DR. CHEN', dejaData.before.chen, () => {
          this.dialogMgr.show('DEJA', dejaData.before.deja_2, () => {
            this.dialogMgr.show(this._playerName, dejaData.before.player_1, () => {
              this.dialogMgr.show('DEJA', dejaData.before.deja_3, () => {
                this.dialogMgr.show('MAYA', dejaData.before.maya, () => {
                  this.dialogMgr.show('DEJA', dejaData.before.deja_4, () => {
                    this.dialogMgr.show('JEROME', dejaData.before.jerome, () => {
                      this.dialogMgr.show('DEJA', dejaData.before.deja_5, () => {
                        this.dialogMgr.show(this._playerName, dejaData.before.player_2, () => {
                          this.dialogMgr.show('DEJA', dejaData.before.deja_6, () => {
                            this._dejaLoss();
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
    });
  }

  private _dejaLoss(): void {
    const dejaData = D.the_pass.room_4['rockies.deja.final'];

    // Silence after Deja's last word
    this.dialogMgr.show('SYSTEM', dejaData.before.system_2, () => {
      // Mechanically remove Deja
      const party = new PartyManager(this.registry);
      party.removeMember('deja');
      setFlag(this.registry, FLAG_DEJA_LOST, true);
      setFlag(this.registry, FLAG_SMOKE_LOST, true);

      // Visual: flash dark, no fanfare
      this.cameras.main.fadeOut(600, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p < 1) return;

        // Show loss text (dark, quiet — not a celebration)
        this.cameras.main.fadeIn(600, 0, 0, 0, (_c: Phaser.Cameras.Scene2D.Camera, p2: number) => {
          if (p2 < 1) return;

          this._showLossText(dejaData.deja_lost_text, 0xcc4488, () => {
            this._showLossText(dejaData.smoke_lost_text, 0x886644, () => {
              this.dialogMgr.show('SYSTEM', dejaData.room_4_clear.system, () => {
                this._phase        = PHASE.ROOM_5;
                this._inputEnabled = true;
              });
            });
          });
        });
      });
    });
  }

  private _showLossText(msg: string, color: number, onDone: () => void): void {
    const { width, height } = this.scale;
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const text = this.add.text(width / 2, height / 2, msg, {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      hex,
      stroke:     '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40).setAlpha(0);

    this.tweens.add({
      targets:  text,
      alpha:    { from: 0, to: 0.9 },
      duration: 800,
      yoyo:     false,
      hold:     2000,
      onComplete: () => {
        this.tweens.add({
          targets:  text,
          alpha:    0,
          duration: 600,
          onComplete: () => {
            text.destroy();
            onDone();
          },
        });
      },
    });
  }

  // ─── Exit ─────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.ROOM_5) return;

    if (this.player.sprite.x > EXIT_X_THRESHOLD) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;

      const passData = D.the_pass;

      this.dialogMgr.show('SYSTEM', passData.room_5.exit.system, () => {
        this.dialogMgr.show('MAYA', passData.room_5.exit.maya, () => {
          this.dialogMgr.show('DR. CHEN', passData.room_5.exit.chen, () => {
            this.dialogMgr.show('JEROME', passData.room_5.exit.jerome, () => {
              setFlag(this.registry, FLAG_THE_PASS_COMPLETE, true);

              this.cameras.main.fadeOut(1200, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
                if (p === 1) this.scene.start('WorldMapScene');
              });
            });
          });
        });
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '10px', color: '#cc3300',
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

import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag }         from '../../utils/constants.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS }          from '../../utils/constants.js';
import { PartyManager }    from '../../party/PartyManager.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import { SIX_BEATEN_CH1_FLAG } from '../../entities/enemies/chapter1/wardenSixCh1.js';
import D from '../../data/dialogue/chapter1/harlan_mine.json';

// ─── Layout per floor ────────────────────────────────────────────────────────

const MAP_W = 800;
const MAP_H = 600;
const PLAYER_START_X = 100;
const PLAYER_START_Y = 320;

// Floor-descent trigger (player reaches east end of each floor)
const DESCENT_X = 740;

// Boss trigger (floor 4 west zone)
const BOSS_X    = 400;
const BOSS_Y    = 320;

// Captive NPC for floor 2 cutscene
const CAPTIVE_X = 300;
const CAPTIVE_Y = 290;

// Control panel (floor 3)
const PANEL_X = 600;
const PANEL_Y = 320;

// Exit (after Warden Six)
const EXIT_X     = 60;
const EXIT_Y_TOP = 260;
const EXIT_Y_BOT = 380;

const INTERACT_DIST = 70;

// ─── Phase ───────────────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING:          'ARRIVING',
  FLOOR_ONE:         'FLOOR_ONE',
  FLOOR_TWO:         'FLOOR_TWO',
  FLOOR_THREE:       'FLOOR_THREE',
  FLOOR_FOUR:        'FLOOR_FOUR',
  BOSS_BATTLE:       'BOSS_BATTLE',
  POST_BOSS:         'POST_BOSS',
  WARDEN_SIX:        'WARDEN_SIX',
  WARDEN_SIX_BATTLE: 'WARDEN_SIX_BATTLE',
  CAPTIVES_FREED:    'CAPTIVES_FREED',
  DONE:              'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * HarlanMineScene — Harlan Mine hot zone dungeon.
 * 4 floors, boss fight (Excavator Prime), then immediate Warden Six surprise fight.
 * Sets SIX_BEATEN_CH1 on Warden Six victory.
 * Exits west into MountainPassScene.
 */
export class HarlanMineScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:           Phase   = PHASE.ARRIVING;
  private _inputEnabled:    boolean = false;
  private _playerName:      string  = 'YOU';

  // Floor progression
  private _f1Cleared:       boolean = false;
  private _captiveTalked:   boolean = false;
  private _panelActivated:  boolean = false;
  private _descendTriggered:boolean = false;

  // For floor-descent reuse
  private _floorLabel!:     Phaser.GameObjects.Text;

  private _eKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'HarlanMineScene' });
  }

  create(): void {
    this._phase           = PHASE.ARRIVING;
    this._inputEnabled    = false;
    this._f1Cleared       = false;
    this._captiveTalked   = false;
    this._panelActivated  = false;
    this._descendTriggered = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawMine();
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this._buildPlayer();
    this._buildCamera();
    this._buildHUD();
    this._setupInteract();

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
      this._checkFloorTriggers();
      this._checkExit();
    }
  }

  // ─── World ────────────────────────────────────────────────────────────────

  private _drawMine(): void {
    const g = this.add.graphics();

    // Mine walls — dark stone
    g.fillStyle(0x0d0a08);
    g.fillRect(0, 0, MAP_W, MAP_H);

    // Floor
    g.fillStyle(0x1a1510);
    g.fillRect(0, 240, MAP_W, 180);

    // Ceiling struts
    g.fillStyle(0x2a2218);
    for (let x = 80; x < MAP_W; x += 140) {
      g.fillRect(x - 4, 220, 8, 60);
    }
    g.lineStyle(2, 0x332a20);
    g.lineBetween(0, 240, MAP_W, 240);
    g.lineBetween(0, 420, MAP_W, 420);

    // Mine cart rails (horizontal)
    g.lineStyle(2, 0x4a3a2a);
    g.lineBetween(0, 380, MAP_W, 380);
    g.lineBetween(0, 390, MAP_W, 390);

    // Ore deposits in walls
    g.fillStyle(0x3a5a3a, 0.5);
    g.fillRect(200, 200, 40, 20);
    g.fillRect(500, 200, 30, 15);
    g.fillRect(700, 200, 35, 18);

    // Dim work-lights
    for (const lx of [150, 400, 650]) {
      g.fillStyle(0x443322, 0.3);
      g.fillRect(lx - 4, 220, 8, 8);
      g.fillStyle(0x664422, 0.15);
      g.fillTriangle(lx - 60, 420, lx + 60, 420, lx, 228);
    }

    // Shaft opening (east end — descent)
    g.fillStyle(0x080808);
    g.fillRect(MAP_W - 40, 250, 40, 120);

    // Exit (west end)
    g.fillStyle(0x1a2a1a, 0.4);
    g.fillRect(0, EXIT_Y_TOP, 40, EXIT_Y_BOT - EXIT_Y_TOP);

    // Captive marker placeholder (floor 2)
    g.fillStyle(0x555555, 0.6);
    g.fillRect(CAPTIVE_X - 8, CAPTIVE_Y - 13, 16, 26);

    // Control panel (floor 3)
    g.fillStyle(0x334466);
    g.fillRect(PANEL_X - 20, PANEL_Y - 15, 40, 30);
    g.lineStyle(1, 0x4466aa);
    g.strokeRect(PANEL_X - 20, PANEL_Y - 15, 40, 30);
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
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'HARLAN MINE  ·  FLOOR 1', {
      fontFamily: 'monospace', fontSize: '10px', color: '#554433',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);

    this._floorLabel = this.add.text(width - 10, 10, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#554433',
    }).setScrollFactor(0).setDepth(21).setOrigin(1, 0);
    this._floorLabel.setVisible(false);
  }

  private _updateFloorLabel(floor: number): void {
    const { width } = this.scale;
    // Remove previous, redraw
    this.add.text(width - 10, 10, `HARLAN MINE  ·  FLOOR ${floor}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#554433',
    }).setScrollFactor(0).setDepth(21).setOrigin(1, 0);
  }

  // ─── Interact ────────────────────────────────────────────────────────────

  private _setupInteract(): void {
    this._eKey = this.input.keyboard!.addKey('E');
    document.addEventListener('interact:tap', this._onInteractTap);
    this.events.once('shutdown', () => {
      document.removeEventListener('interact:tap', this._onInteractTap);
    });
  }

  private readonly _onInteractTap = (): void => {
    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this._tryInteract();
    }
  };

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('ELIAS', D.arriving.elias, () => {
        this._phase = PHASE.FLOOR_ONE;
        this._inputEnabled = true;
        this._showHint('Floor 1. Head east. Watch the drone patterns.', 5000);
      });
    });
  }

  // ─── Floor trigger checks ─────────────────────────────────────────────────

  private _checkFloorTriggers(): void {
    const { x, y } = this.player.sprite;

    switch (this._phase) {
      case PHASE.FLOOR_ONE:
        // Floor 1 combat trigger happens via proximity or automatic on entry
        if (!this._f1Cleared && x > 300) {
          this._f1Cleared = true;
          this._triggerFloorOneCombat();
        }
        // Descent trigger at east end
        if (!this._descendTriggered && x > DESCENT_X) {
          this._descendTriggered = true;
          this._descend(2);
        }
        break;

      case PHASE.FLOOR_TWO:
        // Captive NPC
        if (!this._captiveTalked) {
          const dist = Math.hypot(x - CAPTIVE_X, y - CAPTIVE_Y);
          if (dist < INTERACT_DIST) {
            this.mobileControls.showInteract('Listen');
            if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
              this._talkCaptive();
            }
          } else {
            this.mobileControls.hideInteract();
          }
        }
        if (x > DESCENT_X && this._captiveTalked) {
          this._descend(3);
        }
        break;

      case PHASE.FLOOR_THREE:
        // Control panel
        if (!this._panelActivated) {
          const dist = Math.hypot(x - PANEL_X, y - PANEL_Y);
          if (dist < INTERACT_DIST) {
            this.mobileControls.showInteract('Activate');
            if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
              this._activatePanel();
            }
          } else {
            this.mobileControls.hideInteract();
          }
        }
        if (x > DESCENT_X && this._panelActivated) {
          this._descend(4);
        }
        break;

      case PHASE.FLOOR_FOUR:
        // Boss trigger (player approaches center)
        if (Math.hypot(x - BOSS_X, y - BOSS_Y) < 120) {
          this._triggerBoss();
        }
        break;

      default:
        break;
    }
  }

  // ─── Floor 1 encounter ───────────────────────────────────────────────────

  private _triggerFloorOneCombat(): void {
    this._inputEnabled = false;
    this.dialogMgr.show(this._playerName, D.floor_one.player, () => {
      this.dialogMgr.show('MAYA', D.floor_one.maya, () => {
        // Launch compliance swarm battle
        const initData: BattleInitData = {
          enemyKey:    'compliance_swarm',
          returnScene: 'HarlanMineScene',
          allies:      new PartyManager(this.registry).toAllyConfigs(),
        };
        bus.once(EVENTS.BATTLE_END, () => {
          this._inputEnabled = true;
          this._showHint('Head east to the descent shaft.', 3000);
        });
        this.scene.pause();
        this.scene.launch('BattleScene', initData);
      });
    });
  }

  // ─── Descent ─────────────────────────────────────────────────────────────

  private _descend(toFloor: number): void {
    this._descendTriggered = false;
    this._inputEnabled = false;
    this._updateFloorLabel(toFloor);

    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p < 1) return;
      // Reset player position
      this.player.sprite.setPosition(PLAYER_START_X, PLAYER_START_Y);

      const floorPhase: Phase =
        toFloor === 2 ? PHASE.FLOOR_TWO :
        toFloor === 3 ? PHASE.FLOOR_THREE :
        PHASE.FLOOR_FOUR;

      this._phase = floorPhase;

      this.cameras.main.fadeIn(400, 0, 0, 0, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          // Floor-specific dialogue
          if (toFloor === 2) {
            this.dialogMgr.show(this._playerName, D.captives_sighted.player, () => {
              this.dialogMgr.show('ELIAS', D.captives_sighted.elias, () => {
                this.dialogMgr.show('MAYA', D.captives_sighted.maya, () => {
                  this._inputEnabled = true;
                  this._showHint('Talk to the captive.', 4000);
                });
              });
            });
          } else if (toFloor === 3) {
            this.dialogMgr.show('ELIAS', D.floor_three_a.elias, () => {
              this.dialogMgr.show(this._playerName, D.floor_three_a.player, () => {
                this.dialogMgr.show('ELIAS', D.floor_three_b.elias, () => {
                  this._inputEnabled = true;
                  this._showHint('Find the control panel and deactivate the override.', 5000);
                });
              });
            });
          } else {
            // Floor 4
            this.dialogMgr.show(this._playerName, D.floor_four_descent.player, () => {
              this._inputEnabled = true;
              this._showHint('Floor 4. The Excavator is here.', 4000);
            });
          }
        }
      });
    });
  }

  // ─── Captive NPC ─────────────────────────────────────────────────────────

  private _talkCaptive(): void {
    if (this._captiveTalked) return;
    this._captiveTalked = true;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();
    this.dialogMgr.show('CAPTIVE', D.captive_one.captive, () => {
      this._inputEnabled = true;
      this._showHint('Head east to the next shaft.', 3000);
    });
  }

  // ─── Control panel ───────────────────────────────────────────────────────

  private _tryInteract(): void {
    if (this._phase === PHASE.FLOOR_TWO && !this._captiveTalked) {
      const dist = Math.hypot(
        this.player.sprite.x - CAPTIVE_X,
        this.player.sprite.y - CAPTIVE_Y,
      );
      if (dist < INTERACT_DIST) this._talkCaptive();
    } else if (this._phase === PHASE.FLOOR_THREE && !this._panelActivated) {
      const dist = Math.hypot(
        this.player.sprite.x - PANEL_X,
        this.player.sprite.y - PANEL_Y,
      );
      if (dist < INTERACT_DIST) this._activatePanel();
    }
  }

  private _activatePanel(): void {
    if (this._panelActivated) return;
    this._panelActivated = true;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();
    this.dialogMgr.show('MAYA', D.control_panel.maya, () => {
      this.dialogMgr.show(this._playerName, D.control_panel.player, () => {
        // Simulate 40-second timer with a brief delay for pacing
        this.time.delayedCall(2000, () => {
          this.dialogMgr.show('MAYA', D.control_panel_done.maya, () => {
            this.dialogMgr.show('ELIAS', D.control_panel_done.elias, () => {
              this._inputEnabled = true;
              this._showHint('Head east — descent to floor 4.', 4000);
            });
          });
        });
      });
    });
  }

  // ─── Boss ────────────────────────────────────────────────────────────────

  private _triggerBoss(): void {
    this._phase = PHASE.BOSS_BATTLE;
    this._inputEnabled = false;

    this.dialogMgr.show('SYSTEM', D.pre_boss.system, () => {
      const initData: BattleInitData = {
        enemyKey:    'excavator_prime',
        returnScene: 'HarlanMineScene',
        allies:      new PartyManager(this.registry).toAllyConfigs(),
        bossConfig: {
          phases: [
            { hpThreshold: 0.6, atkBoost: 8,  dialogue: [...D.boss_phase1.excavator] },
            { hpThreshold: 0.3, atkBoost: 6,  dialogue: [...D.boss_phase2.excavator] },
          ],
        },
      };

      bus.once(EVENTS.BATTLE_END, () => { this._onBossEnd(); });
      this.scene.pause();
      this.scene.launch('BattleScene', initData);
    });
  }

  private _onBossEnd(): void {
    this._phase = PHASE.POST_BOSS;
    this.dialogMgr.show(this._playerName, D.post_boss.player, () => {
      this.dialogMgr.show('ELIAS', D.post_boss.elias, () => {
        this._triggerWardenSix();
      });
    });
  }

  // ─── Warden Six ──────────────────────────────────────────────────────────

  private _triggerWardenSix(): void {
    this._phase = PHASE.WARDEN_SIX;
    this.dialogMgr.show('SYSTEM', D.warden_six_arrives.system, () => {
      this.dialogMgr.show('WARDEN SIX', D.warden_six_arrives.warden_six, () => {
        this._phase = PHASE.WARDEN_SIX_BATTLE;
        const initData: BattleInitData = {
          enemyKey:    'warden_six_ch1',
          returnScene: 'HarlanMineScene',
          allies:      new PartyManager(this.registry).toAllyConfigs(),
        };
        bus.once(EVENTS.BATTLE_END, () => { this._onWardenSixEnd(); });
        this.scene.pause();
        this.scene.launch('BattleScene', initData);
      });
    });
  }

  private _onWardenSixEnd(): void {
    setFlag(this.registry, SIX_BEATEN_CH1_FLAG, true);
    this._phase = PHASE.CAPTIVES_FREED;

    this.dialogMgr.show(this._playerName, D.post_warden_six.player, () => {
      this.dialogMgr.show('ELIAS', D.post_warden_six.elias, () => {
        this.dialogMgr.show('CAPTIVE', D.captives_freed.captive_lead, () => {
          this.dialogMgr.show(this._playerName, D.captives_freed.player, () => {
            this.dialogMgr.show('CAPTIVE', D.captives_freed.captive_lead2, () => {
              this._inputEnabled = true;
              this._showHint('Head west to the exit.', 4000);
            });
          });
        });
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.CAPTIVES_FREED) return;
    const { x, y } = this.player.sprite;
    if (x > EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;

    this.dialogMgr.show(this._playerName, D.exit_mine.player, () => {
      this.dialogMgr.show('MAYA', D.exit_mine.maya, () => {
        this.dialogMgr.show('ELIAS', D.exit_mine.elias, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
            if (p === 1) this.scene.start('MountainPassScene');
          });
        });
      });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 3000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#554433',
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

/**
 * MainframeCoreScene — Chapter 5, scene 3.
 *
 * Final dungeon. Elite enemies only. No random encounters. Survival drain stops here.
 * Critical beats:
 *   - ECHO_CURED flag → Hack Assist: auto-stun all enemies first combat
 *   - VAULT49_TERMINALS_READ flag tracked for Elise Phase 2 Elena reference
 *   - Warden Six Ch5 drops SIXS_CORE flag here (if gated fight wasn't in Perimeter)
 *   - Three scripted combat encounters before Boardroom Antechamber
 */
import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import D from '../../data/dialogue/chapter5/mainframe_core.json';
import {
  WARDEN_SIX_CH5_KEY,
  WARDEN_SIX_CH5_BOSS_CONFIG,
  WARDEN_SIX_GATE_FLAGS,
  WARDEN_SIX_DEFEAT_FLAG,
} from '../../entities/enemies/chapter5/index.js';
import { pauseMenu } from '../../ui/PauseMenu.js';

const MAP_W = 1800;
const MAP_H = 1400;

const PLAYER_START_X = 120;
const PLAYER_START_Y = MAP_H / 2;

// Trigger positions (scripted encounter gates)
const COMBAT1_X   = 450;
const COMBAT2_X   = 900;
const COMBAT3_X   = 1350; // may be Warden Six if not triggered in perimeter

const VAULT49_X   = 700;
const VAULT49_Y   = MAP_H / 2 - 100;

const EXIT_X   = MAP_W - 80;
const EXIT_Y_T = MAP_H / 2 - 100;
const EXIT_Y_B = MAP_H / 2 + 100;

const PHASE = {
  DESCENDING:  'DESCENDING',
  COMBAT1:     'COMBAT1',
  BETWEEN1_2:  'BETWEEN1_2',
  COMBAT2:     'COMBAT2',
  BETWEEN2_3:  'BETWEEN2_3',
  COMBAT3:     'COMBAT3',
  CLEARED:     'CLEARED',
  DONE:        'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

type CombatSlot = 1 | 2 | 3;

export class MainframeCoreScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = PHASE.DESCENDING;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'Arlo';
  private _combat1Done:   boolean = false;
  private _combat2Done:   boolean = false;
  private _combat3Done:   boolean = false;
  private _terminalRead:  boolean = false;
  private _echoAssist:    boolean = false;
  private _currentCombat: CombatSlot | null = null;
  private _sixsDropped:   boolean = false;

  constructor() {
    super({ key: 'MainframeCoreScene' });
  }

  create(): void {
    this._phase         = PHASE.DESCENDING;
    this._inputEnabled  = false;
    this._combat1Done   = false;
    this._combat2Done   = false;
    this._combat3Done   = false;
    this._terminalRead  = false;
    this._currentCombat = null;
    this._sixsDropped   = false;

    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    const flags = getFlags(this.registry);
    this._echoAssist = flags['ECHO_CURED'] === true;

    this._buildWorld();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.events.on('resume', (_sys: Phaser.Scene, data: { victory?: boolean }) => {
      this._onBattleResume(data?.victory ?? false);
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startDescent(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkTriggers();
      this._checkExit();
    }
  }

  // ─── World ───────────────────────────────────────────────────────────────

  private _buildWorld(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    const bg = this.add.graphics();
    // Deep blue/black server room
    bg.fillStyle(0x050d1a).fillRect(0, 0, MAP_W, MAP_H);
    // Server racks
    bg.fillStyle(0x0a1829);
    for (let col = 0; col < 8; col++) {
      bg.fillRect(200 + col * 200, 100, 80, MAP_H - 200);
    }
    // Blinking status lights
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 12; row++) {
        const lx = 230 + col * 200;
        const ly = 130 + row * 100;
        const light = this.add.circle(lx, ly, 3, 0x00ff44).setDepth(3);
        this.tweens.add({
          targets:  light,
          alpha:    0.1,
          duration: 800 + Math.random() * 1200,
          yoyo:     true,
          repeat:   -1,
        });
      }
    }

    // Corridor floor (central path)
    bg.fillStyle(0x0d1a2e);
    bg.fillRect(0, MAP_H / 2 - 44, MAP_W, 88);

    // Vault 49 terminal (interactive if VAULT49_TERMINALS_READ not already set)
    const terminal = this.add.rectangle(VAULT49_X, VAULT49_Y, 30, 40, 0x334466).setDepth(4);
    this.add.text(VAULT49_X, VAULT49_Y - 30, '[TERMINAL]', {
      fontFamily: 'monospace', fontSize: '7px', color: '#6699cc',
    }).setOrigin(0.5).setDepth(5);
    terminal.setInteractive();
    terminal.on('pointerdown', () => { this._onTerminalInteract(); });

    // Combat encounter markers
    this._placeEncounterMarker(COMBAT1_X, MAP_H / 2, 0);
    this._placeEncounterMarker(COMBAT2_X, MAP_H / 2, 1);
    this._placeEncounterMarker(COMBAT3_X, MAP_H / 2, 2);

    // Exit arrow
    this.add.text(MAP_W - 60, MAP_H / 2, '→\nANTECHAMBER', {
      fontFamily: 'monospace', fontSize: '8px', color: '#334455',
    }).setOrigin(0.5).setDepth(5);
  }

  private _placeEncounterMarker(x: number, y: number, _idx: number): void {
    const marker = this.add.rectangle(x, y, 20, 20, 0xff4400, 0.3).setDepth(3);
    this.tweens.add({
      targets:  marker,
      alpha:    0.6,
      duration: 900,
      yoyo:     true,
      repeat:   -1,
    });
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
    this.cameras.main.setZoom(1.6);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startDescent(): void {
    this.dialogMgr.show('DR. CHEN', D.descent.dr_chen, () => {
      this.dialogMgr.show('MAYA', D.descent.maya, () => {
        // Echo cured assistance
        if (this._echoAssist) {
          this.dialogMgr.show('MAYA', D.echo_cured_assist.maya, () => {
            this.dialogMgr.show('DR. CHEN', D.echo_cured_assist.dr_chen, () => {
              this._phase = PHASE.BETWEEN1_2;
              this._inputEnabled = true;
            });
          });
        } else {
          this._phase = PHASE.BETWEEN1_2;
          this._inputEnabled = true;
        }
      });
    });
  }

  private _onTerminalInteract(): void {
    if (this._terminalRead) return;
    this._terminalRead = true;
    this._inputEnabled = false;

    setFlag(this.registry, 'VAULT49_TERMINALS_READ', true);

    this.dialogMgr.show('SYSTEM', D.vault49_terminals.player_reads, () => {
      this.dialogMgr.show('MAYA', D.vault49_terminals.maya, () => {
        this.dialogMgr.show('DR. CHEN', D.vault49_terminals.dr_chen, () => {
          this.dialogMgr.show('JEROME', D.vault49_terminals.jerome, () => {
            this._inputEnabled = true;
          });
        });
      });
    });
  }

  // ─── Combat triggers ─────────────────────────────────────────────────────

  private _checkTriggers(): void {
    const px = this.player.sprite.x;

    if (!this._combat1Done && px > COMBAT1_X - 60) {
      this._combat1Done = true;
      this._inputEnabled = false;
      this._phase = PHASE.COMBAT1;
      this._triggerCombat(1);
    } else if (this._combat1Done && !this._combat2Done && px > COMBAT2_X - 60) {
      this._combat2Done = true;
      this._inputEnabled = false;
      this._phase = PHASE.COMBAT2;
      this._triggerCombat(2);
    } else if (this._combat2Done && !this._combat3Done && px > COMBAT3_X - 60) {
      this._combat3Done = true;
      this._inputEnabled = false;
      this._phase = PHASE.COMBAT3;
      this._triggerCombat(3);
    }
  }

  private _triggerCombat(slot: CombatSlot): void {
    this._currentCombat = slot;

    const flags = getFlags(this.registry);

    // Slot 3: Warden Six if gate flags are set AND not already defeated in perimeter
    const isWardenSix = slot === 3 &&
      flags[WARDEN_SIX_GATE_FLAGS[0]] === true &&
      flags[WARDEN_SIX_GATE_FLAGS[1]] === true &&
      flags[WARDEN_SIX_DEFEAT_FLAG] !== true;

    // Echo hack assist on first combat — auto-stun message
    if (slot === 1 && this._echoAssist) {
      this.dialogMgr.show('MAYA', D.first_combat_hack_assist.maya, () => {
        this._launchCombat(isWardenSix);
      });
    } else {
      this._launchCombat(isWardenSix);
    }
  }

  private _launchCombat(isWardenSix: boolean): void {
    if (isWardenSix) {
      this.scene.launch('BattleScene', {
        enemyKey:    WARDEN_SIX_CH5_KEY,
        returnScene: 'MainframeCoreScene',
        scripted:    true,
        bossConfig:  WARDEN_SIX_CH5_BOSS_CONFIG,
      });
    } else {
      this.scene.launch('BattleScene', {
        enemyKey:    'elite_security_bot',
        returnScene: 'MainframeCoreScene',
        scripted:    true,
      });
    }
    this.scene.pause();
  }

  private _onBattleResume(victory: boolean): void {
    if (!victory) {
      this.scene.restart();
      return;
    }

    const flags = getFlags(this.registry);

    // Handle Warden Six drop
    const isWardenSix = this._currentCombat === 3 &&
      flags[WARDEN_SIX_GATE_FLAGS[0]] === true &&
      flags[WARDEN_SIX_GATE_FLAGS[1]] === true &&
      !this._sixsDropped;

    if (isWardenSix) {
      this._sixsDropped = true;
      setFlag(this.registry, WARDEN_SIX_DEFEAT_FLAG, true);
      this.dialogMgr.show('MAYA', D.sixs_core_drop.maya, () => {
        this.dialogMgr.show(this._playerName, D.sixs_core_drop.player, () => {
          this._resumeAfterCombat();
        });
      });
    } else {
      this._resumeAfterCombat();
    }
  }

  private _resumeAfterCombat(): void {
    const slot = this._currentCombat;

    if (slot === 1) {
      this._phase = PHASE.BETWEEN1_2;
    } else if (slot === 2) {
      this._phase = PHASE.BETWEEN2_3;
      // Inner sanctum dialogue before third encounter
      this.dialogMgr.show('DR. CHEN', D.inner_sanctum.dr_chen, () => {
        this._inputEnabled = true;
      });
      return;
    } else if (slot === 3) {
      this._phase = PHASE.CLEARED;
    }

    this._inputEnabled = true;
    this._currentCombat = null;
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.CLEARED) return;

    const { x, y } = this.player.sprite;
    if (x < EXIT_X)  return;
    if (y < EXIT_Y_T || y > EXIT_Y_B) return;

    this._phase        = PHASE.DONE;
    this._inputEnabled = false;

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) {
        this.scene.start('BoardroomAntechamberScene');
      }
    });
  }
}

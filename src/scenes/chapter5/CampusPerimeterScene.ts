/**
 * CampusPerimeterScene — Chapter 5, scene 2.
 *
 * Party splits. Dr. Chen opens the back entrance.
 * Critical beats:
 *   - GHOST_KEY_OBTAINED flag skips one forced combat (sets USED_GHOST_KEY_CH5)
 *   - East-wing route triggers Lila Chen (§4 choice row)
 *   - Marcus silent beat-3: a door opens, he walks past, no dialogue
 *   - Warden Six Ch5 fight gated on SIX_BEATEN_CH1 && SIX_BEATEN_CH3
 */
import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import D from '../../data/dialogue/chapter5/campus_perimeter.json';
import { LILA_NPC }        from '../../entities/enemies/chapter5/lila.js';
import {
  WARDEN_SIX_CH5_KEY,
  WARDEN_SIX_CH5_BOSS_CONFIG,
  WARDEN_SIX_GATE_FLAGS,
  WARDEN_SIX_DEFEAT_FLAG,
} from '../../entities/enemies/chapter5/index.js';
import { pauseMenu } from '../../ui/PauseMenu.js';

const MAP_W = 2800;
const MAP_H = 1800;

const PLAYER_START_X = 120;
const PLAYER_START_Y = MAP_H / 2;

const EAST_WING_BRANCH_X = 1000;

// Marcus silent beat-3 — triggers once player crosses the corridor midpoint
const MARCUS_BEAT_X = 1400;

// Lila spawn position (east wing only)
const LILA_X = 1600;
const LILA_Y = MAP_H / 2 - 80;

// Warden Six position
const WARDEN_SIX_X = 1800;
const WARDEN_SIX_Y = MAP_H / 2;

// Mainframe Core entrance
const EXIT_X   = MAP_W - 80;
const EXIT_Y_T = MAP_H / 2 - 100;
const EXIT_Y_B = MAP_H / 2 + 100;

const PHASE = {
  ARRIVING:          'ARRIVING',
  EXPLORING:         'EXPLORING',
  MARCUS_BEAT:       'MARCUS_BEAT',
  LILA_ENCOUNTER:    'LILA_ENCOUNTER',
  COMBAT:            'COMBAT',
  PERIMETER_CLEARED: 'PERIMETER_CLEARED',
  DONE:              'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

export class CampusPerimeterScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:             Phase   = PHASE.ARRIVING;
  private _inputEnabled:      boolean = false;
  private _playerName:        string  = 'YOU';
  private _marcusBeatDone:    boolean = false;
  private _lilaTriggered:     boolean = false;
  private _wardenTriggered:   boolean = false;
  private _combatSkippedKey:  boolean = false;
  private _eastWingChosen:    boolean = false;
  private _lilaRect:          Phaser.GameObjects.Rectangle | null = null;
  private _marcusRect:        Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: 'CampusPerimeterScene' });
  }

  create(): void {
    this._phase           = PHASE.ARRIVING;
    this._inputEnabled    = false;
    this._marcusBeatDone  = false;
    this._lilaTriggered   = false;
    this._wardenTriggered = false;
    this._combatSkippedKey= false;
    this._eastWingChosen  = false;

    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    const flags = getFlags(this.registry);

    // Determine if ghost key is available and unused
    this._combatSkippedKey = (flags['GHOST_KEY_OBTAINED'] === true) &&
                             (flags['USED_GHOST_KEY_CH5'] !== true);

    this._buildWorld();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    // Listen for battle completion
    this.events.on('resume', (_sys: Phaser.Scene, data: { victory?: boolean }) => {
      this._onBattleResume(data?.victory ?? false);
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArrival(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkBeatTriggers();
      this._checkExit();
    }
  }

  // ─── World ───────────────────────────────────────────────────────────────

  private _buildWorld(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // Corporate campus exterior — glass and steel
    const bg = this.add.graphics();
    bg.fillStyle(0x111827).fillRect(0, 0, MAP_W, MAP_H);
    // Ground plane
    bg.fillStyle(0x1a2333).fillRect(0, MAP_H * 0.55, MAP_W, MAP_H * 0.45);

    // SI Inc. main building — massive, lit from within
    bg.fillStyle(0x1e3a5f);
    bg.fillRect(MAP_W - 800, 100, 700, MAP_H - 200);
    bg.fillStyle(0x3a6ea5);
    // Window grid
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 20; row++) {
        bg.fillRect(MAP_W - 760 + col * 62, 140 + row * 70, 44, 50);
      }
    }

    // Perimeter wall
    bg.lineStyle(3, 0x334455);
    bg.strokeRect(EAST_WING_BRANCH_X - 20, 200, MAP_W - EAST_WING_BRANCH_X - 180, MAP_H - 400);

    // East wing marker
    this.add.text(LILA_X - 40, LILA_Y - 60, 'EAST WING', {
      fontFamily: 'monospace', fontSize: '8px', color: '#445566',
    }).setDepth(4);

    // Corridor floor markings
    const road = this.add.graphics();
    road.fillStyle(0x222233);
    road.fillRect(0, MAP_H / 2 - 40, MAP_W, 80);

    // Place Lila NPC rect (only visible if east wing route)
    this._lilaRect = this.add.rectangle(LILA_X, LILA_Y, LILA_NPC.width, LILA_NPC.height, LILA_NPC.color)
      .setDepth(5).setVisible(false);

    this.add.text(LILA_X, LILA_Y - 20, LILA_NPC.name, {
      fontFamily: 'monospace', fontSize: '8px', color: '#cc9944',
    }).setOrigin(0.5).setDepth(6).setVisible(false).setName('lila_label');

    // Marcus placeholder — appears at the silent beat location
    this._marcusRect = this.add.rectangle(MARCUS_BEAT_X + 200, MAP_H / 2 - 60, 16, 26, 0x6688aa)
      .setDepth(5).setVisible(false);

    // Warden Six placeholder
    this.add.rectangle(WARDEN_SIX_X, WARDEN_SIX_Y, 60, 76, 0x334455)
      .setDepth(5).setVisible(true).setName('warden_six_rect');

    // Exit indicator
    this.add.text(MAP_W - 60, MAP_H / 2, '→\nCORE', {
      fontFamily: 'monospace', fontSize: '9px', color: '#334455',
    }).setOrigin(0.5).setDepth(5);
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

    this.dialogMgr.show('DR. CHEN', D.arrival.dr_chen, () => {
      this.dialogMgr.show('MAYA', D.arrival.maya, () => {
        this.dialogMgr.show('JEROME', D.arrival.jerome, () => {
          this._phase        = PHASE.EXPLORING;
          this._inputEnabled = true;
          // Show east wing route option
          this._showEastWingChoice();
        });
      });
    });
  }

  private _showEastWingChoice(): void {
    // Simple binary: east wing or main gate
    // East wing is presented as a text prompt; player walks toward LILA_X
    this._showHint('Take the east wing or press through the main gate?', 4000);
  }

  // ─── Proximity / beat triggers ───────────────────────────────────────────

  private _checkBeatTriggers(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Decide east-wing route by position
    if (!this._eastWingChosen && px > EAST_WING_BRANCH_X && py < MAP_H / 2 - 20) {
      this._eastWingChosen = true;
      setFlag(this.registry, 'EAST_WING_ROUTE_CHOSEN', true);
      this._lilaRect?.setVisible(true);
      const lilaLabel = this.children.getByName('lila_label') as Phaser.GameObjects.Text | null;
      lilaLabel?.setVisible(true);
    }

    // Marcus silent beat-3 — no dialogue. A door opens. He walks past.
    if (!this._marcusBeatDone && px > MARCUS_BEAT_X) {
      this._marcusBeatDone = true;
      this._triggerMarcusSilentBeat();
    }

    // Lila encounter (east wing route only)
    if (
      this._eastWingChosen &&
      !this._lilaTriggered &&
      Math.hypot(px - LILA_X, py - LILA_Y) < LILA_NPC.range
    ) {
      this._lilaTriggered   = true;
      this._inputEnabled    = false;
      this._triggerLilaDialogue();
    }

    // Warden Six encounter or ghost key skip
    if (!this._wardenTriggered && Math.hypot(px - WARDEN_SIX_X, py - WARDEN_SIX_Y) < 90) {
      this._wardenTriggered = true;
      this._inputEnabled    = false;
      this._triggerWardenSix();
    }
  }

  // ─── Marcus silent beat-3 ────────────────────────────────────────────────
  // CRITICAL: Zero dialogue lines. A door opens. He walks past.

  private _triggerMarcusSilentBeat(): void {
    this._inputEnabled = false;

    if (!this._marcusRect) {
      this._inputEnabled = true;
      return;
    }

    // Make Marcus visible on the other side of a corridor door
    this._marcusRect.setVisible(true);
    this._marcusRect.setPosition(MARCUS_BEAT_X + 200, MAP_H / 2 - 60);

    // Brief flash — door-opening effect (color flash on camera)
    this.cameras.main.flash(200, 220, 220, 240, false);

    // Marcus walks past — tween from right to left across the corridor then disappears
    this.tweens.add({
      targets:  this._marcusRect,
      x:        MARCUS_BEAT_X - 100,
      duration: 1800,
      ease:     'Linear',
      onComplete: () => {
        this._marcusRect?.setVisible(false);
        // Brief pause before returning control
        this.time.delayedCall(600, () => {
          this._inputEnabled = true;
          this._phase = PHASE.EXPLORING;
        });
      },
    });
  }

  // ─── Lila encounter ──────────────────────────────────────────────────────

  private _triggerLilaDialogue(): void {
    const flags = getFlags(this.registry);

    // Lila only appears on east-wing route
    if (!flags['EAST_WING_ROUTE_CHOSEN']) {
      this._inputEnabled = true;
      return;
    }

    // Show Lila's approach lines, then present the choice
    this.dialogMgr.show('LILA', D.lila.approach.lines, () => {
      this._showLilaChoiceMenu();
    });
  }

  private _showLilaChoiceMenu(): void {
    const { width, height } = this.scale;

    const options = [
      { label: D.lila.approach.choices[0]!.label, flag: 'LILA_CURED',            nextKey: 'cured_response' },
      { label: D.lila.approach.choices[1]!.label, flag: 'LILA_FOUGHT',           nextKey: 'fought_response' },
      { label: D.lila.approach.choices[2]!.label, flag: 'LILA_SEEN_NOT_ENGAGED', nextKey: 'seen_not_engaged_response' },
    ] as const;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4)
      .setScrollFactor(0).setDepth(40).setInteractive();

    const menuItems: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const item = this.add.text(width / 2, height / 2 - 40 + i * 38, opt.label, {
        fontFamily: 'monospace',
        fontSize:   '13px',
        color:      '#aaccee',
        stroke:     '#000000',
        strokeThickness: 2,
        align:      'center',
        wordWrap:   { width: width * 0.7 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(42).setInteractive();

      item.on('pointerover', () => { item.setColor('#ffffff'); });
      item.on('pointerout',  () => { item.setColor('#aaccee'); });
      item.on('pointerdown', () => {
        menuItems.forEach(m => m.destroy());
        overlay.destroy();
        this._onLilaChoice(opt.flag, opt.nextKey);
      });
      menuItems.push(item);
    });
  }

  private _onLilaChoice(
    flag: 'LILA_CURED' | 'LILA_FOUGHT' | 'LILA_SEEN_NOT_ENGAGED',
    nextKey: 'cured_response' | 'fought_response' | 'seen_not_engaged_response',
  ): void {
    setFlag(this.registry, flag, true);
    const responseData = D.lila[nextKey];
    this.dialogMgr.show('LILA', responseData.lines, () => {
      this._inputEnabled = true;
    });
  }

  // ─── Warden Six / Ghost Key ───────────────────────────────────────────────

  private _triggerWardenSix(): void {
    const flags = getFlags(this.registry);

    // Ghost key skips the combat entirely (one use)
    if (this._combatSkippedKey) {
      setFlag(this.registry, 'USED_GHOST_KEY_CH5', true);
      this.dialogMgr.show(this._playerName, D.ghost_key_used.player, () => {
        this.dialogMgr.show('SYSTEM', D.ghost_key_used.note, () => {
          this._inputEnabled = true;
        });
      });
      return;
    }

    // Warden Six Ch5 — gated on two prior victories
    const hasCh1Win = flags[WARDEN_SIX_GATE_FLAGS[0]] === true;
    const hasCh3Win = flags[WARDEN_SIX_GATE_FLAGS[1]] === true;

    if (hasCh1Win && hasCh3Win) {
      this.dialogMgr.show('MAYA', D.warden_six_approach.maya, () => {
        this.dialogMgr.show('JEROME', D.warden_six_approach.jerome, () => {
          this._phase = PHASE.COMBAT;
          this._launchWardenSixCombat();
        });
      });
    } else {
      // Standard forced combat with elite security bot
      this.dialogMgr.show('MAYA', D.forced_combat_entry.maya, () => {
        this.dialogMgr.show('JEROME', D.forced_combat_entry.jerome, () => {
          this._phase = PHASE.COMBAT;
          this._launchEliteSecurityCombat();
        });
      });
    }
  }

  private _launchWardenSixCombat(): void {
    this.scene.launch('BattleScene', {
      enemyKey:    WARDEN_SIX_CH5_KEY,
      returnScene: 'CampusPerimeterScene',
      scripted:    true,
      bossConfig:  WARDEN_SIX_CH5_BOSS_CONFIG,
    });
    this.scene.pause();
  }

  private _launchEliteSecurityCombat(): void {
    this.scene.launch('BattleScene', {
      enemyKey:    'elite_security_bot',
      returnScene: 'CampusPerimeterScene',
      scripted:    true,
    });
    this.scene.pause();
  }

  private _onBattleResume(victory: boolean): void {
    if (!victory) {
      // Defeat — reset to last checkpoint (re-enter scene)
      this.scene.restart();
      return;
    }

    // Set defeat flag for Warden Six Ch5
    const flags = getFlags(this.registry);
    const hasBothGates = (flags[WARDEN_SIX_GATE_FLAGS[0]] === true) &&
                         (flags[WARDEN_SIX_GATE_FLAGS[1]] === true);

    if (hasBothGates) {
      setFlag(this.registry, WARDEN_SIX_DEFEAT_FLAG, true);
    }

    this._phase        = PHASE.PERIMETER_CLEARED;
    this._inputEnabled = true;

    this.dialogMgr.show('MAYA', D.perimeter_cleared.maya, () => {
      this._inputEnabled = true;
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (
      this._phase !== PHASE.EXPLORING &&
      this._phase !== PHASE.PERIMETER_CLEARED
    ) return;

    const { x, y } = this.player.sprite;
    if (x < EXIT_X)  return;
    if (y < EXIT_Y_T || y > EXIT_Y_B) return;

    // Need Warden Six encounter resolved before exiting
    if (!this._wardenTriggered) return;

    this._phase        = PHASE.DONE;
    this._inputEnabled = false;

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) {
        this.scene.start('MainframeCoreScene');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

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

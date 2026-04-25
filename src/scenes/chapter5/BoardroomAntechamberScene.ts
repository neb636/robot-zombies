/**
 * BoardroomAntechamberScene — Chapter 5, scene 4.
 *
 * Mr. Gray stands at the antechamber entrance. The conditional 4th dialogue
 * option (MR_GRAY_TALKDOWN) appears only if convertedCured > convertedFought.
 *
 * Outcomes:
 *   MR_GRAY_TALKDOWN set → Elise's talk-down route is unlocked in BoardroomScene
 *   No path through antechamber blocked — Mr. Gray lets party pass after dialogue
 */
import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import D from '../../data/dialogue/chapter5/boardroom_antechamber.json';
import { MR_GRAY_NPC }     from '../../entities/enemies/chapter5/mrGrayNpc.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';

const MAP_W = 1000;
const MAP_H = 800;

const PLAYER_START_X = 100;
const PLAYER_START_Y = MAP_H / 2;

const GRAY_X = 500;
const GRAY_Y = MAP_H / 2;

const EXIT_X   = MAP_W - 80;
const EXIT_Y_T = MAP_H / 2 - 80;
const EXIT_Y_B = MAP_H / 2 + 80;

const PHASE = {
  ARRIVING:    'ARRIVING',
  EXPLORING:   'EXPLORING',
  GRAY_INITIAL:'GRAY_INITIAL',
  GRAY_CHOICE: 'GRAY_CHOICE',
  PRE_BOARD:   'PRE_BOARD',
  DONE:        'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

export class BoardroomAntechamberScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:        Phase   = PHASE.ARRIVING;
  private _inputEnabled: boolean = false;
  private _playerName:   string  = 'Arlo';
  private _grayTriggered:boolean = false;

  constructor() {
    super({ key: 'BoardroomAntechamberScene' });
  }

  create(): void {
    this._phase         = PHASE.ARRIVING;
    this._inputEnabled  = false;
    this._grayTriggered = false;

    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._buildWorld();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArrival(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkGrayProximity();
      this._checkExit();
    }
  }

  // ─── World ───────────────────────────────────────────────────────────────

  private _buildWorld(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    const bg = this.add.graphics();
    // Executive antechamber — polished, cold, clean
    bg.fillStyle(0x0c1520).fillRect(0, 0, MAP_W, MAP_H);
    bg.fillStyle(0x1a2840);
    bg.fillRect(0, MAP_H - 200, MAP_W, 200); // raised floor
    // Marble-like floor lines
    bg.lineStyle(1, 0x1e3050);
    for (let x = 0; x < MAP_W; x += 80) {
      bg.lineBetween(x, MAP_H - 200, x, MAP_H);
    }
    // Large door to Boardroom (locked, right side)
    bg.fillStyle(0x0a1020).fillRect(EXIT_X - 20, EXIT_Y_T - 20, 80, EXIT_Y_B - EXIT_Y_T + 40);
    bg.fillStyle(0x334455).fillRect(EXIT_X - 10, EXIT_Y_T - 10, 60, EXIT_Y_B - EXIT_Y_T + 20);
    this.add.text(EXIT_X + 10, MAP_H / 2, 'BOARDROOM', {
      fontFamily: 'monospace', fontSize: '7px', color: '#335577',
    }).setOrigin(0.5).setDepth(4);

    // Mr. Gray NPC
    this.add.rectangle(GRAY_X, GRAY_Y, MR_GRAY_NPC.width, MR_GRAY_NPC.height, MR_GRAY_NPC.color)
      .setDepth(5);
    this.add.text(GRAY_X, GRAY_Y - 22, MR_GRAY_NPC.name, {
      fontFamily: 'monospace', fontSize: '8px', color: '#8888aa',
    }).setOrigin(0.5).setDepth(6);

    // SI Inc. logos on walls
    for (let i = 0; i < 4; i++) {
      this.add.text(80 + i * 240, MAP_H / 2 - 100, 'SI', {
        fontFamily: 'monospace', fontSize: '28px', color: '#0d2040',
      }).setAlpha(0.6).setDepth(2);
    }
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

  private _startArrival(): void {
    this.dialogMgr.show('MAYA', D.arrival.maya, () => {
      this.dialogMgr.show('JEROME', D.arrival.jerome, () => {
        this.dialogMgr.show('DR. CHEN', D.arrival.dr_chen, () => {
          this._phase        = PHASE.EXPLORING;
          this._inputEnabled = true;
        });
      });
    });
  }

  // ─── Gray proximity ──────────────────────────────────────────────────────

  private _checkGrayProximity(): void {
    if (this._grayTriggered) return;

    const dist = Math.hypot(
      this.player.sprite.x - GRAY_X,
      this.player.sprite.y - GRAY_Y,
    );

    if (dist < MR_GRAY_NPC.range) {
      this._grayTriggered = true;
      this._inputEnabled  = false;
      this._phase         = PHASE.GRAY_INITIAL;
      this._triggerGrayInitial();
    }
  }

  private _triggerGrayInitial(): void {
    this.dialogMgr.show('MR. GRAY', D.gray_approach.lines, () => {
      this.dialogMgr.show('MR. GRAY', D.gray_dialogue.lines, () => {
        this._phase = PHASE.GRAY_CHOICE;
        this._triggerGrayFinal();
      });
    });
  }

  private _triggerGrayFinal(): void {
    this.dialogMgr.show('MR. GRAY', D['gray.final'].lines, () => {
      this._showGrayChoiceMenu();
    });
  }

  private _showGrayChoiceMenu(): void {
    const { width, height } = this.scale;

    const convertedCured  = (this.registry.get('convertedCured')  as number | undefined) ?? 0;
    const convertedFought = (this.registry.get('convertedFought') as number | undefined) ?? 0;
    const talkdownUnlocked = convertedCured > convertedFought;

    const rawChoices = D['gray.final'].choices;

    // Build option list — 4th option only if cured majority
    const options: Array<{
      label: string;
      flag:  string | null;
      nextKey: 'gray.acknowledge_response' | 'gray.condemn_response' | 'gray.talkdown_response';
    }> = [
      { label: rawChoices[0]!.label, flag: null,               nextKey: 'gray.acknowledge_response' },
      { label: rawChoices[1]!.label, flag: null,               nextKey: 'gray.condemn_response' },
    ];

    if (talkdownUnlocked) {
      options.push({
        label:   rawChoices[2]!.label,
        flag:    MR_GRAY_NPC.choiceFlags.MR_GRAY_TALKDOWN,
        nextKey: 'gray.talkdown_response',
      });
    }

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4)
      .setScrollFactor(0).setDepth(40).setInteractive();

    const menuItems: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const item = this.add.text(
        width / 2,
        height / 2 - 40 + i * 44,
        opt.label,
        {
          fontFamily: 'monospace',
          fontSize:   '13px',
          color:      '#aaccee',
          stroke:     '#000000',
          strokeThickness: 2,
          align:      'center',
          wordWrap:   { width: width * 0.7 },
        },
      ).setOrigin(0.5).setScrollFactor(0).setDepth(42).setInteractive();

      item.on('pointerover', () => { item.setColor('#ffffff'); });
      item.on('pointerout',  () => { item.setColor('#aaccee'); });
      item.on('pointerdown', () => {
        menuItems.forEach(m => m.destroy());
        overlay.destroy();
        if (opt.flag) setFlag(this.registry, opt.flag, true);
        this._onGrayChoice(opt.nextKey);
      });
      menuItems.push(item);
    });
  }

  private _onGrayChoice(
    nextKey: 'gray.acknowledge_response' | 'gray.condemn_response' | 'gray.talkdown_response',
  ): void {
    const responseData = D[nextKey];
    this.dialogMgr.show('MR. GRAY', responseData.lines, () => {
      this._phase = PHASE.PRE_BOARD;
      this._triggerPreBoardroom();
    });
  }

  private _triggerPreBoardroom(): void {
    this.dialogMgr.show('MAYA', D.before_boardroom.maya, () => {
      this.dialogMgr.show('JEROME', D.before_boardroom.jerome, () => {
        this.dialogMgr.show('DR. CHEN', D.before_boardroom.dr_chen, () => {
          this._inputEnabled = true;
        });
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.PRE_BOARD) return;

    const { x, y } = this.player.sprite;
    if (x < EXIT_X)  return;
    if (y < EXIT_Y_T || y > EXIT_Y_B) return;

    this._phase        = PHASE.DONE;
    this._inputEnabled = false;

    this.cameras.main.fadeOut(1200, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) {
        this.scene.start('BoardroomScene');
      }
    });
  }
}

import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { getFlags, setFlag } from '../../utils/constants.js';
import { ELENA_ORTEGA }    from '../../characters/elena.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import D from '../../data/dialogue/chapter2/vault_49.json';

// ─── Layout constants ──────────────────────────────────────────────────────────
const MAP_W = 1600;
const MAP_H = 1000;

const PLAYER_START_X = 200;
const PLAYER_START_Y = 500;

const SAM_X = 500;
const SAM_Y = 400;

// Terminal positions
const TERMINAL_A_X = 850;
const TERMINAL_A_Y = 300;
const TERMINAL_B_X = 1050;
const TERMINAL_B_Y = 300;
const TERMINAL_C_X = 950;
const TERMINAL_C_Y = 500;
const TERMINAL_D_X = 950;  // Tilly's father terminal — gated
const TERMINAL_D_Y = 680;

const GOVERNOR_TRIGGER_X = 1400;
const GOVERNOR_TRIGGER_Y = 500;

const EXIT_X     = 1550;
const EXIT_Y_TOP = 200;
const EXIT_Y_BOT = 800;

// ─── Phases ───────────────────────────────────────────────────────────────────
const PHASE = {
  ARRIVING:       'ARRIVING',
  EXPLORING:      'EXPLORING',
  GOVERNOR_FIGHT: 'GOVERNOR_FIGHT',
  POST_GOVERNOR:  'POST_GOVERNOR',
  DEPARTING:      'DEPARTING',
  DONE:           'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

type TerminalId = 'A' | 'B' | 'C' | 'D';

/**
 * Vault49Scene — Chapter 2: "Vault 49"
 *
 * Cold War bunker repurposed by survivors. The safest place in the game.
 * Elena Ortega's terminal recordings reveal SI Inc.'s full plan.
 * Sam Chen cameo (SAM_MET_VAULT49 set).
 * The Governor arrives for a boss fight (human tier, Organic only).
 * Tilly's father recording gated on TILLY_TRUSTED flag.
 */
export class Vault49Scene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:          Phase   = PHASE.ARRIVING;
  private _inputEnabled:   boolean = false;
  private _playerName:     string  = 'YOU';

  private _samTriggered:   boolean = false;
  private _terminalsRead:  Set<TerminalId> = new Set();
  private _governorFought: boolean = false;

  // Terminal rect refs for visual feedback
  private _terminalRects: Map<TerminalId, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'Vault49Scene' });
  }

  create(): void {
    this._phase          = PHASE.ARRIVING;
    this._inputEnabled   = false;
    this._samTriggered   = false;
    this._terminalsRead  = new Set();
    this._governorFought = false;
    this._terminalRects  = new Map();
    this._playerName     = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawScene();
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();
    this._setupInteract();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(1300, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;
    if (this._inputEnabled && !this.dialogMgr.isActive()) {
      this.player.update();
      this._checkProximity();
      this._checkGovernorTrigger();
      this._checkExit();
    }
  }

  // ─── Scene drawing ──────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Bunker interior — concrete grey-green
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x0d1410).setDepth(0);

    // Main hall floor
    this.add.rectangle(MAP_W / 2, MAP_H * 0.55, MAP_W * 0.9, MAP_H * 0.7, 0x141c18)
      .setDepth(1);

    // Walls
    this.add.rectangle(MAP_W / 2, 80,           MAP_W, 80, 0x1a2220).setDepth(2);
    this.add.rectangle(MAP_W / 2, MAP_H - 80,   MAP_W, 80, 0x1a2220).setDepth(2);
    this.add.rectangle(60,         MAP_H / 2,   120, MAP_H, 0x1a2220).setDepth(2);
    this.add.rectangle(MAP_W - 60, MAP_H / 2,   120, MAP_H, 0x1a2220).setDepth(2);

    // Terminal room separator
    this.add.rectangle(MAP_W * 0.58, MAP_H * 0.4, 6, MAP_H * 0.6, 0x2a3a30).setDepth(3);

    // Terminals
    const terminalData: Array<{ id: TerminalId; x: number; y: number; label: string }> = [
      { id: 'A', x: TERMINAL_A_X, y: TERMINAL_A_Y, label: 'TERMINAL A' },
      { id: 'B', x: TERMINAL_B_X, y: TERMINAL_B_Y, label: 'TERMINAL B' },
      { id: 'C', x: TERMINAL_C_X, y: TERMINAL_C_Y, label: 'TERMINAL C' },
      { id: 'D', x: TERMINAL_D_X, y: TERMINAL_D_Y, label: 'TERMINAL D ?' },
    ];

    for (const t of terminalData) {
      const rect = this.add.rectangle(t.x, t.y, 28, 36, t.id === 'D' ? 0x1a1a2a : 0x1a3a2a)
        .setDepth(4).setInteractive();
      this._terminalRects.set(t.id, rect);

      this.add.text(t.x, t.y - 26, t.label, {
        fontFamily: 'monospace', fontSize: '7px',
        color: t.id === 'D' ? '#554466' : '#44aa66',
      }).setOrigin(0.5).setDepth(5);

      // Tap/click on terminal rect
      rect.on('pointerdown', () => { this._interactTerminal(t.id); });
    }

    // Vault lore boards
    this.add.text(200, 180, 'VAULT 49\nOPERATIONAL', {
      fontFamily: 'monospace', fontSize: '10px', color: '#446644', align: 'center',
    }).setOrigin(0.5).setDepth(4);

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
  }

  // ─── Player ──────────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  // ─── NPCs ────────────────────────────────────────────────────────────────────

  private _buildNPCs(): void {
    // Sam
    this.add.rectangle(SAM_X, SAM_Y, 16, 28, 0x6688aa).setDepth(5);
    this.add.text(SAM_X, SAM_Y - 24, 'SAM', {
      fontFamily: 'monospace', fontSize: '8px', color: '#6688aa',
    }).setOrigin(0.5).setDepth(6);

    // Vault residents (background detail)
    const residents = [
      { x: 350, y: 650 }, { x: 450, y: 700 }, { x: 300, y: 750 },
    ];
    for (const r of residents) {
      this.add.rectangle(r.x, r.y, 14, 22, 0x445544).setDepth(4);
    }
  }

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.7);
  }

  // ─── Interact setup ──────────────────────────────────────────────────────────

  private _setupInteract(): void {
    this.input.keyboard!.on('keydown-E', () => { this._tryInteract(); });
    const handler = (): void => { this._tryInteract(); };
    document.addEventListener('interact:tap', handler);
    this.events.once('shutdown', () => {
      document.removeEventListener('interact:tap', handler);
    });
  }

  private _tryInteract(): void {
    if (!this._inputEnabled || this.dialogMgr.isActive()) return;

    // Sam
    if (!this._samTriggered) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, SAM_X, SAM_Y,
      );
      if (dist < 80) {
        this._samTriggered = true;
        this._inputEnabled = false;
        this.mobileControls.hideInteract();
        this._triggerSam();
        return;
      }
    }

    // Terminals (proximity)
    const termPositions: Array<{ id: TerminalId; x: number; y: number }> = [
      { id: 'A', x: TERMINAL_A_X, y: TERMINAL_A_Y },
      { id: 'B', x: TERMINAL_B_X, y: TERMINAL_B_Y },
      { id: 'C', x: TERMINAL_C_X, y: TERMINAL_C_Y },
      { id: 'D', x: TERMINAL_D_X, y: TERMINAL_D_Y },
    ];

    for (const t of termPositions) {
      if (this._terminalsRead.has(t.id)) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, t.x, t.y,
      );
      if (dist < 70) {
        this._interactTerminal(t.id);
        return;
      }
    }
  }

  // ─── Proximity hints ─────────────────────────────────────────────────────────

  private _checkProximity(): void {
    let near = false;

    if (!this._samTriggered) {
      const d = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, SAM_X, SAM_Y,
      );
      if (d < 80) near = true;
    }

    const termPositions: Array<{ id: TerminalId; x: number; y: number }> = [
      { id: 'A', x: TERMINAL_A_X, y: TERMINAL_A_Y },
      { id: 'B', x: TERMINAL_B_X, y: TERMINAL_B_Y },
      { id: 'C', x: TERMINAL_C_X, y: TERMINAL_C_Y },
      { id: 'D', x: TERMINAL_D_X, y: TERMINAL_D_Y },
    ];

    for (const t of termPositions) {
      if (this._terminalsRead.has(t.id)) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, t.x, t.y,
      );
      if (dist < 70) near = true;
    }

    if (near) {
      this.mobileControls.showInteract('Read / Talk');
    } else {
      this.mobileControls.hideInteract();
    }
  }

  // ─── Arriving ────────────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;
    this.dialogMgr.show('GUARD', D.arriving.guard as string[], () => {
      this.dialogMgr.show('DEJA', D.arriving.deja as string[], () => {
        this._phase = PHASE.EXPLORING;
        this._inputEnabled = true;
        this._showHint('Talk to Sam. Read the terminals. [E / tap]', 6000);
      });
    });
  }

  // ─── Sam ─────────────────────────────────────────────────────────────────────

  private _triggerSam(): void {
    setFlag(this.registry, 'SAM_MET_VAULT49', true);

    const flags = getFlags(this.registry);
    const allRead = (
      flags[ELENA_ORTEGA.terminalFlags.seq1] &&
      flags[ELENA_ORTEGA.terminalFlags.seq2] &&
      flags[ELENA_ORTEGA.terminalFlags.seq3]
    );

    if (allRead) {
      this.dialogMgr.show('SAM', D.sam.cameo.after_terminals as string[], () => {
        this._inputEnabled = true;
      });
    } else {
      this.dialogMgr.show('SAM', D.sam.cameo.intro as string[], () => {
        this._loreConversation();
      });
    }
  }

  private _loreConversation(): void {
    this.dialogMgr.show('SAM', D.vault_lore.sam_explains as string[], () => {
      this.dialogMgr.show('DEJA', D.vault_lore.deja_reaction as string[], () => {
        this.dialogMgr.show('SAM', D.vault_lore.sam_answer as string[], () => {
          this._inputEnabled = true;
        });
      });
    });
  }

  // ─── Terminals ────────────────────────────────────────────────────────────────

  private _interactTerminal(id: TerminalId): void {
    if (!this._inputEnabled || this.dialogMgr.isActive()) return;
    if (this._terminalsRead.has(id)) return;

    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    if (id === 'D') {
      this._readTerminalD();
      return;
    }

    const termData = {
      A: { flag: ELENA_ORTEGA.terminalFlags.seq1, data: D.terminals.seq_1 },
      B: { flag: ELENA_ORTEGA.terminalFlags.seq2, data: D.terminals.seq_2 },
      C: { flag: ELENA_ORTEGA.terminalFlags.seq3, data: D.terminals.seq_3 },
    }[id];

    const label = termData.data.label;
    const lines = termData.data.lines as string[];

    this.dialogMgr.show(label, lines, () => {
      setFlag(this.registry, termData.flag, true);
      this._terminalsRead.add(id);

      // Mark terminal as read visually
      const rect = this._terminalRects.get(id);
      if (rect) rect.setFillStyle(0x1a5a3a);

      this._checkTerminalCompletion();
      this._inputEnabled = true;
    });
  }

  private _readTerminalD(): void {
    const flags = getFlags(this.registry);
    if (!flags['TILLY_TRUSTED']) {
      // Gated — show flavour text only
      this.dialogMgr.show('NARRATOR', [D.terminals.tilly_father.gate_message], () => {
        this._inputEnabled = true;
      });
      return;
    }

    const lines = D.terminals.tilly_father.lines as string[];
    this.dialogMgr.show(D.terminals.tilly_father.label, lines, () => {
      setFlag(this.registry, ELENA_ORTEGA.terminalFlags.tillyFather, true);
      setFlag(this.registry, ELENA_ORTEGA.tillyFatherFlag, true);
      this._terminalsRead.add('D');

      const rect = this._terminalRects.get('D');
      if (rect) rect.setFillStyle(0x2a2a4a);

      this._inputEnabled = true;
    });
  }

  private _checkTerminalCompletion(): void {
    if (
      this._terminalsRead.has('A') &&
      this._terminalsRead.has('B') &&
      this._terminalsRead.has('C')
    ) {
      setFlag(this.registry, ELENA_ORTEGA.completionFlag, true);
      // Governor arrives after terminals are all read
      this.time.delayedCall(2000, () => {
        if (!this._governorFought) {
          this._phase = PHASE.GOVERNOR_FIGHT;
          this._triggerGovernorFight();
        }
      });
    }
  }

  // ─── Governor fight ──────────────────────────────────────────────────────────

  private _checkGovernorTrigger(): void {
    // Governor triggers after all three terminals are read (handled in _checkTerminalCompletion)
    // This check is for if the player somehow reaches the trigger zone without reading them.
    if (this._governorFought) return;
    if (this._phase === PHASE.GOVERNOR_FIGHT) return;

    const dist = Phaser.Math.Distance.Between(
      this.player.sprite.x, this.player.sprite.y,
      GOVERNOR_TRIGGER_X, GOVERNOR_TRIGGER_Y,
    );

    if (dist < 100) {
      const flags = getFlags(this.registry);
      if (flags[ELENA_ORTEGA.completionFlag]) {
        this._phase = PHASE.GOVERNOR_FIGHT;
        this._triggerGovernorFight();
      }
    }
  }

  private _triggerGovernorFight(): void {
    if (this._governorFought) return;
    this._governorFought = true;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    const preFight = D.governor_boss.pre_fight as string[];
    this.dialogMgr.show('THE GOVERNOR', preFight, () => {
      const initData: BattleInitData = {
        enemyKey:    'the_governor',
        returnScene: 'Vault49Scene',
        scripted:    false,
        bossConfig: {
          phases: [
            {
              hpThreshold: 0.6,
              atkBoost:    4,
              dialogue:    D.governor_boss.phase_lines.slice(0, 2) as string[],
            },
            {
              hpThreshold: 0.3,
              atkBoost:    6,
              dialogue:    D.governor_boss.phase_lines.slice(2) as string[],
            },
          ],
        },
      };
      this.scene.launch('BattleScene', initData);
      this.scene.pause();

      this.events.once('resume', () => {
        this._postGovernorFight();
      });
    });
  }

  private _postGovernorFight(): void {
    this._phase = PHASE.POST_GOVERNOR;
    setFlag(this.registry, 'GOVERNOR_DEFEATED', true);

    this.dialogMgr.show('THE GOVERNOR', D.governor_boss.post_fight as string[], () => {
      this.dialogMgr.show('SAM', D.departure.sam as string[], () => {
        this.dialogMgr.show('DEJA', D.departure.deja as string[], () => {
          this._phase = PHASE.DEPARTING;
          this._inputEnabled = true;
          this._showHint('Head west — exit the vault.', 5000);
        });
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.DEPARTING) return;
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    this.cameras.main.fadeOut(1200, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('WorldMapScene');
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#448866',
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

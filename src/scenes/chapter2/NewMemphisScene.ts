import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { PartyManager }    from '../../party/PartyManager.js';
import { setFlag }         from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import D from '../../data/dialogue/chapter2/new_memphis.json';

// ─── Layout constants ──────────────────────────────────────────────────────────
const MAP_W = 1600;
const MAP_H = 1200;

const PLAYER_START_X = 200;
const PLAYER_START_Y = 600;

const DEJA_X = 900;
const DEJA_Y = 550;

const GOVERNOR_OFFICE_X = 1400;
const GOVERNOR_OFFICE_Y = 600;

const EXIT_X = 1500;
const EXIT_Y_TOP = 400;
const EXIT_Y_BOT = 800;

// NPC positions
const NPCS = [
  { x: 400,  y: 480, label: 'MUSICIAN' },
  { x: 620,  y: 700, label: 'VENDOR'   },
  { x: 1100, y: 400, label: 'WATCHER'  },
] as const;

// ─── Phase enum ───────────────────────────────────────────────────────────────
const PHASE = {
  ARRIVING:      'ARRIVING',
  EXPLORING:     'EXPLORING',
  DEJA_DIALOGUE: 'DEJA_DIALOGUE',
  DEJA_JOINED:   'DEJA_JOINED',
  DONE:          'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * NewMemphisScene — Chapter 2: "Sweet Home"
 *
 * New Memphis struck a deal: humans perform "cultural outputs" (jazz, cooking)
 * in exchange for survival. Deja is recruited here. The Governor presides.
 * The zone is unsettling because it works.
 */
export class NewMemphisScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = PHASE.ARRIVING;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'Arlo';

  private _dejaTriggered:     boolean = false;
  private _npcsTalked:        Set<number> = new Set();
  private _governorApproach:  boolean = false;

  constructor() {
    super({ key: 'NewMemphisScene' });
  }

  create(): void {
    this._phase           = PHASE.ARRIVING;
    this._inputEnabled    = false;
    this._dejaTriggered   = false;
    this._governorApproach = false;
    this._npcsTalked      = new Set();
    this._playerName      = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._drawScene();
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.time.delayedCall(1100, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;
    if (this._inputEnabled && !this.dialogMgr.isActive()) {
      this.player.update();
      this._checkProximity();
      this._checkExit();
    }
  }

  // ─── Scene drawing ──────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Sky
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x1a1018).setDepth(0);
    // Street level amber glow — artificial but warm
    this.add.rectangle(MAP_W / 2, MAP_H - 100, MAP_W, 200, 0x2a1a0a).setDepth(0);

    // Buildings — intact, that's the horror
    const buildings = [
      { x: 300, y: 200, w: 180, h: 300 },
      { x: 700, y: 150, w: 220, h: 350 },
      { x: 1100, y: 180, w: 200, h: 320 },
      { x: 1400, y: 100, w: 280, h: 400 },
    ];
    for (const b of buildings) {
      this.add.rectangle(b.x, b.y, b.w, b.h, 0x2a2035).setDepth(1);
      // Lit windows
      for (let wy = b.y - b.h / 2 + 30; wy < b.y + b.h / 2 - 20; wy += 40) {
        for (let wx = b.x - b.w / 2 + 20; wx < b.x + b.w / 2 - 10; wx += 35) {
          const lit = Math.random() > 0.3;
          this.add.rectangle(wx, wy, 12, 18, lit ? 0xffe8a0 : 0x111118).setDepth(2);
        }
      }
    }

    // Street
    this.add.rectangle(MAP_W / 2, MAP_H - 50, MAP_W, 100, 0x1a1520).setDepth(1);

    // Jazz corner marker
    this.add.text(380, 440, '♪ JAZZ QUARTER ♪', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffe880',
    }).setOrigin(0.5).setDepth(4);

    // Governor's Office
    this.add.rectangle(GOVERNOR_OFFICE_X, GOVERNOR_OFFICE_Y, 160, 200, 0x0a1040).setDepth(2);
    this.add.text(GOVERNOR_OFFICE_X, GOVERNOR_OFFICE_Y - 120, "GOVERNOR'S OFFICE", {
      fontFamily: 'monospace', fontSize: '8px', color: '#8888cc',
    }).setOrigin(0.5).setDepth(4);

    // Physics world
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
    // Ambient NPCs
    NPCS.forEach((npc, _i) => {
      const color = npc.label === 'WATCHER' ? 0x6688aa : 0x886644;
      this.add.rectangle(npc.x, npc.y, 14, 24, color).setDepth(5);
      this.add.text(npc.x, npc.y - 20, npc.label, {
        fontFamily: 'monospace', fontSize: '7px', color: '#887766',
      }).setOrigin(0.5).setDepth(6);
    });

    // Deja
    this.add.rectangle(DEJA_X, DEJA_Y, 16, 26, 0xcc4488).setDepth(5);
    this.add.text(DEJA_X, DEJA_Y - 22, 'DEJA', {
      fontFamily: 'monospace', fontSize: '8px', color: '#cc4488',
    }).setOrigin(0.5).setDepth(6);

    // Interaction prompt: tap or press E
    this.input.keyboard!.on('keydown-E', () => { this._tryInteract(); });
    document.addEventListener('interact:tap', () => { this._tryInteract(); });
    this.events.once('shutdown', () => {
      document.removeEventListener('interact:tap', () => { this._tryInteract(); });
    });
  }

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.8);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;
    this.dialogMgr.show('MAYA', D.arriving.maya, () => {
      this.dialogMgr.show(this._playerName, D.arriving.player, () => {
        this.dialogMgr.show('NARRATOR', D.city_center.observation, () => {
          this._phase = PHASE.EXPLORING;
          this._inputEnabled = true;
          this._showHint('Find Deja. Explore the quarter. [E / tap] to interact.', 6000);
        });
      });
    });
  }

  // ─── Proximity & interaction ─────────────────────────────────────────────────

  private _tryInteract(): void {
    if (!this._inputEnabled || this.dialogMgr.isActive()) return;

    NPCS.forEach((npc, i) => {
      if (this._npcsTalked.has(i)) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, npc.x, npc.y,
      );
      if (dist < 70) {
        this._npcsTalked.add(i);
        this._inputEnabled = false;
        this.mobileControls.hideInteract();
        const lines = D.npcs[npc.label.toLowerCase() as keyof typeof D.npcs] ?? [];
        this.dialogMgr.show(npc.label, lines as string[], () => {
          this._inputEnabled = true;
        });
      }
    });
  }

  private _checkProximity(): void {
    // Show interact hint near NPCs
    let near = false;
    NPCS.forEach((npc, i) => {
      if (this._npcsTalked.has(i)) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, npc.x, npc.y,
      );
      if (dist < 70) near = true;
    });
    if (near) {
      this.mobileControls.showInteract('Talk');
    } else {
      this.mobileControls.hideInteract();
    }

    // Deja trigger
    if (!this._dejaTriggered && this._phase === PHASE.EXPLORING) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, DEJA_X, DEJA_Y,
      );
      if (dist < 80) {
        this._dejaTriggered = true;
        this._inputEnabled  = false;
        this.mobileControls.hideInteract();
        this._triggerDejaDialogue();
      }
    }

    // Governor approach hint
    if (
      !this._governorApproach &&
      this._phase === PHASE.DEJA_JOINED
    ) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        GOVERNOR_OFFICE_X, GOVERNOR_OFFICE_Y,
      );
      if (dist < 120) {
        this._governorApproach = true;
        this._inputEnabled = false;
        this.mobileControls.hideInteract();
        this._triggerGovernorApproach();
      }
    }
  }

  // ─── Deja dialogue ────────────────────────────────────────────────────────────

  private _triggerDejaDialogue(): void {
    this.dialogMgr.show('DEJA', D.deja_meet.deja as string[], () => {
      this.dialogMgr.show(this._playerName, D.deja_meet.player as string[], () => {
        this.dialogMgr.show('DEJA', D.deja_meet.deja2 as string[], () => {
          this.dialogMgr.show(this._playerName, D.deja_meet.player2 as string[], () => {
            this.dialogMgr.show('DEJA', D.deja_meet.deja3 as string[], () => {
              this._dejaJoins();
            });
          });
        });
      });
    });
  }

  private _dejaJoins(): void {
    setFlag(this.registry, 'DEJA_RECRUITED', true);
    new PartyManager(this.registry).addMember('deja', 2);

    this.dialogMgr.show('NARRATOR', D.deja_join.text as string[], () => {
      const { width, height } = this.scale;
      const joinText = this.add.text(width / 2, height / 2, 'DEJA joined the party.', {
        fontFamily: 'monospace',
        fontSize:   '16px',
        color:      '#cc4488',
        stroke:     '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

      this.tweens.add({
        targets:  joinText,
        alpha:    { from: 0, to: 1 },
        duration: 600,
        yoyo:     true,
        hold:     1400,
        onComplete: () => {
          joinText.destroy();
          this._phase = PHASE.DEJA_JOINED;
          this._inputEnabled = true;
          this._showHint('Explore or head toward the Governor\'s Office.', 5000);
        },
      });
    });
  }

  // ─── Governor approach ────────────────────────────────────────────────────────

  private _triggerGovernorApproach(): void {
    this.dialogMgr.show('MAYA', D.governor_approach.maya as string[], () => {
      this.dialogMgr.show('DEJA', D.governor_approach.deja as string[], () => {
        this._inputEnabled = true;
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.DEJA_JOINED) return;
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('MississippiCrossingScene');
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#8866aa',
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

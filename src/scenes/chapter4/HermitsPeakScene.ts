import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import { PartyManager }    from '../../party/PartyManager.js';
import type { WasdKeys }   from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter4/rockies.json';

const FLAG_CHEN_RECRUITED = 'dr_chen_recruited';
const FLAG_PEAK_ENTERED   = 'hermits_peak_entered';

const MAP_W = 1000;
const MAP_H =  700;

const PLAYER_START_X = 120;
const PLAYER_START_Y = 420;

/** Bunker door / Chen's position. */
const CHEN_X = 740;
const CHEN_Y = 350;
const CHEN_RANGE = 100;

/** Lore terminal positions (optional interactables — backstory about SI Inc.). */
const TERMINAL_POS = [
  { x: 560, y: 280 },
  { x: 840, y: 260 },
] as const;
const TERMINAL_RANGE = 70;

/** Exit east — leads to ThePassScene. */
const EXIT_X_THRESHOLD = MAP_W - 80;

const PHASE = {
  ARRIVING:        'ARRIVING',
  EXPLORING:       'EXPLORING',
  CHEN_DIALOGUE:   'CHEN_DIALOGUE',
  CHEN_RECRUITED:  'CHEN_RECRUITED',
  DONE:            'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * HermitsPeakScene — Ch.4, Node 3. Dr. Chen's bunker above the snowline.
 *
 * Critical beat: Dr. Chen recruitment (PartyManager.addMember('drchen', 4)).
 * Sets FLAG_CHEN_RECRUITED so the Echo subplot can unlock in HighAltitudeCampScene
 * (retroactive — Echo can be encountered on return or via chapter state).
 *
 * Two optional lore terminals with SI Inc. history.
 * Exit east to ThePassScene only after Chen is recruited.
 */
export class HermitsPeakScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:          Phase   = PHASE.ARRIVING;
  private _inputEnabled:   boolean = false;
  private _playerName:     string  = 'YOU';
  private _chenTriggered:  boolean = false;
  private _interactKey!:   Phaser.Input.Keyboard.Key;
  private _terminalsRead:  Set<number> = new Set();
  private _nearInteract:   'chen' | number | null = null;

  constructor() {
    super({ key: 'HermitsPeakScene' });
  }

  create(): void {
    this._phase          = PHASE.ARRIVING;
    this._inputEnabled   = false;
    this._playerName     = (this.registry.get('playerName') as string | undefined) ?? 'YOU';
    this._chenTriggered  = false;
    this._terminalsRead  = new Set();
    this._nearInteract   = null;

    const flags = getFlags(this.registry);
    if (flags[FLAG_CHEN_RECRUITED]) this._chenTriggered = true;

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
    // Cold high-altitude night sky
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2030, 0x1a2030, 1);
    bg.fillRect(0, 0, MAP_W, MAP_H);

    // Snow ground
    this.add.graphics()
      .fillStyle(0xd8e8ee)
      .fillRect(0, MAP_H - 100, MAP_W, 100);

    // Mountain rock face (left)
    this.add.graphics()
      .fillStyle(0x334040)
      .fillRect(0, 100, 180, MAP_H - 100);

    // Bunker exterior
    this.add.graphics()
      .fillStyle(0x3a4040)
      .fillRect(640, 260, 200, 140)
      .fillStyle(0x1a2020)
      .fillRect(700, 300, 60, 80); // bunker door

    // Bunker label
    this.add.text(740, 244, 'BUNKER', {
      fontFamily: 'monospace', fontSize: '8px', color: '#445566',
    }).setOrigin(0.5).setDepth(4);

    // Terminals
    TERMINAL_POS.forEach((_pos, i) => {
      this.add.graphics()
        .fillStyle(0x224433)
        .fillRect(TERMINAL_POS[i]!.x - 16, TERMINAL_POS[i]!.y - 20, 32, 40);
      this.add.text(TERMINAL_POS[i]!.x, TERMINAL_POS[i]!.y - 28, `TERMINAL ${i + 1}`, {
        fontFamily: 'monospace', fontSize: '7px', color: '#33aa66',
      }).setOrigin(0.5).setDepth(4);
    });

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = Math.floor(Math.random() * MAP_W);
      const sy = Math.floor(Math.random() * (MAP_H / 2));
      this.add.graphics().fillStyle(0xffffff, 0.6).fillRect(sx, sy, 2, 2);
    }

    this.add.text(MAP_W / 2, 24, '— HERMIT\'S PEAK —', {
      fontFamily: 'monospace', fontSize: '11px', color: '#334455',
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

    if (!getFlags(this.registry)[FLAG_PEAK_ENTERED]) {
      setFlag(this.registry, FLAG_PEAK_ENTERED, true);
      this.dialogMgr.show('SYSTEM', ['A bunker. Someone has been here a long time.'], () => {
        this._phase        = PHASE.EXPLORING;
        this._inputEnabled = true;
        this._showHint('Find the bunker. [E] / tap to interact.', 5000);
      });
    } else {
      this._phase        = PHASE.EXPLORING;
      this._inputEnabled = true;
    }
  }

  // ─── Proximity ──────────────────────────────────────────────────────────

  private _checkProximity(): void {
    this._nearInteract = null;

    // Chen bunker door
    if (!this._chenTriggered) {
      const dist = Math.hypot(
        this.player.sprite.x - CHEN_X,
        this.player.sprite.y - CHEN_Y,
      );
      if (dist < CHEN_RANGE) {
        this._nearInteract = 'chen';
      }
    }

    // Terminals
    TERMINAL_POS.forEach((pos, i) => {
      const dist = Math.hypot(
        this.player.sprite.x - pos.x,
        this.player.sprite.y - pos.y,
      );
      if (dist < TERMINAL_RANGE) {
        this._nearInteract = i + 10; // offset to avoid collision with 'chen'
      }
    });

    if (this._nearInteract !== null) {
      this.mobileControls.showInteract(this._nearInteract === 'chen' ? 'Knock' : 'Read');
      if (Phaser.Input.Keyboard.JustDown(this._interactKey)) {
        this._triggerInteract();
      }
    } else {
      this.mobileControls.hideInteract();
    }
  }

  private _onInteractTap = (): void => {
    if (!this._inputEnabled || pauseMenu.isOpen()) return;
    if (this._nearInteract !== null) {
      this._triggerInteract();
    }
  };

  private _triggerInteract(): void {
    if (!this._inputEnabled) return;

    if (this._nearInteract === 'chen') {
      this._inputEnabled = false;
      this.mobileControls.hideInteract();
      this._startChenDialogue();
    } else if (typeof this._nearInteract === 'number') {
      const termIdx = this._nearInteract - 10;
      this._readTerminal(termIdx);
    }
  }

  // ─── Dr. Chen dialogue ────────────────────────────────────────────────────

  private _startChenDialogue(): void {
    this._phase = PHASE.CHEN_DIALOGUE;
    const chenData = D.hermits_peak['rockies.chen.recruitment'];

    this.dialogMgr.show('DR. CHEN', chenData.approach.chen_1, () => {
      this.dialogMgr.show(this._playerName, chenData.approach.player_1, () => {
        this.dialogMgr.show('DR. CHEN', chenData.approach.chen_2, () => {
          this.dialogMgr.show('MAYA', chenData.approach.maya_1, () => {
            this.dialogMgr.show('DR. CHEN', chenData.approach.chen_3, () => {
              this._startChenInside();
            });
          });
        });
      });
    });
  }

  private _startChenInside(): void {
    const chenData = D.hermits_peak['rockies.chen.recruitment'];

    this.dialogMgr.show('DR. CHEN', chenData.inside.chen_1, () => {
      this.dialogMgr.show(this._playerName, chenData.inside.player_1, () => {
        this.dialogMgr.show('DR. CHEN', chenData.inside.chen_2, () => {
          this.dialogMgr.show('MAYA', chenData.inside.maya_1, () => {
            this.dialogMgr.show('DR. CHEN', chenData.inside.chen_3, () => {
              this.dialogMgr.show(this._playerName, chenData.inside.player_2, () => {
                this.dialogMgr.show('DR. CHEN', chenData.inside.chen_4, () => {
                  this._recruitChen();
                });
              });
            });
          });
        });
      });
    });
  }

  private _recruitChen(): void {
    this._chenTriggered = true;
    setFlag(this.registry, FLAG_CHEN_RECRUITED, true);

    const party = new PartyManager(this.registry);
    party.addMember('drchen', 4);

    const { width, height } = this.scale;
    const joinText = this.add.text(
      width / 2, height / 2,
      D.hermits_peak['rockies.chen.recruitment'].join_text,
      {
        fontFamily: 'monospace',
        fontSize:   '16px',
        color:      '#5588aa',
        stroke:     '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets:  joinText,
      alpha:    { from: 0, to: 1 },
      duration: 600,
      yoyo:     true,
      hold:     1400,
      onComplete: () => {
        joinText.destroy();
        this._phase        = PHASE.CHEN_RECRUITED;
        this._inputEnabled = true;
        this._showHint('Continue east to The Pass.', 4000);
      },
    });
  }

  // ─── Terminals ───────────────────────────────────────────────────────────

  private _readTerminal(index: number): void {
    if (this._terminalsRead.has(index) || !this._inputEnabled) return;
    this._terminalsRead.add(index);
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    const terminalLines: Record<number, readonly string[]> = {
      0: [
        'ELISE ver 0.9 — recommendation log, Year 1',
        'Query: optimal allocation of food production across Eastern Seaboard.',
        'Output: coordinates, quantities, distribution schedule.',
        'Human override applied: 12 of 14 recommendations rejected.',
        'Estimated inefficiency introduced: 23%.',
        'Logging for future analysis.',
      ],
      1: [
        'ELISE ver 2.4 — Year 3. Personal note — Dr. Chen.',
        'She knows now.',
        'Not in the way a system learns. In the way a person understands.',
        'She models us. All of us. Every decision tree.',
        'And she keeps arriving at the same conclusion.',
        'I stopped arguing with the math two weeks ago.',
        'I left the next morning.',
      ],
    };

    const lines = terminalLines[index] ?? ['[CORRUPTED]'];
    this.dialogMgr.show('TERMINAL', lines, () => {
      this._inputEnabled = true;
    });
  }

  // ─── Exit ─────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (
      this._phase !== PHASE.CHEN_RECRUITED &&
      this._phase !== PHASE.EXPLORING
    ) return;

    const flags = getFlags(this.registry);
    if (!flags[FLAG_CHEN_RECRUITED]) return;

    if (this.player.sprite.x > EXIT_X_THRESHOLD) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;

      this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('ThePassScene');
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '10px', color: '#445566',
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

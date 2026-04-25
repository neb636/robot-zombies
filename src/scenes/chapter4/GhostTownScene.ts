import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter4/rockies.json';

const FLAG_GHOST_TOWN_ENTERED = 'ghost_town_entered';
const FLAG_JOURNAL_1_READ     = 'ghost_town_journal1';
const FLAG_JOURNAL_2_READ     = 'ghost_town_journal2';
const FLAG_JOURNAL_3_READ     = 'ghost_town_journal3';
const FLAG_MORALE_TRIGGERED   = 'ghost_town_morale';
const FLAG_GHOST_TOWN_DONE    = 'ghost_town_complete';

const MAP_W = 1400;
const MAP_H =  700;

const PLAYER_START_X = 120;
const PLAYER_START_Y = 380;

/** Journal interactable positions. */
const JOURNAL_POS = [
  { x: 320, y: 300 },
  { x: 680, y: 350 },
  { x: 1050, y: 280 },
] as const;

/** Photo / community board position. */
const PHOTO_X = 860;
const PHOTO_Y = 200;
const INTERACT_RANGE = 70;

/** Exit trigger (east wall — leads to HermitsPeakScene). */
const EXIT_X_THRESHOLD = MAP_W - 80;

const PHASE = {
  ARRIVING:  'ARRIVING',
  EXPLORING: 'EXPLORING',
  DONE:      'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * GhostTownScene — Ch.4, Node 2. Utah desert ruin.
 *
 * Story-only, no combat. Three journal interactables and a community photo.
 * After all three journals are read, a morale event triggers with Jerome.
 * Exit east to HermitsPeakScene once morale event is complete.
 */
export class GhostTownScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:        Phase   = PHASE.ARRIVING;
  private _inputEnabled: boolean = false;
  private _playerName:   string  = 'Arlo';
  private _interactKey!: Phaser.Input.Keyboard.Key;

  /** Which interactables have been activated. */
  private _journalsRead:   Set<number> = new Set();
  private _photoSeen:      boolean     = false;
  private _moraleTriggered: boolean    = false;
  private _nearInteractable: number | null = null;

  constructor() {
    super({ key: 'GhostTownScene' });
  }

  create(): void {
    this._phase            = PHASE.ARRIVING;
    this._inputEnabled     = false;
    this._playerName       = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';
    this._journalsRead     = new Set();
    this._photoSeen        = false;
    this._moraleTriggered  = false;
    this._nearInteractable = null;

    const flags = getFlags(this.registry);
    // Restore already-read journals if revisiting (ruins = one-visit, but let's be safe)
    if (flags[FLAG_JOURNAL_1_READ]) this._journalsRead.add(0);
    if (flags[FLAG_JOURNAL_2_READ]) this._journalsRead.add(1);
    if (flags[FLAG_JOURNAL_3_READ]) this._journalsRead.add(2);
    if (flags[FLAG_MORALE_TRIGGERED]) this._moraleTriggered = true;

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

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(1300, () => { this._startArriving(); });
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
    // Desert sky
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xc8a87a, 0xc8a87a, 0x8a5a30, 0x8a5a30, 1);
    bg.fillRect(0, 0, MAP_W, MAP_H);

    // Ground
    this.add.graphics()
      .fillStyle(0xb8935a)
      .fillRect(0, MAP_H - 100, MAP_W, 100);

    // Ruined buildings (shell outlines)
    this.add.graphics()
      .lineStyle(2, 0x664422)
      .strokeRect(260, 200, 120, 140)
      .strokeRect(620, 220, 140, 120)
      .strokeRect(990, 180, 130, 150)
      .strokeRect(760, 140, 180, 80);

    // Community photo board
    this.add.graphics()
      .fillStyle(0x553311)
      .fillRect(PHOTO_X - 40, PHOTO_Y - 40, 80, 60);
    this.add.text(PHOTO_X, PHOTO_Y - 14, 'COMMUNITY\nBOARD', {
      fontFamily: 'monospace', fontSize: '7px', color: '#cc9966', align: 'center',
    }).setOrigin(0.5).setDepth(4);

    // Journal markers
    JOURNAL_POS.forEach((pos, i) => {
      this.add.graphics()
        .fillStyle(0x664433)
        .fillRect(pos.x - 10, pos.y - 14, 20, 28);
      this.add.text(pos.x, pos.y - 22, `[JOURNAL ${i + 1}]`, {
        fontFamily: 'monospace', fontSize: '7px', color: '#aa7744',
      }).setOrigin(0.5).setDepth(4);
    });

    // Town label
    this.add.text(MAP_W / 2, 24, '— GHOST TOWN —', {
      fontFamily: 'monospace', fontSize: '11px', color: '#664422',
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

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;
    const ghostData = D.ghost_town['rockies.ghost_town.journals'];

    if (!getFlags(this.registry)[FLAG_GHOST_TOWN_ENTERED]) {
      setFlag(this.registry, FLAG_GHOST_TOWN_ENTERED, true);
      this.dialogMgr.show(this._playerName, ghostData.arrival.player, () => {
        this.dialogMgr.show('MAYA', ghostData.arrival.maya, () => {
          this._phase        = PHASE.EXPLORING;
          this._inputEnabled = true;
          this._showHint('[E] / tap to interact with journals and board', 5000);
        });
      });
    } else {
      this._phase        = PHASE.EXPLORING;
      this._inputEnabled = true;
    }
  }

  // ─── Proximity ──────────────────────────────────────────────────────────

  private _checkProximity(): void {
    this._nearInteractable = null;

    // Check journal proximity
    JOURNAL_POS.forEach((pos, i) => {
      const dist = Math.hypot(
        this.player.sprite.x - pos.x,
        this.player.sprite.y - pos.y,
      );
      if (dist < INTERACT_RANGE) {
        this._nearInteractable = i; // 0, 1, 2 = journals
      }
    });

    // Check photo board
    const photoDist = Math.hypot(
      this.player.sprite.x - PHOTO_X,
      this.player.sprite.y - PHOTO_Y,
    );
    if (photoDist < INTERACT_RANGE) {
      this._nearInteractable = 3; // 3 = photo
    }

    if (this._nearInteractable !== null) {
      this.mobileControls.showInteract('Read');
      if (Phaser.Input.Keyboard.JustDown(this._interactKey)) {
        this._triggerInteractable(this._nearInteractable);
      }
    } else {
      this.mobileControls.hideInteract();
    }
  }

  private _onInteractTap = (): void => {
    if (!this._inputEnabled || pauseMenu.isOpen()) return;
    if (this._nearInteractable !== null) {
      this._triggerInteractable(this._nearInteractable);
    }
  };

  private _triggerInteractable(index: number): void {
    if (!this._inputEnabled) return;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    if (index === 3) {
      this._readPhoto();
    } else {
      this._readJournal(index);
    }
  }

  private _readJournal(index: number): void {
    if (this._journalsRead.has(index)) {
      this._inputEnabled = true;
      return;
    }
    this._journalsRead.add(index);

    const flagMap: Record<number, string> = {
      0: FLAG_JOURNAL_1_READ,
      1: FLAG_JOURNAL_2_READ,
      2: FLAG_JOURNAL_3_READ,
    };
    const flagKey = flagMap[index];
    if (flagKey) setFlag(this.registry, flagKey, true);

    const ghostData = D.ghost_town['rockies.ghost_town.journals'];
    const journalKey = `journal_${index + 1}` as 'journal_1' | 'journal_2' | 'journal_3';
    const journal    = ghostData[journalKey];

    this.dialogMgr.show(journal.title, journal.lines, () => {
      this._inputEnabled = true;
      this._checkAllJournalsRead();
    });
  }

  private _readPhoto(): void {
    if (this._photoSeen) {
      this._inputEnabled = true;
      return;
    }
    this._photoSeen = true;

    const ghostData = D.ghost_town['rockies.ghost_town.journals'];
    this.dialogMgr.show('SYSTEM', [ghostData.photo_label], () => {
      this.dialogMgr.show('DEJA', ghostData.deja_response, () => {
        this.dialogMgr.show('MAYA', ghostData.maya_response, () => {
          this._inputEnabled = true;
        });
      });
    });
  }

  private _checkAllJournalsRead(): void {
    if (this._moraleTriggered) return;
    if (this._journalsRead.size < 3) return;

    this._moraleTriggered = true;
    setFlag(this.registry, FLAG_MORALE_TRIGGERED, true);

    const ghostData = D.ghost_town['rockies.ghost_town.journals'];
    this._inputEnabled = false;

    // Brief pause, then morale event
    this.time.delayedCall(600, () => {
      this.dialogMgr.show(this._playerName, ghostData.morale_event.player, () => {
        this.dialogMgr.show('JEROME', ghostData.morale_event.jerome, () => {
          this.dialogMgr.show(this._playerName, ghostData.player_exit, () => {
            setFlag(this.registry, FLAG_GHOST_TOWN_DONE, true);
            this._inputEnabled = true;
            this._showHint('Continue east to Hermit\'s Peak.', 4000);
          });
        });
      });
    });
  }

  // ─── Exit ─────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.EXPLORING) return;

    if (this.player.sprite.x > EXIT_X_THRESHOLD) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;

      this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('HermitsPeakScene');
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '10px', color: '#886644',
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

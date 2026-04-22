import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { getFlags, setFlag } from '../../utils/constants.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { TOMAS }           from '../../characters/tomas.js';
import D_CROSS from '../../data/dialogue/chapter2/mississippi_crossing.json';
import D_TOMAS from '../../data/dialogue/chapter2/tomas.json';

// ─── Layout constants ──────────────────────────────────────────────────────────
const MAP_W = 1800;
const MAP_H = 900;

const PLAYER_START_X = 160;
const PLAYER_START_Y = 450;

const TOMAS_X   = 360;
const TOMAS_Y   = 450;

const BRIDGE_ENTRY_X = 900;

const EXIT_X     = 1700;
const EXIT_Y_TOP = 200;
const EXIT_Y_BOT = 700;

// ─── Phases ───────────────────────────────────────────────────────────────────
const PHASE = {
  ARRIVING:     'ARRIVING',
  TOMAS_OFFER:  'TOMAS_OFFER',
  EXPLORING:    'EXPLORING',
  BRIDGE_FIGHT: 'BRIDGE_FIGHT',
  CROSSING:     'CROSSING',
  DONE:         'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * MississippiCrossingScene — Chapter 2.
 *
 * Tomas Reyes controls the bridge. Two routes:
 * - Accept his deal → names cleared → walk across.
 * - Decline → fight Bridge Enforcers.
 *
 * The §7 choice row sets TOMAS_DEBT_CLEARED or TOMAS_REFUSED.
 * If accepted, Deja morale +15 (logged via flag, survival layer reads it).
 */
export class MississippiCrossingScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:           Phase   = PHASE.ARRIVING;
  private _inputEnabled:    boolean = false;
  private _playerName:      string  = 'YOU';

  private _tomasTriggered:  boolean = false;
  private _bridgeTriggered: boolean = false;

  private readonly _interactHandler: () => void;

  constructor() {
    super({ key: 'MississippiCrossingScene' });
    this._interactHandler = () => { this._tryTomasTalk(); };
  }

  create(): void {
    this._phase           = PHASE.ARRIVING;
    this._inputEnabled    = false;
    this._tomasTriggered  = false;
    this._bridgeTriggered = false;
    this._playerName      = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawScene();
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();

    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
      document.removeEventListener('interact:tap', this._interactHandler);
    });

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.time.delayedCall(1100, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;
    if (this._inputEnabled && !this.dialogMgr.isActive()) {
      this.player.update();
      this._checkProximity();
      this._checkBridgeEntry();
      this._checkExit();
    }
  }

  // ─── Scene drawing ──────────────────────────────────────────────────────────

  private _drawScene(): void {
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x0d1520).setDepth(0);

    // River
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H * 0.5, 0x0a1a30).setDepth(1);

    // Shore (west)
    this.add.rectangle(320, MAP_H / 2, 640, MAP_H, 0x1a1a10).setDepth(2);

    // Shore (east)
    this.add.rectangle(MAP_W - 320, MAP_H / 2, 640, MAP_H, 0x1a1a10).setDepth(2);

    // Bridge
    this.add.rectangle(MAP_W / 2, MAP_H / 2, 300, 400, 0x2a2a35).setDepth(3);
    this.add.text(MAP_W / 2, MAP_H / 2 - 230, "GOVERNOR'S BRIDGE", {
      fontFamily: 'monospace', fontSize: '9px', color: '#556688',
    }).setOrigin(0.5).setDepth(5);

    // Enforcer checkpoint markers
    this.add.rectangle(BRIDGE_ENTRY_X - 140, MAP_H / 2, 20, 380, 0x334466).setDepth(4);
    this.add.rectangle(BRIDGE_ENTRY_X + 140, MAP_H / 2, 20, 380, 0x334466).setDepth(4);

    // Tomas bar
    this.add.rectangle(TOMAS_X - 100, TOMAS_Y + 60, 220, 120, 0x1a100a).setDepth(2);
    this.add.text(TOMAS_X - 100, TOMAS_Y + 20, "TOMAS'S PLACE", {
      fontFamily: 'monospace', fontSize: '8px', color: '#665533',
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
    this.add.rectangle(TOMAS_X, TOMAS_Y, 16, 28, 0xaa7744).setDepth(5);
    this.add.text(TOMAS_X, TOMAS_Y - 24, 'TOMAS', {
      fontFamily: 'monospace', fontSize: '8px', color: '#aa7744',
    }).setOrigin(0.5).setDepth(6);

    // Interact wiring
    this.input.keyboard!.on('keydown-E', this._interactHandler);
    document.addEventListener('interact:tap', this._interactHandler);
  }

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.6);
  }

  // ─── Arriving ────────────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.TOMAS_OFFER;
    this.dialogMgr.show('DEJA', D_CROSS.arriving.deja as string[], () => {
      this.dialogMgr.show('MAYA', D_CROSS.arriving.maya as string[], () => {
        this._inputEnabled = true;
        this._showHint('Talk to Tomas. [E / tap]', 5000);
      });
    });
  }

  // ─── Proximity ───────────────────────────────────────────────────────────────

  private _checkProximity(): void {
    if (!this._tomasTriggered && this._phase === PHASE.TOMAS_OFFER) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, TOMAS_X, TOMAS_Y,
      );
      if (dist < 80) {
        this.mobileControls.showInteract('Talk');
      } else {
        this.mobileControls.hideInteract();
      }
    }
  }

  private _tryTomasTalk(): void {
    if (this._tomasTriggered) return;
    if (!this._inputEnabled || this.dialogMgr.isActive()) return;
    const dist = Phaser.Math.Distance.Between(
      this.player.sprite.x, this.player.sprite.y, TOMAS_X, TOMAS_Y,
    );
    if (dist < 80) {
      this._tomasTriggered = true;
      this._inputEnabled = false;
      this.mobileControls.hideInteract();
      this._triggerTomasOffer();
    }
  }

  // ─── Tomas offer (§7) ─────────────────────────────────────────────────────────

  private _triggerTomasOffer(): void {
    const offer = D_TOMAS.deep_south.tomas.offer;

    this.dialogMgr.show('TOMAS', offer.intro as string[], () => {
      this._showChoiceMenu(
        offer.choice_accept,
        offer.choice_decline,
        () => { this._tomasAccept(); },
        () => { this._tomasDecline(); },
      );
    });
  }

  private _showChoiceMenu(
    labelA: string,
    labelB: string,
    onA: () => void,
    onB: () => void,
  ): void {
    const { width, height } = this.scale;
    const panelX = width / 2;
    const panelY = height / 2;

    const bg = this.add.rectangle(panelX, panelY, 320, 80, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(40);

    const btnA = this.add.text(panelX, panelY - 16, labelA, {
      fontFamily: 'monospace', fontSize: '14px', color: '#88ffaa',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setInteractive();

    const btnB = this.add.text(panelX, panelY + 16, labelB, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff8888',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setInteractive();

    const cleanup = (): void => {
      bg.destroy(); btnA.destroy(); btnB.destroy();
    };

    btnA.on('pointerdown', () => { cleanup(); onA(); });
    btnB.on('pointerdown', () => { cleanup(); onB(); });

    const keyOne = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const keyTwo = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    keyOne.once('down', () => { cleanup(); onA(); });
    keyTwo.once('down', () => { cleanup(); onB(); });
  }

  private _tomasAccept(): void {
    setFlag(this.registry, TOMAS.acceptFlag, true);
    setFlag(this.registry, 'DEJA_MORALE_BONUS_15', true);

    const offer = D_TOMAS.deep_south.tomas.offer;
    this.dialogMgr.show('TOMAS', offer.accept_response as string[], () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
      this._showHint('Names cleared. Head to the bridge.', 5000);
    });
  }

  private _tomasDecline(): void {
    setFlag(this.registry, TOMAS.declineFlag, true);

    const offer = D_TOMAS.deep_south.tomas.offer;
    this.dialogMgr.show('TOMAS', offer.decline_response as string[], () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
      this._showHint('Bridge is northeast. Expect resistance.', 5000);
    });
  }

  // ─── Bridge entry ────────────────────────────────────────────────────────────

  private _checkBridgeEntry(): void {
    if (this._phase !== PHASE.EXPLORING) return;
    if (this._bridgeTriggered) return;

    const { x } = this.player.sprite;
    if (x < BRIDGE_ENTRY_X - 140) return;

    this._bridgeTriggered = true;
    this._inputEnabled = false;

    const flags = getFlags(this.registry);
    if (flags[TOMAS.acceptFlag]) {
      this._bridgeClearedPath();
    } else {
      this._bridgeFightPath();
    }
  }

  private _bridgeClearedPath(): void {
    this.dialogMgr.show(this._playerName, D_CROSS.approach_cleared.player as string[], () => {
      this.dialogMgr.show('DEJA', D_CROSS.approach_cleared.deja as string[], () => {
        this._phase = PHASE.CROSSING;
        this._inputEnabled = true;
        this._showHint('Cross the bridge.', 4000);
      });
    });
  }

  private _bridgeFightPath(): void {
    this.dialogMgr.show(this._playerName, D_CROSS.approach_flagged.player as string[], () => {
      this.dialogMgr.show('ELIAS', D_CROSS.approach_flagged.elias as string[], () => {
        this.dialogMgr.show('ENFORCER', D_CROSS.bridge_combat.pre_fight as string[], () => {
          this._phase = PHASE.BRIDGE_FIGHT;
          this._launchBridgeBattle();
        });
      });
    });
  }

  private _launchBridgeBattle(): void {
    const initData: BattleInitData = {
      enemyKey:    'bridge_enforcer',
      returnScene: 'MississippiCrossingScene',
      scripted:    false,
    };
    this.scene.launch('BattleScene', initData);
    this.scene.pause();

    this.events.once('resume', () => {
      this.dialogMgr.show('NARRATOR', D_CROSS.bridge_combat.post_fight as string[], () => {
        this._phase = PHASE.CROSSING;
        this._inputEnabled = true;
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.CROSSING) return;
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    this.dialogMgr.show('DEJA', D_CROSS.crossing_complete.deja as string[], () => {
      this.dialogMgr.show('ELIAS', D_CROSS.crossing_complete.elias as string[], () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
          if (p === 1) this.scene.start('BayouScene');
        });
      });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#668899',
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

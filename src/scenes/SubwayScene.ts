import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { MobileControls }  from '../utils/MobileControls.js';
import { GAME_FLAGS, setFlag } from '../utils/constants.js';
import { PartyManager }    from '../party/PartyManager.js';
import type { WasdKeys }   from '../types.js';
import {
  MAP_W, MAP_H,
  PLAYER_START_X, PLAYER_START_Y,
  MAYA_X, MAYA_Y,
  EXIT_X, EXIT_Y_TOP, EXIT_Y_BOT,
  SURVIVOR_NPCS,
  drawSubway,
} from './SubwayRenderer.js';
import D from '../data/dialogue/subway.json';
import { pauseMenu } from '../ui/PauseMenu.js';

const PHASE = {
  ARRIVING:      'ARRIVING',
  EXPLORING:     'EXPLORING',
  MAYA_DIALOGUE: 'MAYA_DIALOGUE',
  MAYA_JOINED:   'MAYA_JOINED',
  DONE:          'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * SubwayScene — Red Line Tunnels safe house.
 * Underground survivor cell. Maya is here.
 */
export class SubwayScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:        Phase   = PHASE.ARRIVING;
  private _inputEnabled: boolean = false;
  private _playerName:   string  = 'YOU';

  // NPC interaction tracking
  private _survivorTalked: Set<number> = new Set();
  private _mayaTriggered: boolean = false;
  private _mayaFollowUp:  boolean = false;
  private _exitHintShown: boolean = false;

  // Maya sprite reference
  private _mayaSprite!: Phaser.GameObjects.Sprite;

  // Persistent exit hint after Maya joins
  private _exitHint: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'SubwayScene' });
  }

  create(): void {
    this._phase        = PHASE.ARRIVING;
    this._inputEnabled = false;
    this._mayaTriggered = false;
    this._mayaFollowUp  = false;
    this._exitHintShown = false;
    this._survivorTalked = new Set();
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    drawSubway(this);
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();

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
      this._checkNPCProximity();
      this._checkExit();
    }
  }

  // ─── Player ─────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
  }

  // ─── NPCs ──────────────────────────────────────────────────────────────

  private _buildNPCs(): void {
    // Survivor NPCs (gray rectangles)
    SURVIVOR_NPCS.forEach((npc, _i) => {
      this.add.rectangle(npc.x, npc.y, 14, 24, 0x888888).setDepth(5);
    });

    // Maya sprite
    this._mayaSprite = this.add.sprite(MAYA_X, MAYA_Y, 'maya', 0);
    this._mayaSprite.setOrigin(0.5, 1);
    this._mayaSprite.setScale(1.4);
    this._mayaSprite.setDepth(5);
    if (this.anims.exists('maya-idle')) this._mayaSprite.play('maya-idle');

    // Label above Maya
    this.add.text(MAYA_X, MAYA_Y - 72, 'MAYA', {
      fontFamily: 'monospace', fontSize: '8px', color: '#44aaaa',
    }).setOrigin(0.5).setDepth(6);
  }

  // ─── Camera ─────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.8);
  }

  // ─── Story flow ─────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;

    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
    });
  }

  // ─── NPC proximity ──────────────────────────────────────────────────────

  private _checkNPCProximity(): void {
    // Check survivor NPCs
    SURVIVOR_NPCS.forEach((npc, i) => {
      if (this._survivorTalked.has(i)) return;
      const dist = Math.hypot(
        this.player.sprite.x - npc.x,
        this.player.sprite.y - npc.y,
      );
      if (dist < 60) {
        this._survivorTalked.add(i);
        this._inputEnabled = false;
        this.dialogMgr.show('SURVIVOR', D.survivor_lines[i] ?? [], () => {
          this._inputEnabled = true;
        });
      }
    });

    // Check Maya proximity
    if (!this._mayaTriggered && this._phase === PHASE.EXPLORING) {
      const dist = Math.hypot(
        this.player.sprite.x - MAYA_X,
        this.player.sprite.y - MAYA_Y,
      );
      if (dist < 70) {
        this._mayaTriggered = true;
        this._inputEnabled  = false;
        this._triggerMayaDialogue();
      }
    }

    // Check Maya follow-up (after joining)
    if (
      this._phase === PHASE.MAYA_JOINED &&
      !this._mayaFollowUp
    ) {
      const dist = Math.hypot(
        this.player.sprite.x - MAYA_X,
        this.player.sprite.y - MAYA_Y,
      );
      if (dist < 70) {
        this._mayaFollowUp = true;
        this._inputEnabled = false;
        this._triggerMayaFollowUp();
      }
    }
  }

  // ─── Maya dialogue ────────────────────────────────────────────────────

  private _triggerMayaDialogue(): void {
    this.dialogMgr.show('MAYA', D.maya.initial1, () => {
      this.dialogMgr.show(this._playerName, D.maya.initial2_player, () => {
        this.dialogMgr.show('MAYA', D.maya.initial3, () => {
          this._mayaJoins();
        });
      });
    });
  }

  private _mayaJoins(): void {
    setFlag(this.registry, GAME_FLAGS.MAYA_RECRUITED, true);
    new PartyManager(this.registry).addMember('maya', 0);

    // Flash "MAYA joined the party"
    const { width, height } = this.scale;
    const joinText = this.add.text(width / 2, height / 2, 'MAYA joined the party.', {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      '#44aaaa',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets:  joinText,
      alpha:    { from: 0, to: 1 },
      duration: 600,
      yoyo:     true,
      hold:     1200,
      onComplete: () => {
        joinText.destroy();
        this._phase = PHASE.MAYA_JOINED;
        this._inputEnabled = true;

        if (!this._exitHintShown) {
          this._exitHintShown = true;
          this._showExitHint();
        }
      },
    });
  }

  private _triggerMayaFollowUp(): void {
    this.dialogMgr.show(this._playerName, D.maya.followup_player, () => {
      this.dialogMgr.show('MAYA', D.maya.followup, () => {
        this._inputEnabled = true;
        this._showExitHint();
      });
    });
  }

  // ─── Exit ──────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.MAYA_JOINED) return;
    const { x, y } = this.player.sprite;
    if (x > EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;
    this._hideExitHint();

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('WorldMapScene');
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private _showExitHint(): void {
    if (this._exitHint) return;
    const { width, height } = this.scale;
    const hint = this.add.text(
      width / 2, height - 40,
      '← Head west to the tunnel EXIT',
      {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffcc66',
        stroke: '#000000', strokeThickness: 3,
      },
    ).setScrollFactor(0).setDepth(25).setOrigin(0.5);

    this.tweens.add({
      targets:  hint,
      alpha:    { from: 0.55, to: 1 },
      duration: 900,
      yoyo:     true,
      repeat:   -1,
    });

    this._exitHint = hint;
  }

  private _hideExitHint(): void {
    if (!this._exitHint) return;
    this.tweens.killTweensOf(this._exitHint);
    this._exitHint.destroy();
    this._exitHint = null;
  }

}

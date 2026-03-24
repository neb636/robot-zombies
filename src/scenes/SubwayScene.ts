import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { GAME_FLAGS, setFlag } from '../utils/constants.js';
import type { WasdKeys }   from '../types.js';
import {
  MAP_W, MAP_H,
  PLAYER_START_X, PLAYER_START_Y,
  MAYA_X, MAYA_Y,
  EXIT_X, EXIT_Y_TOP, EXIT_Y_BOT,
  SURVIVOR_NPCS,
  drawSubway,
} from './SubwayRenderer.js';

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
  cursors!:   Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:      WasdKeys;
  player!:    Player;
  dialogMgr!: DialogueManager;

  private _phase:        Phase   = PHASE.ARRIVING;
  private _inputEnabled: boolean = false;
  private _playerName:   string  = 'YOU';

  // NPC interaction tracking
  private _survivorTalked: Set<number> = new Set();
  private _mayaTriggered: boolean = false;
  private _mayaFollowUp:  boolean = false;
  private _exitHintShown: boolean = false;

  // Maya sprite reference
  private _mayaRect!: Phaser.GameObjects.Rectangle;

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

    this.dialogMgr = new DialogueManager(this);

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled) {
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

    // Maya (teal rectangle)
    this._mayaRect = this.add.rectangle(MAYA_X, MAYA_Y, 16, 26, 0x44aaaa);
    this._mayaRect.setDepth(5);

    // Label above Maya
    this.add.text(MAYA_X, MAYA_Y - 22, 'MAYA', {
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

    this.dialogMgr.show(this._playerName, [
      'Underground. The air is stale.',
      'People are down here.',
    ], () => {
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
        this.dialogMgr.show('SURVIVOR', [npc.line], () => {
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
    this.dialogMgr.show('MAYA', [
      "Stop.",
      "Before you say anything — how many were following you?",
    ], () => {
      this.dialogMgr.show(this._playerName, [
        "None. I think.",
      ], () => {
        this.dialogMgr.show('MAYA', [
          "You think. Great. That's reassuring.",
          "MIT Robotics, class of '28. Before that mattered.",
          "I know what converted them. I know how the beam works. I know the frequency.",
          "What I don't have is someone stupid enough to walk back up there with me.",
          "...You're volunteering. I can tell by the look.",
        ], () => {
          this._mayaJoins();
        });
      });
    });
  }

  private _mayaJoins(): void {
    setFlag(this.registry, GAME_FLAGS.MAYA_RECRUITED, true);

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
          this._showHint('Head to the exit on the left.', 5000);
        }
      },
    });
  }

  private _triggerMayaFollowUp(): void {
    this.dialogMgr.show(this._playerName, [
      "My friend. Marcus. He was—",
    ], () => {
      this.dialogMgr.show('MAYA', [
        "Converted. I know what it looks like.",
        "He's not dead. That's the worst part. He's still in there.",
        "The frequency can be reversed. In theory.",
        "I need an EMP device from the campus. My old lab.",
        "One thing at a time.",
      ], () => {
        this._inputEnabled = true;
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

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('WorldMapScene');
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

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

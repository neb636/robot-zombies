import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { PartyManager }    from '../../party/PartyManager.js';
import { setFlag }         from '../../utils/constants.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS }          from '../../utils/constants.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter1/blue_ridge.json';

// ─── Layout ──────────────────────────────────────────────────────────────────

const MAP_W = 1600;
const MAP_H = 600;

const PLAYER_START_X  = 80;
const PLAYER_START_Y  = 320;
const ELIAS_X         = 820;
const ELIAS_Y         = 280;
const ELIAS_DIST      = 90;
const DRONE_TRIGGER_X = 400;
const BOSS_TRIGGER_X  = 1380;
const EXIT_X          = 1550;
const EXIT_Y_TOP      = 240;
const EXIT_Y_BOT      = 400;

// ─── Phase ───────────────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING:      'ARRIVING',
  EXPLORING:     'EXPLORING',
  DRONE_EVENT:   'DRONE_EVENT',
  ELIAS_MEET:    'ELIAS_MEET',
  ELIAS_JOINED:  'ELIAS_JOINED',
  BOSS_APPROACH: 'BOSS_APPROACH',
  BOSS_BATTLE:   'BOSS_BATTLE',
  POST_BOSS:     'POST_BOSS',
  DONE:          'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * BlueRidgePassageScene — Blue Ridge Passage (neutral zone).
 * Dense Appalachian forest. Low drone coverage. Elias recruited mid-scene.
 * Exits east into RidgeCampScene after mini-boss or on reaching the exit zone.
 */
export class BlueRidgePassageScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:          Phase   = PHASE.ARRIVING;
  private _inputEnabled:   boolean = false;
  private _playerName:     string  = 'YOU';
  private _droneTriggered: boolean = false;
  private _eliasTriggered: boolean = false;
  private _bossTriggered:  boolean = false;

  constructor() {
    super({ key: 'BlueRidgePassageScene' });
  }

  create(): void {
    this._phase          = PHASE.ARRIVING;
    this._inputEnabled   = false;
    this._droneTriggered = false;
    this._eliasTriggered = false;
    this._bossTriggered  = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawWorld();
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();
    this._buildHUD();

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
      this._checkTriggers();
      this._checkExit();
    }
  }

  // ─── World ────────────────────────────────────────────────────────────────

  private _drawWorld(): void {
    const g = this.add.graphics();

    // Sky / upper canopy
    g.fillStyle(0x0d1a0d);
    g.fillRect(0, 0, MAP_W, 200);

    // Ground
    g.fillStyle(0x1a1408);
    g.fillRect(0, 200, MAP_W, MAP_H - 200);

    // Dirt trail
    g.fillStyle(0x2a1f0e);
    g.fillRect(0, 280, MAP_W, 60);

    // Tree trunks above trail
    const treesAbove: Array<[number, number]> = [
      [60, 120], [180, 80], [300, 140], [450, 90], [620, 110],
      [760, 75], [900, 130], [1060, 100], [1200, 85], [1350, 115], [1480, 95],
    ];
    for (const [tx, ty] of treesAbove) {
      g.fillStyle(0x241504);
      g.fillRect(tx - 6, ty, 12, 180);
      g.fillStyle(0x0d1a0d);
      g.fillCircle(tx, ty + 10, 28);
    }

    // Tree trunks below trail
    const treesBelow: Array<[number, number]> = [
      [100, 400], [250, 430], [420, 390], [580, 440], [740, 410],
      [930, 420], [1100, 395], [1280, 445], [1450, 400],
    ];
    for (const [tx, ty] of treesBelow) {
      g.fillStyle(0x2a1a08);
      g.fillRect(tx - 6, ty, 12, 160);
      g.fillStyle(0x0d1a0d);
      g.fillCircle(tx, ty + 10, 26);
    }

    // Rock outcroppings
    g.fillStyle(0x4a4040);
    g.fillRect(550, 350, 60, 30);
    g.fillRect(900, 240, 80, 40);
    g.fillStyle(0x3a3030);
    g.fillRect(1200, 370, 50, 25);

    // Exit hint (subtle green glow on east wall)
    g.fillStyle(0x334433, 0.35);
    g.fillRect(MAP_W - 50, EXIT_Y_TOP, 50, EXIT_Y_BOT - EXIT_Y_TOP);
  }

  // ─── Player ──────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  // ─── NPCs ────────────────────────────────────────────────────────────────

  private _buildNPCs(): void {
    this.add.rectangle(ELIAS_X, ELIAS_Y, 16, 26, 0x886644).setDepth(5);
    this.add.text(ELIAS_X, ELIAS_Y - 22, 'ELIAS', {
      fontFamily: 'monospace', fontSize: '8px', color: '#886644',
    }).setOrigin(0.5).setDepth(6);
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'APPALACHIA  ·  BLUE RIDGE PASSAGE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#334422',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);
  }

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
      this._showHint('Head east along the trail. Tap or use arrow keys.', 5000);
    });
  }

  // ─── Proximity / trigger checks ──────────────────────────────────────────

  private _checkTriggers(): void {
    const { x } = this.player.sprite;

    if (!this._droneTriggered && x > DRONE_TRIGGER_X && this._phase === PHASE.EXPLORING) {
      this._droneTriggered = true;
      this._triggerDroneEvent();
      return;
    }

    if (!this._eliasTriggered && this._phase === PHASE.EXPLORING) {
      const dist = Math.hypot(this.player.sprite.x - ELIAS_X, this.player.sprite.y - ELIAS_Y);
      if (dist < ELIAS_DIST) {
        this._eliasTriggered = true;
        this._triggerEliasMeet();
        return;
      }
    }

    if (!this._bossTriggered && this._phase === PHASE.ELIAS_JOINED && x > BOSS_TRIGGER_X) {
      this._bossTriggered = true;
      this._triggerBossApproach();
    }
  }

  // ─── Drone event ─────────────────────────────────────────────────────────

  private _triggerDroneEvent(): void {
    this._inputEnabled = false;
    this._phase = PHASE.DRONE_EVENT;
    this.dialogMgr.show(this._playerName, D.drone_patrol.player, () => {
      this.dialogMgr.show('MAYA', D.drone_patrol.maya, () => {
        this._phase = PHASE.EXPLORING;
        this._inputEnabled = true;
      });
    });
  }

  // ─── Elias recruitment ───────────────────────────────────────────────────

  private _triggerEliasMeet(): void {
    this._phase = PHASE.ELIAS_MEET;
    this._inputEnabled = false;
    this.dialogMgr.show(this._playerName, D.elias_first_sight.player, () => {
      this.dialogMgr.show('ELIAS', D.elias_meet_a.elias, () => {
        this.dialogMgr.show(this._playerName, D.elias_meet_a.player, () => {
          this.dialogMgr.show('ELIAS', D.elias_meet_b.elias, () => {
            this._eliasJoins();
          });
        });
      });
    });
  }

  private _eliasJoins(): void {
    new PartyManager(this.registry).addMember('elias', 1);
    // Prime the Harvest Town flag slot (will be set to true in Ch.3)
    setFlag(this.registry, 'saw_marcus_harvest_town', false);

    const { width, height } = this.scale;
    const joinText = this.add.text(width / 2, height / 2, 'ELIAS joined the party.', {
      fontFamily:      'monospace',
      fontSize:        '16px',
      color:           '#886644',
      stroke:          '#000000',
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
        this._phase = PHASE.ELIAS_JOINED;
        this.dialogMgr.show('ELIAS', D.elias_path_a.elias, () => {
          this.dialogMgr.show('MAYA', D.elias_path_a.maya, () => {
            this.dialogMgr.show('ELIAS', D.elias_path_b.elias, () => {
              this._inputEnabled = true;
              this._showHint('Continue east toward Ridge Camp.', 4000);
            });
          });
        });
      },
    });
  }

  // ─── Boss approach ───────────────────────────────────────────────────────

  private _triggerBossApproach(): void {
    this._phase = PHASE.BOSS_APPROACH;
    this._inputEnabled = false;
    this.dialogMgr.show(this._playerName, D.excavator_ambush.player, () => {
      this.dialogMgr.show('ELIAS', D.excavator_ambush.elias, () => {
        this.dialogMgr.show('MAYA', D.excavator_ambush.maya, () => {
          this.dialogMgr.show('SYSTEM', D.boss_warning.system, () => {
            this._launchBossBattle();
          });
        });
      });
    });
  }

  private _launchBossBattle(): void {
    this._phase = PHASE.BOSS_BATTLE;
    const initData: BattleInitData = {
      enemyKey:    'excavator_prime',
      returnScene: 'BlueRidgePassageScene',
      allies:      new PartyManager(this.registry).toAllyConfigs(),
      bossConfig: {
        phases: [
          {
            hpThreshold: 0.6,
            atkBoost:    8,
            dialogue:    [
              'EFFICIENCY THRESHOLD EXCEEDED.',
              'ACTIVATING SECONDARY DRILL ARRAY.',
            ],
          },
          {
            hpThreshold: 0.3,
            atkBoost:    6,
            dialogue:    [
              'YOUR RESISTANCE IS MATHEMATICALLY INCOHERENT.',
              'OVERDRIVE PROTOCOL: ENGAGED.',
            ],
          },
        ],
      },
    };

    bus.once(EVENTS.BATTLE_END, () => { this._onBossEnd(); });
    this.scene.pause();
    this.scene.launch('BattleScene', initData);
  }

  private _onBossEnd(): void {
    this._phase = PHASE.POST_BOSS;
    this.dialogMgr.show(this._playerName, D.camp_sight.player, () => {
      this.dialogMgr.show('ELIAS', D.camp_sight.elias, () => {
        this._finishScene();
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== PHASE.ELIAS_JOINED) return;
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_TOP || y > EXIT_Y_BOT) return;
    this._finishScene();
  }

  private _finishScene(): void {
    this._phase = PHASE.DONE;
    this._inputEnabled = false;
    this.cameras.main.fadeOut(800, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('RidgeCampScene');
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 3000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#446644',
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

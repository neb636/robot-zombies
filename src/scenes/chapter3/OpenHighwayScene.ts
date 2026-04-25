import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS } from '../../utils/constants.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter3/open_highway.json';

const MAP_W = 3200;
const MAP_H = 800;

const PLAYER_START_X = 80;
const PLAYER_START_Y = MAP_H / 2;

// Waypoints the player must reach to advance
const SAFE_ZONE_X = 2800;

// Aerial Sentinel patrol zones — x-ranges where combat triggers
const PATROL_ZONES: Array<{ xMin: number; xMax: number }> = [
  { xMin: 400,  xMax: 700  },
  { xMin: 1000, xMax: 1400 },
  { xMin: 1800, xMax: 2200 },
  { xMin: 2400, xMax: 2700 },
];

const PHASE = {
  ARRIVING:    'ARRIVING',
  TRAVERSING:  'TRAVERSING',
  IN_BATTLE:   'IN_BATTLE',
  SAFE:        'SAFE',
  DONE:        'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * OpenHighwayScene — Ch.3 Scene 1. Kansas, Great Plains.
 * Aerial Sentinels patrol in grid sweeps. No cover — timing-based stealth movement.
 * Player must cross the highway to the grain depot without triggering a patrol.
 */
export class OpenHighwayScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = PHASE.ARRIVING;
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'Arlo';

  // Patrol timing
  private _sweepTimer:    number  = 0;
  private _sweepInterval: number  = 4000; // ms between sweeps
  private _sweepActive:   boolean = false;
  private _zonesTriggered: Set<number> = new Set();

  constructor() {
    super({ key: 'OpenHighwayScene' });
  }

  create(): void {
    this._phase        = PHASE.ARRIVING;
    this._inputEnabled = false;
    this._sweepTimer   = 0;
    this._sweepActive  = false;
    this._zonesTriggered = new Set();
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._drawScene();
    this._buildPlayer();
    this._buildCamera();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArriving(); });
  }

  update(_time: number, delta: number): void {
    if (this._phase === PHASE.DONE) return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._updateSweepTimer(delta);
      this._checkPatrolZones();
      this._checkSafeZone();
    }
  }

  // ─── Scene drawing ────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Sky gradient — Kansas flat sky
    this.add.rectangle(MAP_W / 2, MAP_H * 0.3, MAP_W, MAP_H * 0.6, 0x8899bb);
    // Ground
    this.add.rectangle(MAP_W / 2, MAP_H * 0.7, MAP_W, MAP_H * 0.4, 0x556644);
    // Highway
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, 80, 0x333333);
    // Center line dashes
    for (let x = 0; x < MAP_W; x += 120) {
      this.add.rectangle(x + 60, MAP_H / 2, 60, 4, 0xffee88).setAlpha(0.6);
    }
    // Grain silos (landmark silhouettes)
    const siloPositions = [600, 1200, 1900, 2500];
    for (const sx of siloPositions) {
      this.add.rectangle(sx, MAP_H * 0.45, 30, 80, 0x445533);
      this.add.rectangle(sx, MAP_H * 0.35, 36, 30, 0x334422);
    }
    // Destination marker
    this.add.rectangle(SAFE_ZONE_X + 60, MAP_H / 2, 60, 100, 0x557744).setAlpha(0.8);
    this.add.text(SAFE_ZONE_X, MAP_H / 2 - 70, 'DEPOT', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aabbaa',
    }).setOrigin(0.5);

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  private _buildPlayer(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = this.input.keyboard!.addKeys('W,A,S,D') as WasdKeys;
    this.player  = new Player(this, PLAYER_START_X, PLAYER_START_Y);
    this.player.name = this._playerName;
    this.player.sprite.setCollideWorldBounds(true);
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;

    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('MAYA', D.arriving.maya, () => {
        this._phase = PHASE.TRAVERSING;
        this._inputEnabled = true;
        this._showHint('Move east. Stand still when you hear rotors.', 5000);
      });
    });
  }

  // ─── Patrol sweep logic ───────────────────────────────────────────────────

  private _updateSweepTimer(delta: number): void {
    this._sweepTimer += delta;
    if (this._sweepTimer >= this._sweepInterval) {
      this._sweepTimer = 0;
      this._sweepActive = !this._sweepActive;
      if (this._sweepActive) {
        this._showSweepWarning();
      }
    }
  }

  private _showSweepWarning(): void {
    const { width, height } = this.scale;
    const warn = this.add.text(width / 2, height * 0.15, '[ GRID SWEEP ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#cc4422',
    }).setScrollFactor(0).setDepth(30).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets:  warn,
      alpha:    { from: 0, to: 1 },
      duration: 300,
      yoyo:     true,
      hold:     1500,
      onComplete: () => { warn.destroy(); },
    });
  }

  private _checkPatrolZones(): void {
    if (this._phase !== PHASE.TRAVERSING) return;

    const px = this.player.sprite.x;

    PATROL_ZONES.forEach((zone, i) => {
      if (this._zonesTriggered.has(i)) return;
      if (px >= zone.xMin && px <= zone.xMax && this._sweepActive) {
        this._zonesTriggered.add(i);
        this._triggerPatrolBattle(i);
      }
    });
  }

  private _triggerPatrolBattle(zoneIndex: number): void {
    this._phase = PHASE.IN_BATTLE;
    this._inputEnabled = false;

    const isClose = zoneIndex === PATROL_ZONES.length - 1;
    const lines = isClose ? D.close_call : D.sentinel_spotted;

    this.dialogMgr.show('MAYA', (lines as { maya: string[] }).maya, () => {
      const initData: BattleInitData = {
        enemyKey:    'aerial_sentinel',
        returnScene: 'OpenHighwayScene',
        scripted:    false,
      };

      bus.once(EVENTS.BATTLE_END, () => {
        this._phase = PHASE.TRAVERSING;
        this._inputEnabled = true;
      });

      this.scene.pause();
      this.scene.launch('BattleScene', initData);
    });
  }

  private _checkSafeZone(): void {
    if (this._phase !== PHASE.TRAVERSING) return;
    if (this.player.sprite.x < SAFE_ZONE_X) return;

    this._phase = PHASE.SAFE;
    this._inputEnabled = false;

    this.dialogMgr.show(this._playerName, D.safe_zone.player, () => {
      this.dialogMgr.show('MAYA', D.safe_zone.maya, () => {
        this._endScene();
      });
    });
  }

  private _endScene(): void {
    this._phase = PHASE.DONE;
    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('HarvestTownScene');
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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


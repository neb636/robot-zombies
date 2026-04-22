import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS, setFlag } from '../../utils/constants.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter3/storm_corridor.json';
import { WARDEN_SIX_CH3_PHASES } from '../../entities/enemies/chapter3/wardenSixCh3.js';

const MAP_W = 3600;
const MAP_H = 900;

const PLAYER_START_X = 100;
const PLAYER_START_Y = MAP_H / 2;

// Warden Six appears at x = 2800
const WARDEN_TRIGGER_X = 2800;

// Exit to radio tower
const EXIT_X = MAP_W - 80;
const EXIT_Y_MIN = MAP_H / 2 - 120;
const EXIT_Y_MAX = MAP_H / 2 + 120;

// Flag for Warden Six Ch.3 defeated
const SIX_BEATEN_CH3 = 'six_beaten_ch3';

type Phase =
  | 'ARRIVING'
  | 'TRAVERSING'
  | 'STORM_HIT'
  | 'WARDEN_BATTLE'
  | 'POST_WARDEN'
  | 'DONE';

/**
 * StormCorridorScene — Ch.3 Scene 3. Kansas Storm Season.
 * A tornado covers the corridor. Lightning disrupts Sentinel sensors.
 * Mid-traverse, Warden Six appears (SIX_BEATEN_CH3 flag).
 * Storm damage mechanic: periodic HP drain while storm active.
 */
export class StormCorridorScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = 'ARRIVING';
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';

  // Storm state
  private _stormActive:       boolean = false;
  private _stormDamageTimer:  number  = 0;
  private _stormDamageInterval: number = 3000; // ms between storm damage ticks
  private _wardenTriggered:   boolean = false;

  // Visual
  private _stormOverlay!: Phaser.GameObjects.Rectangle;
  private _lightningTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'StormCorridorScene' });
  }

  create(): void {
    this._phase        = 'ARRIVING';
    this._inputEnabled = false;
    this._stormActive  = false;
    this._stormDamageTimer = 0;
    this._wardenTriggered = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawScene();
    this._buildPlayer();
    this._buildCamera();
    this._buildStormOverlay();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
      this._lightningTimer?.remove();
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.time.delayedCall(700, () => { this._startArriving(); });
  }

  update(_time: number, delta: number): void {
    if (this._phase === 'DONE') return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkWardenTrigger();
      this._checkExit();
    }

    if (this._stormActive) {
      this._updateStormDamage(delta);
    }
  }

  // ─── Scene drawing ────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Dark storm sky
    this.add.rectangle(MAP_W / 2, MAP_H * 0.3, MAP_W, MAP_H * 0.6, 0x223322);
    // Ground
    this.add.rectangle(MAP_W / 2, MAP_H * 0.7, MAP_W, MAP_H * 0.6, 0x334422);
    // Road
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, 70, 0x2a2a2a);

    // Grain silos (some damaged)
    const siloData = [
      { x: 500,  tilted: false },
      { x: 1100, tilted: true  },
      { x: 1700, tilted: false },
      { x: 2300, tilted: true  },
      { x: 3000, tilted: false },
    ];
    for (const s of siloData) {
      this.add.rectangle(s.x, MAP_H * 0.44, 28, 75, 0x445533)
        .setAngle(s.tilted ? -12 : 0);
    }

    // Exit marker
    this.add.rectangle(EXIT_X, MAP_H / 2, 50, 100, 0x445566).setAlpha(0.8);
    this.add.text(EXIT_X, MAP_H / 2 - 70, 'TOWER', {
      fontFamily: 'monospace', fontSize: '9px', color: '#8899aa',
    }).setOrigin(0.5);

    // Location text
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'STORM CORRIDOR, KS', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a3a2a',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);

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
    this.cameras.main.setZoom(1.4);
  }

  // ─── Storm overlay ────────────────────────────────────────────────────────

  private _buildStormOverlay(): void {
    const { width, height } = this.scale;
    this._stormOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x002200)
      .setScrollFactor(0).setDepth(15).setAlpha(0);
  }

  private _activateStorm(): void {
    this._stormActive = true;

    // Darken screen (storm ambience)
    this.tweens.add({
      targets:  this._stormOverlay,
      alpha:    0.35,
      duration: 2000,
    });

    // Periodic lightning flashes
    this._lightningTimer = this.time.addEvent({
      delay:    2500,
      loop:     true,
      callback: this._flashLightning,
      callbackScope: this,
    });

    // Storm damage dialogue
    this.dialogMgr.show('SYSTEM', D.storm_hits.system, () => {
      this.dialogMgr.show('MAYA', D.storm_hits.maya, () => {
        this._inputEnabled = true;
      });
    });
  }

  private _flashLightning(): void {
    const { width, height } = this.scale;
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xeeffee)
      .setScrollFactor(0).setDepth(20).setAlpha(0);

    this.tweens.add({
      targets:  flash,
      alpha:    { from: 0.5, to: 0 },
      duration: 150,
      onComplete: () => { flash.destroy(); },
    });

    // Lightning sensor disruption dialogue (once, mid-battle area)
    if (
      this._phase === 'TRAVERSING' &&
      this.player.sprite.x > MAP_W * 0.4 &&
      this.player.sprite.x < MAP_W * 0.7
    ) {
      this.time.delayedCall(200, () => {
        if (this._phase === 'TRAVERSING') {
          this._triggerLightningBattle();
        }
      });
    }
  }

  private _triggerLightningBattle(): void {
    this._phase = 'STORM_HIT';
    this._inputEnabled = false;

    this.dialogMgr.show('SYSTEM', D.mid_battle.system, () => {
      this.dialogMgr.show(this._playerName, D.mid_battle.player, () => {
        const initData: BattleInitData = {
          enemyKey:    'enforcer_unit',
          returnScene: 'StormCorridorScene',
          scripted:    false,
        };

        bus.once(EVENTS.BATTLE_END, () => {
          this._phase = 'TRAVERSING';
          this._inputEnabled = true;
        });

        this.scene.pause();
        this.scene.launch('BattleScene', initData);
      });
    });
  }

  // ─── Storm damage tick ────────────────────────────────────────────────────

  private _updateStormDamage(delta: number): void {
    if (this._phase !== 'TRAVERSING' && this._phase !== 'STORM_HIT') return;
    this._stormDamageTimer += delta;
    if (this._stormDamageTimer < this._stormDamageInterval) return;

    this._stormDamageTimer = 0;
    // Apply 5 HP storm damage to player (integer math)
    const STORM_DMG = 5;
    this._showStormDamage(STORM_DMG);
  }

  private _showStormDamage(amount: number): void {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height * 0.3, `-${amount} HP (storm)`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#44cc66',
    }).setScrollFactor(0).setDepth(30).setOrigin(0.5);

    this.tweens.add({
      targets:  txt,
      y:        txt.y - 30,
      alpha:    0,
      duration: 900,
      onComplete: () => { txt.destroy(); },
    });
  }

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = 'ARRIVING';

    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('MAYA', D.arriving.maya, () => {
        this._phase = 'TRAVERSING';
        this._inputEnabled = true;
        // Storm activates after a short delay
        this.time.delayedCall(3000, () => { this._activateStorm(); });
        this._showHint('Move east. The storm is cover — and danger.', 5000);
      });
    });
  }

  // ─── Warden Six encounter ─────────────────────────────────────────────────

  private _checkWardenTrigger(): void {
    if (this._wardenTriggered) return;
    if (this._phase !== 'TRAVERSING') return;
    if (this.player.sprite.x < WARDEN_TRIGGER_X) return;

    this._wardenTriggered = true;
    this._phase = 'WARDEN_BATTLE';
    this._inputEnabled = false;

    this.dialogMgr.show('SYSTEM', D['storm_corridor.warden_six.return'].system, () => {
      this.dialogMgr.show('WARDEN SIX', D['storm_corridor.warden_six.return'].warden_six, () => {
        this.dialogMgr.show('MAYA', D['storm_corridor.warden_six.return'].maya, () => {
          this._launchWardenBattle();
        });
      });
    });
  }

  private _launchWardenBattle(): void {
    const initData: BattleInitData = {
      enemyKey:    'warden_six_ch3',
      returnScene: 'StormCorridorScene',
      bossConfig: {
        phases: WARDEN_SIX_CH3_PHASES.map(p => ({
          hpThreshold: p.hpThreshold,
          atkBoost:    p.atkBoost,
          dialogue:    [...p.dialogue],
        })),
      },
    };

    bus.once(EVENTS.BATTLE_END, () => {
      this._onWardenDefeated();
    });

    this.scene.pause();
    this.scene.launch('BattleScene', initData);
  }

  private _onWardenDefeated(): void {
    setFlag(this.registry, SIX_BEATEN_CH3, true);
    this._phase = 'POST_WARDEN';

    this.dialogMgr.show('SYSTEM', D.warden_six_defeated.system, () => {
      this.dialogMgr.show('MAYA', D.warden_six_defeated.maya, () => {
        this._phase = 'TRAVERSING';
        this._inputEnabled = true;

        // Storm begins to pass
        this.time.delayedCall(4000, () => { this._stormPasses(); });
      });
    });
  }

  private _stormPasses(): void {
    this._stormActive = false;
    this._lightningTimer?.remove();
    this._lightningTimer = null;

    this.tweens.add({
      targets:  this._stormOverlay,
      alpha:    0,
      duration: 3000,
    });

    this.dialogMgr.show('SYSTEM', D.storm_passing.system, () => {
      this.dialogMgr.show(this._playerName, D.storm_passing.player, () => {
        this.dialogMgr.show('MAYA', D.storm_passing.maya, () => {
          // Already in TRAVERSING — player continues to exit
        });
      });
    });
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== 'TRAVERSING' && this._phase !== 'POST_WARDEN') return;
    if (!this._wardenTriggered) return; // must face Warden Six first
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_MIN || y > EXIT_Y_MAX) return;

    this._phase = 'DONE';
    this._inputEnabled = false;

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('RadioTowerScene');
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

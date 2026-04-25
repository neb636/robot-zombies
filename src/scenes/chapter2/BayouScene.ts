import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { PartyManager }    from '../../party/PartyManager.js';
import { setFlag }         from '../../utils/constants.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import D from '../../data/dialogue/chapter2/bayou.json';

// ─── Layout constants ──────────────────────────────────────────────────────────
const MAP_W = 2000;
const MAP_H = 1200;

const PLAYER_START_X = 200;
const PLAYER_START_Y = 600;

// Bayou waypoints — the path winds through the map
const CAMP_TRIGGER_X  = 900;
const CAMP_TRIGGER_Y  = 600;
const WATER_TRIGGER_X = 1400;
const WATER_TRIGGER_Y = 600;
const LOSS_TRIGGER_X  = 1700;
const LOSS_TRIGGER_Y  = 600;
const EXIT_X          = 1900;
const EXIT_Y_TOP      = 350;
const EXIT_Y_BOT      = 850;

// ─── Phases ───────────────────────────────────────────────────────────────────
const PHASE = {
  ENTERING:        'ENTERING',
  EXPLORING:       'EXPLORING',
  NIGHT_CAMP:      'NIGHT_CAMP',
  WATER_WARNING:   'WATER_WARNING',
  BATTLE:          'BATTLE',
  ELIAS_LOSS:      'ELIAS_LOSS',
  AFTER_LOSS:      'AFTER_LOSS',
  VAULT_APPROACH:  'VAULT_APPROACH',
  DONE:            'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/**
 * BayouScene — Chapter 2: "The Bayou Run"
 *
 * No drone coverage — terrain blocks sensors. Random encounters with
 * Bayou Swimmers. Elias loss scene triggers at the deep channel crossing.
 *
 * CRITICAL: Elias loss is scripted, unhurried, permanent.
 * - PartyManager.removeMember('elias') is called.
 * - ELIAS_LOST flag is set.
 * - ELIAS_DRAIN_ACTIVE flag is set (survival layer reads this to double drain).
 *
 * Per CLAUDE.md: "Don't soften these moments or add redemption arcs.
 * Their deaths are permanent and the game feels different afterward."
 */
export class BayouScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:           Phase   = PHASE.ENTERING;
  private _inputEnabled:    boolean = false;
  private _playerName:      string  = 'Arlo';

  private _campTriggered:   boolean = false;
  private _waterTriggered:  boolean = false;
  private _lossTriggered:   boolean = false;

  // Encounter tracking
  private _encounterCount:  number = 0;
  private _encounterTimer:  Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'BayouScene' });
  }

  create(): void {
    this._phase          = PHASE.ENTERING;
    this._inputEnabled   = false;
    this._campTriggered  = false;
    this._waterTriggered = false;
    this._lossTriggered  = false;
    this._encounterCount = 0;
    this._playerName     = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._drawScene();
    this._buildPlayer();
    this._buildCamera();
    this._scheduleEncounters();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
      this._encounterTimer?.destroy();
    });

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(1300, () => { this._startEntering(); });
  }

  update(): void {
    if (this._phase === PHASE.DONE) return;
    if (
      this._inputEnabled &&
      !this.dialogMgr.isActive() &&
      this._phase === PHASE.EXPLORING
    ) {
      this.player.update();
      this._checkTriggers();
    }
  }

  // ─── Scene drawing ──────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Night sky — near black
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x050810).setDepth(0);

    // Bayou ground — dark moss
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H * 0.5, 0x0a1205).setDepth(1);

    // Water channels (dark, threatening)
    const channels = [
      { x: 600,  y: MAP_H * 0.45, w: 80,  h: 400 },
      { x: 1300, y: MAP_H * 0.5,  w: 120, h: 500 },
      { x: 1700, y: MAP_H * 0.5,  w: 200, h: MAP_H },
    ];
    for (const ch of channels) {
      this.add.rectangle(ch.x, ch.y, ch.w, ch.h, 0x040d14).setDepth(2);
    }

    // Cypress silhouettes
    const trees = [
      { x: 350, y: 300 }, { x: 550, y: 200 }, { x: 800, y: 280 },
      { x: 1050, y: 180 }, { x: 1250, y: 250 }, { x: 1500, y: 200 },
      { x: 1800, y: 230 },
    ];
    for (const t of trees) {
      // Trunk
      this.add.rectangle(t.x, t.y + 100, 8, 180, 0x221a0a).setDepth(3);
      // Canopy
      this.add.rectangle(t.x, t.y, 60, 80, 0x0a1808).setDepth(3);
    }

    // Fog — thin dark overlay
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x050d08)
      .setAlpha(0.25).setDepth(6);

    // Night camp marker
    this.add.text(CAMP_TRIGGER_X, CAMP_TRIGGER_Y - 80, '· CAMP ·', {
      fontFamily: 'monospace', fontSize: '9px', color: '#446633',
    }).setOrigin(0.5).setDepth(5);

    // Deep channel warning
    this.add.text(LOSS_TRIGGER_X - 50, LOSS_TRIGGER_Y - 100, '— DEEP CHANNEL —', {
      fontFamily: 'monospace', fontSize: '9px', color: '#2a3a44',
    }).setOrigin(0.5).setDepth(5);

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

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.06, 0.06);
    this.cameras.main.setZoom(1.6);
  }

  // ─── Random encounters ──────────────────────────────────────────────────────

  private _scheduleEncounters(): void {
    // Random bayou swimmer encounter while exploring — max 2 before loss scene
    this._encounterTimer = this.time.addEvent({
      delay:     18000,
      loop:      true,
      callback:  () => {
        if (
          this._phase !== PHASE.EXPLORING ||
          this._encounterCount >= 2 ||
          this._lossTriggered
        ) return;
        if (Math.random() < 0.5) {
          this._encounterCount++;
          this._inputEnabled = false;
          this._launchSwimmerBattle();
        }
      },
    });
  }

  private _launchSwimmerBattle(): void {
    const initData: BattleInitData = {
      enemyKey:    'bayou_swimmer',
      returnScene: 'BayouScene',
      scripted:    false,
    };
    this.scene.launch('BattleScene', initData);
    this.scene.pause();

    this.events.once('resume', () => {
      this._inputEnabled = true;
    });
  }

  // ─── Story flow ──────────────────────────────────────────────────────────────

  private _startEntering(): void {
    this.dialogMgr.show('DEJA', D.entering.deja as string[], () => {
      this.dialogMgr.show('ELIAS', D.entering.elias as string[], () => {
        this.dialogMgr.show('MAYA', D.entering.maya as string[], () => {
          this._phase = PHASE.EXPLORING;
          this._inputEnabled = true;
          this._showHint('Follow the high ground east.', 5000);
        });
      });
    });
  }

  // ─── Trigger checks ──────────────────────────────────────────────────────────

  private _checkTriggers(): void {
    const { x, y } = this.player.sprite;

    // Night camp
    if (!this._campTriggered) {
      const dist = Phaser.Math.Distance.Between(x, y, CAMP_TRIGGER_X, CAMP_TRIGGER_Y);
      if (dist < 100) {
        this._campTriggered = true;
        this._inputEnabled = false;
        this._triggerNightCamp();
        return;
      }
    }

    // Water warning
    if (this._campTriggered && !this._waterTriggered) {
      const dist = Phaser.Math.Distance.Between(x, y, WATER_TRIGGER_X, WATER_TRIGGER_Y);
      if (dist < 100) {
        this._waterTriggered = true;
        this._inputEnabled = false;
        this._triggerWaterWarning();
        return;
      }
    }

    // Elias loss — deep channel crossing
    if (this._waterTriggered && !this._lossTriggered) {
      const dist = Phaser.Math.Distance.Between(x, y, LOSS_TRIGGER_X, LOSS_TRIGGER_Y);
      if (dist < 100) {
        this._lossTriggered = true;
        this._encounterTimer?.remove();
        this._inputEnabled = false;
        this._triggerEliasLoss();
        return;
      }
    }

    // Exit to Vault 49
    if (this._phase === PHASE.VAULT_APPROACH) {
      if (x > EXIT_X && y > EXIT_Y_TOP && y < EXIT_Y_BOT) {
        this._phase = PHASE.DONE;
        this._inputEnabled = false;
        this.mobileControls.hideInteract();
        this.cameras.main.fadeOut(1200, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
          if (p === 1) this.scene.start('Vault49Scene');
        });
      }
    }
  }

  // ─── Night camp ──────────────────────────────────────────────────────────────

  private _triggerNightCamp(): void {
    this._phase = PHASE.NIGHT_CAMP;
    // Dim the scene — night camp feel
    this.cameras.main.setAlpha(0.85);

    this.dialogMgr.show('ELIAS', D.night_camp.elias as string[], () => {
      this.dialogMgr.show(this._playerName, D.night_camp.player as string[], () => {
        this.dialogMgr.show('ELIAS', D.night_camp.elias2 as string[], () => {
          this.cameras.main.setAlpha(1);
          this._phase = PHASE.EXPLORING;
          this._inputEnabled = true;
        });
      });
    });
  }

  // ─── Water warning ──────────────────────────────────────────────────────────

  private _triggerWaterWarning(): void {
    this._phase = PHASE.WATER_WARNING;
    this.dialogMgr.show('DEJA', D.water_sounds.deja as string[], () => {
      this._phase = PHASE.EXPLORING;
      this._inputEnabled = true;
    });
  }

  // ─── Elias loss scene ─────────────────────────────────────────────────────────
  //
  // This scene is the heart of Chapter 2. It must be:
  // - Unhurried. No rushing the beats.
  // - Not softened. No last-minute speech from Elias. He says three words.
  // - Permanent. PartyManager.removeMember('elias') is called here.
  // - Mechanically reflected before dialogue ends:
  //   ELIAS_LOST and ELIAS_DRAIN_ACTIVE flags are set mid-scene.
  //
  // The bayou keeps its own ledger.

  private _triggerEliasLoss(): void {
    this._phase = PHASE.ELIAS_LOSS;

    // Slow camera, darken
    this.cameras.main.setLerp(0.02, 0.02);

    this.dialogMgr.show('NARRATOR', D.elias.last_stand.pre as string[], () => {
      // Pause on silence — 1200ms before the action
      this.time.delayedCall(1200, () => {
        this.dialogMgr.show('NARRATOR', D.elias.last_stand.during as string[], () => {
          // Elias's words — three of them. No more.
          this.dialogMgr.show('ELIAS', D.elias.last_stand.elias_words as string[], () => {

            // === MECHANICAL CONSEQUENCE — before more dialogue ===
            // Flags set immediately. Survival layer reads ELIAS_DRAIN_ACTIVE.
            new PartyManager(this.registry).removeMember('elias');
            setFlag(this.registry, 'ELIAS_LOST', true);
            setFlag(this.registry, 'ELIAS_DRAIN_ACTIVE', true);

            // Brief silence — the game doesn't explain this
            this.time.delayedCall(2000, () => {
              this.dialogMgr.show('NARRATOR', D.elias.last_stand.post as string[], () => {
                // Loss notice (no death screen — just text)
                this._showLossNotice(() => {
                  this._triggerAfterLoss();
                });
              });
            });
          });
        });
      });
    });
  }

  private _showLossNotice(onDone: () => void): void {
    const { width, height } = this.scale;

    // Full-screen near-black
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(50);

    this.tweens.add({
      targets:  overlay,
      alpha:    0.9,
      duration: 1500,
      onComplete: () => {
        const notice = this.add.text(width / 2, height / 2, [
          'ELIAS',
          '',
          'The bayou keeps its own ledger.',
        ].join('\n'), {
          fontFamily:      'monospace',
          fontSize:        '16px',
          color:           '#886644',
          align:           'center',
          stroke:          '#000000',
          strokeThickness: 2,
          lineSpacing:     8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);

        this.tweens.add({
          targets:  notice,
          alpha:    1,
          duration: 1200,
          hold:     3500,
          yoyo:     true,
          onComplete: () => {
            notice.destroy();
            this.tweens.add({
              targets:  overlay,
              alpha:    0,
              duration: 1000,
              onComplete: () => {
                overlay.destroy();
                onDone();
              },
            });
          },
        });
      },
    });
  }

  // ─── After loss ──────────────────────────────────────────────────────────────

  private _triggerAfterLoss(): void {
    this._phase = PHASE.AFTER_LOSS;
    this.cameras.main.setLerp(0.08, 0.08);

    this.dialogMgr.show('DEJA', D.after_loss.deja as string[], () => {
      this.dialogMgr.show('MAYA', D.after_loss.maya as string[], () => {
        this.dialogMgr.show(this._playerName, D.after_loss.player as string[], () => {
          // Brief pause before vault approach — let it sit
          this.time.delayedCall(1000, () => {
            this.dialogMgr.show('DEJA', D.vault_approach.deja as string[], () => {
              this._phase = PHASE.VAULT_APPROACH;
              this._inputEnabled = true;
              this._showHint('Follow the power lines southeast.', 6000);
            });
          });
        });
      });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private _showHint(msg: string, autofade = 4000): void {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 40, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#446633',
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

import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { bus }             from '../../utils/EventBus.js';
import { EVENTS, setFlag, getFlags } from '../../utils/constants.js';
import { PartyManager }    from '../../party/PartyManager.js';
import type { WasdKeys, BattleInitData } from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter3/radio_tower.json';
import { SENTINEL_SPIRE_PHASES } from '../../entities/enemies/chapter3/sentinelSpire.js';

const MAP_W = 1600;
const MAP_H = 3200; // Vertical scroll — climbing the tower

const PLAYER_START_X = MAP_W / 2;
const PLAYER_START_Y = MAP_H - 100;

// NPC positions
const JEROME_X = MAP_W / 2;
const JEROME_Y = MAP_H - 400;

// Spire fight trigger (near top)
const SPIRE_TRIGGER_Y = 200;

// Exit at the very bottom (world map access after Spire)
const EXIT_Y = MAP_H - 40;
const EXIT_X_MIN = MAP_W / 2 - 80;
const EXIT_X_MAX = MAP_W / 2 + 80;

// Flags
const FLAG_JEROME_RECRUITED = 'jerome_recruited';
const FLAG_STATIC_REAL_MET  = 'static_real_met';
const FLAG_GHOST_KEY        = 'ghost_key_obtained';
const FLAG_TILLY_TRUSTED    = 'tilly_trusted'; // set externally; gates Tilly scene
const FLAG_SPIRE_BEATEN     = 'sentinel_spire_beaten';
const FLAG_FAST_TRAVEL_UNLOCKED = 'radio_tower_fast_travel';

type Phase =
  | 'ARRIVING'
  | 'JEROME_MEET'
  | 'CLIMBING'
  | 'GHOST_REVEAL'
  | 'SPIRE_FIGHT'
  | 'POST_SPIRE'
  | 'SAM_CAMEO'
  | 'TILLY_SCENE'
  | 'DONE';

/**
 * RadioTowerScene — Ch.3 Scene 4. Kansas Radio Tower / Fast Travel Hub.
 *
 * Critical beats in order:
 *   1. Jerome recruitment (radio_tower.jerome.recruitment)
 *   2. Ghost reveal on floor 3 (radio_tower.ghost.reveal)
 *   3. Sentinel Spire boss fight
 *   4. Post-Spire broadcast + Sam cameo (radio_tower.sam.cameo)
 *   5. Tilly speaks — gated on TILLY_TRUSTED flag (radio_tower.tilly.speaks)
 *   6. Fast travel hub unlocked
 */
export class RadioTowerScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = 'ARRIVING';
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';

  // Tracking
  private _jeromeTriggered:  boolean = false;
  private _ghostTriggered:   boolean = false;
  private _spireTriggered:   boolean = false;

  // Jerome sprite (warm brown)
  private _jeromeSprite!: Phaser.GameObjects.Rectangle;

  // E-key interact
  private _interactKey!:  Phaser.Input.Keyboard.Key;
  private _nearJerome:    boolean = false;

  constructor() {
    super({ key: 'RadioTowerScene' });
  }

  create(): void {
    this._phase        = 'ARRIVING';
    this._inputEnabled = false;
    this._jeromeTriggered = false;
    this._ghostTriggered  = false;
    this._spireTriggered  = false;
    this._nearJerome = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._drawScene();
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();
    this._buildInteractKey();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => {
      this.mobileControls.destroy();
      document.removeEventListener('interact:tap', this._onInteractTap);
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(900, () => { this._startArriving(); });
  }

  update(): void {
    if (this._phase === 'DONE') return;

    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this.player.update();
      this._checkJeromeProximity();
      this._checkGhostTrigger();
      this._checkSpireTrigger();
      this._checkExit();
    }
  }

  // ─── Scene drawing ────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Tower interior — vertical climb
    // Background
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x1a1a22);

    // Floor platforms
    const FLOOR_COUNT = 8;
    const floorSpacing = MAP_H / FLOOR_COUNT;

    for (let i = 0; i < FLOOR_COUNT; i++) {
      const y = MAP_H - (i + 1) * floorSpacing + floorSpacing / 2;
      // Floor plate
      this.add.rectangle(MAP_W / 2, y + floorSpacing * 0.45, MAP_W, 12, 0x334455);
      // Floor label
      this.add.text(30, y + floorSpacing * 0.45 - 8, `FL ${i + 1}`, {
        fontFamily: 'monospace', fontSize: '8px', color: '#334455',
      }).setDepth(2);

      // Equipment / clutter per floor
      const clutter = [
        { x: 80,          color: 0x223344, w: 24, h: 40 },
        { x: MAP_W - 80,  color: 0x223344, w: 24, h: 40 },
        { x: MAP_W * 0.4, color: 0x334433, w: 18, h: 28 },
      ];
      for (const c of clutter) {
        this.add.rectangle(c.x, y + floorSpacing * 0.25, c.w, c.h, c.color).setAlpha(0.7);
      }
    }

    // Transmitter equipment at floor 1 (bottom)
    this.add.rectangle(MAP_W * 0.3, MAP_H - 200, 60, 80, 0x335566);
    this.add.rectangle(MAP_W * 0.7, MAP_H - 200, 40, 60, 0x224455);
    this.add.text(MAP_W / 2, MAP_H - 260, 'WKFR TRANSMITTER', {
      fontFamily: 'monospace', fontSize: '9px', color: '#5588aa',
    }).setOrigin(0.5).setDepth(3);

    // Floor 3 panel — Ghost's hint location (east wall)
    this.add.rectangle(MAP_W - 30, MAP_H - 3 * (MAP_H / FLOOR_COUNT) + 80, 16, 30, 0x224488)
      .setDepth(3).setAlpha(0.8);
    this.add.text(MAP_W - 60, MAP_H - 3 * (MAP_H / FLOOR_COUNT) + 60, 'PANEL', {
      fontFamily: 'monospace', fontSize: '7px', color: '#4466aa',
    }).setDepth(3);

    // Top platform — Spire arena
    this.add.rectangle(MAP_W / 2, 120, MAP_W, 60, 0x223344);
    this.add.text(MAP_W / 2, 70, '[ BROADCAST ARRAY ]', {
      fontFamily: 'monospace', fontSize: '9px', color: '#446688',
    }).setOrigin(0.5).setDepth(3);

    // Exit at base
    this.add.rectangle(MAP_W / 2, MAP_H - 20, 160, 20, 0x223322);
    this.add.text(MAP_W / 2, MAP_H - 50, 'EXIT — WORLD MAP', {
      fontFamily: 'monospace', fontSize: '8px', color: '#446644',
    }).setOrigin(0.5).setDepth(3);

    // Location label
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'RADIO TOWER, KS', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a3a4a',
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
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.6);
  }

  // ─── NPCs ────────────────────────────────────────────────────────────────

  private _buildNPCs(): void {
    // Jerome — warm brown/mahogany
    this._jeromeSprite = this.add.rectangle(JEROME_X, JEROME_Y, 22, 36, 0x885522).setDepth(5);
    this.add.text(JEROME_X, JEROME_Y - 28, 'JEROME', {
      fontFamily: 'monospace', fontSize: '8px', color: '#aa7744',
    }).setOrigin(0.5).setDepth(6);
  }

  // ─── Interact key ────────────────────────────────────────────────────────

  private _buildInteractKey(): void {
    this._interactKey = this.input.keyboard!.addKey('E');
    document.addEventListener('interact:tap', this._onInteractTap);
  }

  private _onInteractTap = (): void => {
    if (this._inputEnabled && this._nearJerome && !this._jeromeTriggered) {
      this._triggerJeromeRecruitment();
    }
  };

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = 'ARRIVING';

    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('MAYA', D.arriving.maya, () => {
        this._phase = 'JEROME_MEET';
        this._inputEnabled = true;
        this._showHint('Find Jerome on the ground floor. (E or tap)', 5000);
      });
    });
  }

  // ─── Jerome proximity ────────────────────────────────────────────────────

  private _checkJeromeProximity(): void {
    if (this._jeromeTriggered) return;
    if (this._phase !== 'JEROME_MEET') return;

    const dist = Math.hypot(
      this.player.sprite.x - JEROME_X,
      this.player.sprite.y - JEROME_Y,
    );

    const wasNear = this._nearJerome;
    this._nearJerome = dist < 80;

    if (this._nearJerome !== wasNear) {
      if (this._nearJerome) {
        this.mobileControls.showInteract('Talk');
      } else {
        this.mobileControls.hideInteract();
      }
    }

    if (this._nearJerome && Phaser.Input.Keyboard.JustDown(this._interactKey)) {
      this._triggerJeromeRecruitment();
    }
  }

  // ─── Jerome recruitment — radio_tower.jerome.recruitment ─────────────────

  private _triggerJeromeRecruitment(): void {
    this._jeromeTriggered = true;
    this._nearJerome = false;
    this.mobileControls.hideInteract();
    this._inputEnabled = false;
    this._phase = 'CLIMBING';

    const jr = D['radio_tower.jerome.recruitment'];

    this.dialogMgr.show('JEROME', jr.jerome, () => {
      this.dialogMgr.show(this._playerName, jr.player, () => {
        this.dialogMgr.show('JEROME', jr.jerome, () => {
          this.dialogMgr.show('MAYA', jr.maya, () => {
            this.dialogMgr.show('JEROME', jr.jerome, () => {
              this._jeromeJoins();
            });
          });
        });
      });
    });
  }

  private _jeromeJoins(): void {
    setFlag(this.registry, FLAG_JEROME_RECRUITED, true);
    new PartyManager(this.registry).addMember('jerome', 3);

    // Jerome now travels with the party — dim his static sprite
    this._jeromeSprite.setAlpha(0.4);

    const { width, height } = this.scale;
    const joinText = this.add.text(width / 2, height / 2, 'JEROME joined the party.', {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      '#aa7744',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40).setAlpha(0);

    this.tweens.add({
      targets:  joinText,
      alpha:    { from: 0, to: 1 },
      duration: 600,
      yoyo:     true,
      hold:     1200,
      onComplete: () => {
        joinText.destroy();
        this._inputEnabled = true;
        this._showHint('Climb the tower. Find the transmitter.', 4000);
      },
    });
  }

  // ─── Ghost reveal — floor 3 trigger ──────────────────────────────────────

  private _checkGhostTrigger(): void {
    if (this._ghostTriggered) return;
    if (this._phase !== 'CLIMBING') return;

    const FLOOR_3_Y = MAP_H - 3 * (MAP_H / 8) + (MAP_H / 8) / 2;
    if (this.player.sprite.y > FLOOR_3_Y + 60) return;

    this._ghostTriggered = true;
    this._phase = 'GHOST_REVEAL';
    this._inputEnabled = false;

    this._triggerGhostReveal();
  }

  private _triggerGhostReveal(): void {
    setFlag(this.registry, FLAG_STATIC_REAL_MET, true);

    const gr = D['radio_tower.ghost.reveal'];

    this.dialogMgr.show('SYSTEM', gr.system, () => {
      this.dialogMgr.show(this._playerName, gr.player, () => {
        this.dialogMgr.show('GHOST', gr.ghost, () => {
          this.dialogMgr.show('MAYA', gr.maya, () => {
            this.dialogMgr.show('GHOST', gr.ghost, () => {
              this.dialogMgr.show('SYSTEM', gr.system_post, () => {
                this.dialogMgr.show('JEROME', gr.jerome, () => {
                  setFlag(this.registry, FLAG_GHOST_KEY, true);
                  this._phase = 'CLIMBING';
                  this._inputEnabled = true;
                  this._showHint('Blue wire. East wall. Trust it.', 4000);
                });
              });
            });
          });
        });
      });
    });
  }

  // ─── Sentinel Spire fight ────────────────────────────────────────────────

  private _checkSpireTrigger(): void {
    if (this._spireTriggered) return;
    if (this._phase !== 'CLIMBING') return;
    if (this.player.sprite.y > SPIRE_TRIGGER_Y) return;

    this._spireTriggered = true;
    this._phase = 'SPIRE_FIGHT';
    this._inputEnabled = false;

    this.dialogMgr.show('SYSTEM', D.pre_spire.system, () => {
      this.dialogMgr.show('SENTINEL SPIRE', D.pre_spire.spire, () => {
        this.dialogMgr.show('JEROME', D.pre_spire.jerome, () => {
          this._launchSpireBattle();
        });
      });
    });
  }

  private _launchSpireBattle(): void {
    const initData: BattleInitData = {
      enemyKey:    'sentinel_spire',
      returnScene: 'RadioTowerScene',
      bossConfig: {
        phases: SENTINEL_SPIRE_PHASES.map(p => ({
          hpThreshold: p.hpThreshold,
          atkBoost:    p.atkBoost,
          dialogue:    [...p.dialogue],
        })),
      },
    };

    bus.once(EVENTS.BATTLE_END, () => {
      this._onSpireDefeated();
    });

    this.scene.pause();
    this.scene.launch('BattleScene', initData);
  }

  private _onSpireDefeated(): void {
    setFlag(this.registry, FLAG_SPIRE_BEATEN, true);
    setFlag(this.registry, FLAG_FAST_TRAVEL_UNLOCKED, true);
    this._phase = 'POST_SPIRE';

    const post = D.spire_defeated;

    this.dialogMgr.show('SYSTEM', post.system, () => {
      this.dialogMgr.show('JEROME', post.jerome, () => {
        this.dialogMgr.show('SYSTEM', post.system_post, () => {
          this._triggerSamCameo();
        });
      });
    });
  }

  // ─── Sam cameo ───────────────────────────────────────────────────────────

  private _triggerSamCameo(): void {
    this._phase = 'SAM_CAMEO';

    const sam = D['radio_tower.sam.cameo'];

    this.dialogMgr.show('SYSTEM', sam.system, () => {
      this.dialogMgr.show('SAM', sam.sam, () => {
        this.dialogMgr.show('JEROME', sam.jerome, () => {
          this.dialogMgr.show('SAM', sam.sam, () => {
            this.dialogMgr.show('JEROME', sam.jerome, () => {
              this.dialogMgr.show('SYSTEM', sam.system_post, () => {
                this._checkTillyGate();
              });
            });
          });
        });
      });
    });
  }

  // ─── Tilly scene — gated on TILLY_TRUSTED ────────────────────────────────

  private _checkTillyGate(): void {
    const flags = getFlags(this.registry);
    if (flags[FLAG_TILLY_TRUSTED] === true) {
      this._triggerTillyScene();
    } else {
      this._postBroadcast();
    }
  }

  private _triggerTillyScene(): void {
    this._phase = 'TILLY_SCENE';

    const tilly = D['radio_tower.tilly.speaks'];

    this.dialogMgr.show('SYSTEM', tilly.system, () => {
      this.dialogMgr.show('TILLY', tilly.tilly, () => {
        this.dialogMgr.show('JEROME', tilly.jerome, () => {
          this.dialogMgr.show('TILLY', tilly.tilly, () => {
            this.dialogMgr.show('SYSTEM', tilly.system_post, () => {
              this._postBroadcast();
            });
          });
        });
      });
    });
  }

  private _postBroadcast(): void {
    this.dialogMgr.show(this._playerName, D.departure.player, () => {
      this.dialogMgr.show('MAYA', D.departure.maya, () => {
        this.dialogMgr.show('JEROME', D.departure.jerome, () => {
          this._inputEnabled = true;
          this._showHint('Fast travel hub unlocked. Head back down to exit.', 5000);

          // Unlock fast travel node in WorldMapManager (registry signal)
          this.registry.set('ch3_radio_tower_unlocked', true);
        });
      });
    });
  }

  // ─── Exit to world map ───────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase !== 'POST_SPIRE' && this._phase !== 'SAM_CAMEO' && this._phase !== 'TILLY_SCENE') {
      // Only allow exit after spire is down — check if inputEnabled allows it
      if (!getFlags(this.registry)[FLAG_SPIRE_BEATEN]) return;
    }
    const { x, y } = this.player.sprite;
    if (y < EXIT_Y - 80) return;
    if (x < EXIT_X_MIN || x > EXIT_X_MAX) return;

    this._phase = 'DONE';
    this._inputEnabled = false;

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) this.scene.start('WorldMapScene');
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

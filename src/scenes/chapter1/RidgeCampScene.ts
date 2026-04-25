import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag }         from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import { SAM_HUSBAND_RIFLE_FOUND } from '../../characters/sam.js';
import { TILLY_BOND_1, TILLY_TRUSTED } from '../../characters/tilly.js';
import D from '../../data/dialogue/chapter1/ridge_camp.json';

// ─── Layout ──────────────────────────────────────────────────────────────────

const MAP_W = 1000;
const MAP_H = 600;

const PLAYER_START_X = 100;
const PLAYER_START_Y = 320;

// NPC positions
const SAM_X  = 320;
const SAM_Y  = 360;
const TILLY_X = 560;
const TILLY_Y = 300;
const ROOK_X  = 740;
const ROOK_Y  = 340;

// Rifle collectible (east trail lookout)
const RIFLE_X = 920;
const RIFLE_Y = 200;

// Mine exit trigger (east edge)
const MINE_EXIT_X     = 960;
const MINE_EXIT_Y_TOP = 260;
const MINE_EXIT_Y_BOT = 400;

const NPC_TALK_DIST   = 60;
const ITEM_PICKUP_DIST = 50;

// ─── Phase ───────────────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING:    'ARRIVING',
  CAMP:        'CAMP',
  CAMPFIRE:    'CAMPFIRE',
  PRE_MINE:    'PRE_MINE',
  DONE:        'DONE',
} as const;
type Phase = typeof PHASE[keyof typeof PHASE];

/** NPC interaction state. */
interface NpcState {
  x: number;
  y: number;
  talked: boolean;
}

/**
 * RidgeCampScene — Ridge Camp safe house.
 * 3 interactive NPCs: Sam (rifle side quest), Tilly (campfire bond), Rook (intel + Warden Six warning).
 * Sets TILLY_BOND_1, TILLY_TRUSTED, SAM_HUSBAND_RIFLE_FOUND flags.
 * SAW_MARCUS_HARVEST_TOWN is primed by the rumors_harvest_town dialogue.
 * Exits east to HarlanMineScene.
 */
export class RidgeCampScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:           Phase   = PHASE.ARRIVING;
  private _inputEnabled:    boolean = false;
  private _playerName:      string  = 'Arlo';

  // NPC state
  private _sam:   NpcState = { x: SAM_X,   y: SAM_Y,   talked: false };
  private _tilly: NpcState = { x: TILLY_X, y: TILLY_Y, talked: false };
  private _rook:  NpcState = { x: ROOK_X,  y: ROOK_Y,  talked: false };

  // Side quest flags
  private _rifleFound:       boolean = false;
  private _rifleReturned:    boolean = false;
  private _tillyBondDone:    boolean = false;
  private _rookIntelDone:    boolean = false;
  private _harvestTownPrimed:boolean = false;

  // Interact key
  private _eKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'RidgeCampScene' });
  }

  create(): void {
    this._phase            = PHASE.ARRIVING;
    this._inputEnabled     = false;
    this._sam.talked       = false;
    this._tilly.talked     = false;
    this._rook.talked      = false;
    this._rifleFound       = false;
    this._rifleReturned    = false;
    this._tillyBondDone    = false;
    this._rookIntelDone    = false;
    this._harvestTownPrimed = false;
    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'Arlo';

    this._drawWorld();
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this._buildPlayer();
    this._buildNPCs();
    this._buildCamera();
    this._buildHUD();
    this._setupInteract();

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
      this._checkRifleProximity();
      this._checkMineExit();
    }
  }

  // ─── World ────────────────────────────────────────────────────────────────

  private _drawWorld(): void {
    const g = this.add.graphics();

    // Night sky
    g.fillStyle(0x060810);
    g.fillRect(0, 0, MAP_W, MAP_H);

    // Ground
    g.fillStyle(0x1a1408);
    g.fillRect(0, 200, MAP_W, MAP_H - 200);

    // Campfire glow
    g.fillStyle(0x332200, 0.4);
    g.fillCircle(460, 360, 100);
    // Fire
    g.fillStyle(0xff7700, 0.8);
    g.fillTriangle(445, 380, 475, 380, 460, 350);
    g.fillStyle(0xffaa00, 0.9);
    g.fillTriangle(453, 378, 469, 378, 461, 358);

    // Firelight logs
    g.fillStyle(0x3d2010);
    g.fillRect(440, 376, 40, 8);

    // Perimeter fence (rough wooden posts)
    for (let fx = 0; fx < MAP_W; fx += 60) {
      g.fillStyle(0x3d2010);
      g.fillRect(fx, 160, 6, 40);
    }
    g.lineStyle(2, 0x2a1a08);
    g.lineBetween(0, 180, MAP_W, 180);

    // Tents
    this._drawTent(g, 150, 280, 0x224433);
    this._drawTent(g, 700, 280, 0x332244);
    this._drawTent(g, 200, 400, 0x334422);
    this._drawTent(g, 650, 400, 0x224422);

    // Sam's area (cooking fire)
    g.fillStyle(0x2a1810);
    g.fillRect(280, 340, 80, 40);
    g.fillStyle(0xff5500, 0.5);
    g.fillCircle(320, 350, 12);

    // Lookout trail (east trail hint)
    g.fillStyle(0x2a1f0e, 0.6);
    g.fillRect(880, 150, 30, 200);
    // Rifle marker
    g.fillStyle(0x886644, 0.8);
    g.fillRect(RIFLE_X - 3, RIFLE_Y - 8, 6, 16);

    // East exit
    g.fillStyle(0x334433, 0.3);
    g.fillRect(MAP_W - 40, MINE_EXIT_Y_TOP, 40, MINE_EXIT_Y_BOT - MINE_EXIT_Y_TOP);
  }

  private _drawTent(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    g.fillStyle(color);
    g.fillTriangle(x, y, x + 70, y, x + 35, y - 40);
    g.fillStyle(0x1a1010);
    g.fillRect(x + 25, y - 10, 20, 10);
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
    // Sam — warm brown
    this.add.rectangle(SAM_X, SAM_Y, 16, 26, 0xcc8866).setDepth(5);
    this.add.text(SAM_X, SAM_Y - 22, 'SAM', {
      fontFamily: 'monospace', fontSize: '8px', color: '#cc8866',
    }).setOrigin(0.5).setDepth(6);

    // Tilly — muted green
    this.add.rectangle(TILLY_X, TILLY_Y, 14, 24, 0x88aa66).setDepth(5);
    this.add.text(TILLY_X, TILLY_Y - 20, 'TILLY', {
      fontFamily: 'monospace', fontSize: '8px', color: '#88aa66',
    }).setOrigin(0.5).setDepth(6);

    // Rook — slate blue-grey
    this.add.rectangle(ROOK_X, ROOK_Y, 16, 26, 0x667788).setDepth(5);
    this.add.text(ROOK_X, ROOK_Y - 22, 'ROOK', {
      fontFamily: 'monospace', fontSize: '8px', color: '#667788',
    }).setOrigin(0.5).setDepth(6);

    // Rifle item (at lookout)
    this.add.rectangle(RIFLE_X, RIFLE_Y, 6, 16, 0x886644).setDepth(5);
    this.add.text(RIFLE_X, RIFLE_Y - 18, 'RIFLE', {
      fontFamily: 'monospace', fontSize: '7px', color: '#886644',
    }).setOrigin(0.5).setDepth(6);
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.6);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private _buildHUD(): void {
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'APPALACHIA  ·  RIDGE CAMP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#334422',
    }).setScrollFactor(0).setDepth(20).setOrigin(1, 0);
  }

  // ─── Interact input ──────────────────────────────────────────────────────

  private _setupInteract(): void {
    this._eKey = this.input.keyboard!.addKey('E');
    document.addEventListener('interact:tap', this._onInteractTap);
    this.events.once('shutdown', () => {
      document.removeEventListener('interact:tap', this._onInteractTap);
    });
  }

  private readonly _onInteractTap = (): void => {
    if (this._inputEnabled && !pauseMenu.isOpen()) {
      this._tryInteract();
    }
  };

  // ─── Story flow ──────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = PHASE.ARRIVING;
    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('ELIAS', D.arriving.elias, () => {
        this._doGuardChallenge();
      });
    });
  }

  private _doGuardChallenge(): void {
    this.dialogMgr.show('GUARD', D.guard_challenge_a.guard, () => {
      this.dialogMgr.show('ELIAS', D.guard_challenge_a.elias, () => {
        this.dialogMgr.show('GUARD', D.guard_challenge_b.guard, () => {
          this.dialogMgr.show(this._playerName, D.camp_overview.player, () => {
            this._phase = PHASE.CAMP;
            this._inputEnabled = true;
            this._showHint('Talk to the survivors. [E] or tap when close.', 6000);
          });
        });
      });
    });
  }

  // ─── NPC proximity ───────────────────────────────────────────────────────

  private _checkNPCProximity(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    const nearSam   = Math.hypot(px - SAM_X, py - SAM_Y)   < NPC_TALK_DIST;
    const nearTilly = Math.hypot(px - TILLY_X, py - TILLY_Y) < NPC_TALK_DIST;
    const nearRook  = Math.hypot(px - ROOK_X, py - ROOK_Y)  < NPC_TALK_DIST;

    if (nearSam || nearTilly || nearRook) {
      this.mobileControls.showInteract('Talk');
    } else {
      this.mobileControls.hideInteract();
    }

    if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
      this._tryInteract();
    }
  }

  private _tryInteract(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    if (Math.hypot(px - SAM_X, py - SAM_Y) < NPC_TALK_DIST) {
      this._talkToSam();
    } else if (Math.hypot(px - TILLY_X, py - TILLY_Y) < NPC_TALK_DIST) {
      this._talkToTilly();
    } else if (Math.hypot(px - ROOK_X, py - ROOK_Y) < NPC_TALK_DIST) {
      this._talkToRook();
    }
  }

  // ─── Sam ─────────────────────────────────────────────────────────────────

  private _talkToSam(): void {
    if (!this._inputEnabled) return;
    this._inputEnabled = false;

    if (!this._sam.talked) {
      this._sam.talked = true;
      this.dialogMgr.show('SAM', D.sam_meet_a.sam, () => {
        this.dialogMgr.show(this._playerName, D.sam_meet_a.player, () => {
          this.dialogMgr.show('SAM', D.sam_meet_b.sam, () => {
            // Give a beat then offer the rifle quest
            this.time.delayedCall(400, () => {
              this.dialogMgr.show('SAM', D.sam_husband.sam, () => {
                this.dialogMgr.show(this._playerName, D.sam_husband_prompt.player, () => {
                  this.dialogMgr.show('SAM', D.sam_husband_prompt.sam, () => {
                    this.dialogMgr.show(this._playerName, D.sam_husband_prompt.player2, () => {
                      this._inputEnabled = true;
                      this._showHint('Find the rifle at the old lookout — east trail.', 5000);
                    });
                  });
                });
              });
            });
          });
        });
      });
    } else if (this._rifleFound && !this._rifleReturned) {
      this._rifleReturned = true;
      setFlag(this.registry, SAM_HUSBAND_RIFLE_FOUND, true);
      this.dialogMgr.show(this._playerName, D.sam_rifle_return.player, () => {
        this.dialogMgr.show('SAM', D.sam_rifle_return.sam, () => {
          this._inputEnabled = true;
        });
      });
    } else {
      // Sam's repeat line
      this.dialogMgr.show('SAM', ['Eat something.'], () => {
        this._inputEnabled = true;
      });
    }
  }

  // ─── Tilly ───────────────────────────────────────────────────────────────

  private _talkToTilly(): void {
    if (!this._inputEnabled) return;
    this._inputEnabled = false;

    if (!this._tilly.talked) {
      this._tilly.talked = true;
      this.dialogMgr.show('TILLY', D.tilly_meet.tilly, () => {
        this.dialogMgr.show(this._playerName, D.tilly_meet.player, () => {
          this.dialogMgr.show('TILLY', D.tilly_meet.tilly2, () => {
            this._inputEnabled = true;
          });
        });
      });
    } else if (!this._tillyBondDone) {
      this._tillyBondDone = true;
      setFlag(this.registry, TILLY_BOND_1, true);
      // Campfire conversation
      this._phase = PHASE.CAMPFIRE;
      this.dialogMgr.show('TILLY', D.tilly_campfire.tilly, () => {
        this.dialogMgr.show(this._playerName, D.tilly_campfire.player, () => {
          this.dialogMgr.show('TILLY', D.tilly_campfire.tilly2, () => {
            // Gift offer
            this.dialogMgr.show('TILLY', D.tilly_gift_offer.tilly, () => {
              this._showGiftChoice();
            });
          });
        });
      });
    } else {
      this.dialogMgr.show('TILLY', ['Come back after the mine.', 'I mean it.'], () => {
        this._inputEnabled = true;
      });
    }
  }

  private _showGiftChoice(): void {
    const { width, height } = this.scale;

    const acceptBtn = this.add.text(width / 2 - 80, height / 2, '[Accept]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#88aa66',
      backgroundColor: '#111111', padding: { x: 8, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30)
      .setInteractive({ useHandCursor: true });

    const declineBtn = this.add.text(width / 2 + 80, height / 2, '[Decline]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#886644',
      backgroundColor: '#111111', padding: { x: 8, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30)
      .setInteractive({ useHandCursor: true });

    const cleanup = (): void => {
      acceptBtn.destroy();
      declineBtn.destroy();
    };

    acceptBtn.on('pointerdown', () => {
      cleanup();
      setFlag(this.registry, TILLY_TRUSTED, true);
      this.dialogMgr.show(this._playerName, D.tilly_gift_accept.player, () => {
        this.dialogMgr.show('TILLY', D.tilly_gift_accept.tilly, () => {
          this.dialogMgr.show(this._playerName, D.tilly_gift_accept.player2, () => {
            this.dialogMgr.show('TILLY', D.tilly_gift_accept.tilly2, () => {
              this._phase = PHASE.CAMP;
              this._inputEnabled = true;
            });
          });
        });
      });
    });

    declineBtn.on('pointerdown', () => {
      cleanup();
      this.dialogMgr.show(this._playerName, D.tilly_gift_decline.player, () => {
        this.dialogMgr.show('TILLY', D.tilly_gift_decline.tilly, () => {
          this._phase = PHASE.CAMP;
          this._inputEnabled = true;
        });
      });
    });
  }

  // ─── Rook ────────────────────────────────────────────────────────────────

  private _talkToRook(): void {
    if (!this._inputEnabled) return;
    this._inputEnabled = false;

    if (!this._rook.talked) {
      this._rook.talked = true;
      this.dialogMgr.show('ROOK', D.rook_meet.rook, () => {
        this.dialogMgr.show(this._playerName, D.rook_meet.player, () => {
          this.dialogMgr.show('ROOK', D.rook_meet.rook2, () => {
            this._inputEnabled = true;
          });
        });
      });
    } else if (!this._rookIntelDone) {
      this._rookIntelDone = true;
      this.dialogMgr.show('ROOK', D.rook_intel.rook, () => {
        this.dialogMgr.show(this._playerName, D.rook_intel.player, () => {
          this.dialogMgr.show('ROOK', D.rook_intel.rook2, () => {
            // Rumor about Harvest Town
            if (!this._harvestTownPrimed) {
              this._harvestTownPrimed = true;
              this.time.delayedCall(400, () => {
                this.dialogMgr.show('SURVIVOR', D.rumors_harvest_town.survivor_a, () => {
                  // Prime the flag (not yet confirmed — will be set in Ch.3)
                  setFlag(this.registry, 'saw_marcus_harvest_town', false);
                  // Now give Warden Six warning
                  this.dialogMgr.show('ROOK', D.warden_six_warning.rook, () => {
                    this._inputEnabled = true;
                    this._showHint('Head east to Harlan Mine when ready.', 5000);
                    this._phase = PHASE.PRE_MINE;
                  });
                });
              });
            } else {
              this._inputEnabled = true;
            }
          });
        });
      });
    } else {
      this.dialogMgr.show('ROOK', ['Four floors. Excavator at the bottom.', 'You remember.'], () => {
        this._inputEnabled = true;
      });
    }
  }

  // ─── Rifle pickup ────────────────────────────────────────────────────────

  private _checkRifleProximity(): void {
    if (this._rifleFound) return;
    const dist = Math.hypot(
      this.player.sprite.x - RIFLE_X,
      this.player.sprite.y - RIFLE_Y,
    );
    if (dist < ITEM_PICKUP_DIST) {
      this.mobileControls.showInteract('Pick up');
      if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
        this._pickupRifle();
      }
    }
  }

  private _pickupRifle(): void {
    if (this._rifleFound) return;
    this._rifleFound = true;
    this.mobileControls.hideInteract();
    this._inputEnabled = false;
    this.dialogMgr.show(this._playerName, [
      "His rifle.",
      "It's been out here a while.",
      "He kept it clean."
    ], () => {
      this._inputEnabled = true;
      this._showHint('Return the rifle to Sam.', 4000);
    });
  }

  // ─── Mine exit ───────────────────────────────────────────────────────────

  private _checkMineExit(): void {
    if (this._phase !== PHASE.PRE_MINE && this._phase !== PHASE.CAMP) return;
    const { x, y } = this.player.sprite;
    if (x < MINE_EXIT_X) return;
    if (y < MINE_EXIT_Y_TOP || y > MINE_EXIT_Y_BOT) return;

    this._phase = PHASE.DONE;
    this._inputEnabled = false;

    this.dialogMgr.show('ELIAS', D.pre_mine.elias, () => {
      this.dialogMgr.show(this._playerName, D.pre_mine.player, () => {
        this.dialogMgr.show('ELIAS', D.pre_mine.elias2, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
            if (p === 1) this.scene.start('HarlanMineScene');
          });
        });
      });
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

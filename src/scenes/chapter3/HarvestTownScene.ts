import Phaser from 'phaser';
import { Player }          from '../../entities/Player.js';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { GAME_FLAGS, setFlag } from '../../utils/constants.js';
import type { WasdKeys }   from '../../types.js';
import { pauseMenu }       from '../../ui/PauseMenu.js';
import D from '../../data/dialogue/chapter3/harvest_town.json';
import { CORA_DEF }  from '../../npcs/cora.js';
import { GIDEON_DEF } from '../../npcs/gideon.js';

const MAP_W = 2400;
const MAP_H = 1600;

const PLAYER_START_X = 120;
const PLAYER_START_Y = MAP_H / 2;

// NPC interaction radius
const INTERACT_RADIUS = 70;

// Exit to the right side
const EXIT_X = MAP_W - 60;
const EXIT_Y_MIN = MAP_H / 2 - 100;
const EXIT_Y_MAX = MAP_H / 2 + 100;

// Marcus garden position
const MARCUS_X = 900;
const MARCUS_Y = 500;

// Converted Child position
const CHILD_X = 600;
const CHILD_Y = 750;

type Phase =
  | 'ARRIVING'
  | 'EXPLORING'
  | 'CHOICE_PENDING'
  | 'DONE';

// ─── Flags (Ch.3 additions to GAME_FLAGS pattern) ────────────────────────────
const CH3_FLAGS = {
  CORA_CURED:           'cora_cured',
  CORA_LEFT:            'cora_left',
  CHILD_CURED:          'child_cured',
  SAW_MARCUS_HARVEST:   GAME_FLAGS.SAW_MARCUS_HARVEST_TOWN,
  GIDEON_MET:           'gideon_met',
  GIDEON_ECHO_HEARD:    'gideon_echo_heard',
} as const;

/**
 * HarvestTownScene — Ch.3 Scene 2.
 * A voluntary conversion settlement in Kansas.
 * NPCs: Cora (converted, curable), Gideon (collaborator), Marcus (non-interactive beyond one scene).
 * Special: Converted Child — attack menu SUPPRESSED; cure or walk away only.
 *
 * Critical beats:
 *   - Marcus encounter — silent, one line, Maya walks player away. No combat.
 *   - Cora choice row — medicine >= 2 gates cure; sets CORA_CURED XOR CORA_LEFT.
 *   - Converted Child — attack option NEVER rendered; cure disabled if medicine < 2.
 *   - Gideon intro — sets GIDEON_MET; echo hint available as optional branch.
 */
export class HarvestTownScene extends Phaser.Scene {
  cursors!:        Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!:           WasdKeys;
  player!:         Player;
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _phase:         Phase   = 'ARRIVING';
  private _inputEnabled:  boolean = false;
  private _playerName:    string  = 'YOU';

  // Interaction tracking
  private _coraTriggered:   boolean = false;
  private _childTriggered:  boolean = false;
  private _marcusTriggered: boolean = false;
  private _gideonTriggered: boolean = false;

  // Sprites
  private _coraSprite!:   Phaser.GameObjects.Rectangle;
  private _gideonSprite!: Phaser.GameObjects.Rectangle;
  private _marcusSprite!: Phaser.GameObjects.Rectangle;
  private _childSprite!:  Phaser.GameObjects.Rectangle;

  // E-key + tap interaction
  private _interactKey!: Phaser.Input.Keyboard.Key;
  private _nearNPC: 'cora' | 'gideon' | 'marcus' | 'child' | null = null;

  constructor() {
    super({ key: 'HarvestTownScene' });
  }

  create(): void {
    this._phase        = 'ARRIVING';
    this._inputEnabled = false;
    this._coraTriggered   = false;
    this._childTriggered  = false;
    this._marcusTriggered = false;
    this._gideonTriggered = false;
    this._nearNPC = null;
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
      this._checkNPCProximity();
      this._checkExit();
    }
  }

  // ─── Scene drawing ────────────────────────────────────────────────────────

  private _drawScene(): void {
    // Sky
    this.add.rectangle(MAP_W / 2, MAP_H * 0.25, MAP_W, MAP_H * 0.5, 0xaabbcc);
    // Ground (farmland)
    this.add.rectangle(MAP_W / 2, MAP_H * 0.7, MAP_W, MAP_H * 0.6, 0x556633);

    // Crop rows — perfectly even
    for (let row = 0; row < 12; row++) {
      const rowY = 500 + row * 60;
      this.add.rectangle(MAP_W / 2, rowY, MAP_W, 20, 0x446622).setAlpha(0.5);
    }

    // Town buildings
    const buildingDefs = [
      { x: 300,  y: 380, w: 120, h: 80 },
      { x: 500,  y: 360, w: 160, h: 100 },
      { x: 750,  y: 370, w: 140, h: 90 },
      { x: 1050, y: 390, w: 100, h: 70 },
      { x: 1300, y: 360, w: 130, h: 85 },
    ];
    for (const b of buildingDefs) {
      this.add.rectangle(b.x, b.y, b.w, b.h, 0x776655);
      // Roof
      this.add.rectangle(b.x, b.y - b.h / 2 - 10, b.w + 10, 20, 0x665544);
    }

    // Community garden (Marcus area)
    this.add.rectangle(MARCUS_X, MARCUS_Y, 200, 120, 0x335522).setAlpha(0.7);
    this.add.text(MARCUS_X, MARCUS_Y - 80, 'COMMUNITY GARDEN', {
      fontFamily: 'monospace', fontSize: '8px', color: '#aabbaa',
    }).setOrigin(0.5);

    // Location label
    const { width } = this.scale;
    this.add.text(width - 10, 10, 'HARVEST TOWN, KS', {
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
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }

  // ─── NPCs ────────────────────────────────────────────────────────────────

  private _buildNPCs(): void {
    // Cora — pale blue-grey (converted)
    this._coraSprite = this.add.rectangle(CORA_DEF.x, CORA_DEF.y, CORA_DEF.width, CORA_DEF.height, CORA_DEF.color).setDepth(5);
    this.add.text(CORA_DEF.x, CORA_DEF.y - 22, 'CORA', {
      fontFamily: 'monospace', fontSize: '8px', color: '#8899aa',
    }).setOrigin(0.5).setDepth(6);

    // Gideon — warm tan
    this._gideonSprite = this.add.rectangle(GIDEON_DEF.x, GIDEON_DEF.y, GIDEON_DEF.width, GIDEON_DEF.height, GIDEON_DEF.color).setDepth(5);
    this.add.text(GIDEON_DEF.x, GIDEON_DEF.y - 24, 'GIDEON', {
      fontFamily: 'monospace', fontSize: '8px', color: '#887766',
    }).setOrigin(0.5).setDepth(6);

    // Marcus — amber (converted, will not respond naturally)
    this._marcusSprite = this.add.rectangle(MARCUS_X, MARCUS_Y, 16, 26, 0x667799).setDepth(5);
    this.add.text(MARCUS_X, MARCUS_Y - 22, 'MARCUS', {
      fontFamily: 'monospace', fontSize: '8px', color: '#667799',
    }).setOrigin(0.5).setDepth(6);

    // Converted child — smaller, faint blue
    this._childSprite = this.add.rectangle(CHILD_X, CHILD_Y, 12, 20, 0x8899bb).setDepth(5);
    this.add.text(CHILD_X, CHILD_Y - 18, 'CHILD', {
      fontFamily: 'monospace', fontSize: '7px', color: '#8899bb',
    }).setOrigin(0.5).setDepth(6);

    // Background converted citizens (ambient)
    const ambientPositions = [
      { x: 400, y: 450 }, { x: 1100, y: 520 }, { x: 1500, y: 430 },
      { x: 1800, y: 490 }, { x: 2000, y: 560 },
    ];
    for (const pos of ambientPositions) {
      this.add.rectangle(pos.x, pos.y, 14, 22, 0x8899aa).setDepth(4).setAlpha(0.7);
    }
  }

  // ─── Interact key ────────────────────────────────────────────────────────

  private _buildInteractKey(): void {
    this._interactKey = this.input.keyboard!.addKey('E');
    document.addEventListener('interact:tap', this._onInteractTap);
  }

  private _onInteractTap = (): void => {
    if (this._inputEnabled && this._nearNPC) {
      this._triggerNPCInteraction(this._nearNPC);
    }
  };

  // ─── NPC proximity ────────────────────────────────────────────────────────

  private _checkNPCProximity(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    const distCora   = Math.hypot(px - CORA_DEF.x,  py - CORA_DEF.y);
    const distGideon = Math.hypot(px - GIDEON_DEF.x, py - GIDEON_DEF.y);
    const distMarcus = Math.hypot(px - MARCUS_X,     py - MARCUS_Y);
    const distChild  = Math.hypot(px - CHILD_X,      py - CHILD_Y);

    const prev = this._nearNPC;

    if (distCora < INTERACT_RADIUS && !this._coraTriggered) {
      this._nearNPC = 'cora';
    } else if (distGideon < INTERACT_RADIUS && !this._gideonTriggered) {
      this._nearNPC = 'gideon';
    } else if (distMarcus < INTERACT_RADIUS && !this._marcusTriggered) {
      this._nearNPC = 'marcus';
    } else if (distChild < INTERACT_RADIUS && !this._childTriggered) {
      this._nearNPC = 'child';
    } else {
      this._nearNPC = null;
    }

    if (this._nearNPC !== prev) {
      if (this._nearNPC) {
        this.mobileControls.showInteract(this._nearNPC === 'marcus' ? 'Approach' : 'Talk');
      } else {
        this.mobileControls.hideInteract();
      }
    }

    // E-key check
    if (this._nearNPC && Phaser.Input.Keyboard.JustDown(this._interactKey)) {
      this._triggerNPCInteraction(this._nearNPC);
    }
  }

  private _triggerNPCInteraction(npc: 'cora' | 'gideon' | 'marcus' | 'child'): void {
    this.mobileControls.hideInteract();
    this._inputEnabled = false;

    switch (npc) {
      case 'cora':   this._triggerCora();   break;
      case 'gideon': this._triggerGideon(); break;
      case 'marcus': this._triggerMarcus(); break;
      case 'child':  this._triggerChild();  break;
    }
  }

  // ─── Story flow ───────────────────────────────────────────────────────────

  private _startArriving(): void {
    this._phase = 'ARRIVING';

    this.dialogMgr.show(this._playerName, D.arriving.player, () => {
      this.dialogMgr.show('MAYA', D.arriving.maya, () => {
        this._phase = 'EXPLORING';
        this._inputEnabled = true;
        this._showHint('Talk to people (E or tap). Head east when ready.', 5000);
      });
    });
  }

  // ─── Cora — choice row ────────────────────────────────────────────────────

  private _triggerCora(): void {
    this._coraTriggered = true;

    const lines = D['harvest_town.cora.offer'];
    this.dialogMgr.show('CORA', lines.cora, () => {
      this.dialogMgr.show(this._playerName, lines.player, () => {
        this.dialogMgr.show('SYSTEM', lines.cora_observe, () => {
          this.dialogMgr.show('CORA', lines.cora, () => {
            this._showCoraChoice();
          });
        });
      });
    });
  }

  private _showCoraChoice(): void {
    this._phase = 'CHOICE_PENDING';
    const medicine = this._getMedicine();
    const { width, height } = this.scale;

    // Build choice menu
    const menuBg = this.add.rectangle(width / 2, height / 2, 320, 120, 0x111122, 0.92)
      .setScrollFactor(0).setDepth(50);

    const options: Array<{ label: string; enabled: boolean; id: string }> = [
      {
        id:      'cure',
        label:   medicine >= 2 ? 'Use medicine kit (cure Cora)' : '[Need 2 medicine]',
        enabled: medicine >= 2,
      },
      {
        id:      'leave',
        label:   'Take the food and go',
        enabled: true,
      },
    ];

    const items: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const y = height / 2 - 20 + i * 44;
      const color = opt.enabled ? '#eeddaa' : '#555566';
      const txt = this.add.text(width / 2, y, `> ${opt.label}`, {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color,
      }).setScrollFactor(0).setDepth(51).setOrigin(0.5);

      if (opt.enabled) {
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => {
          cleanup();
          this._resolveCoraChoice(opt.id === 'cure');
        });
      }

      items.push(txt);
    });

    const cleanup = (): void => {
      menuBg.destroy();
      items.forEach(t => t.destroy());
    };
  }

  private _resolveCoraChoice(cure: boolean): void {
    this._phase = 'EXPLORING';

    if (cure) {
      this._spendMedicine(2);
      setFlag(this.registry, CH3_FLAGS.CORA_CURED, true);
      // Visual: fade Cora's sprite to show she's been freed
      this._coraSprite.setAlpha(0.5);

      const branch = D['harvest_town.cora.offer.cure'];
      this.dialogMgr.show('SYSTEM', branch.system, () => {
        this.dialogMgr.show('CORA', branch.cora_post_cure, () => {
          this.dialogMgr.show('MAYA', branch.maya, () => {
            this.dialogMgr.show('CORA', branch.cora_post_cure_2, () => {
              this._inputEnabled = true;
            });
          });
        });
      });
    } else {
      setFlag(this.registry, CH3_FLAGS.CORA_LEFT, true);
      // Visual: keep Cora in place — she goes back to her routine
      this._coraSprite.setAlpha(0.7);

      const branch = D['harvest_town.cora.offer.leave'];
      this.dialogMgr.show('SYSTEM', branch.player_thought, () => {
        this._inputEnabled = true;
      });
    }
  }

  // ─── Marcus encounter — critical beat ─────────────────────────────────────
  //
  // Marcus says one thing. Goes back to weeding. Maya walks player away.
  // No combat. No explanation. No speech afterwards.
  // Tonal fidelity: the silence IS the scene.

  private _triggerMarcus(): void {
    this._marcusTriggered = true;
    setFlag(this.registry, CH3_FLAGS.SAW_MARCUS_HARVEST, true);

    const enc = D['harvest_town.marcus.encounter'];

    // System describes the scene
    this.dialogMgr.show('SYSTEM', enc.system, () => {
      // Marcus speaks — one line, maybe two
      this.dialogMgr.show('MARCUS', enc.marcus, () => {
        // System: he goes back to weeding
        this.dialogMgr.show('SYSTEM', enc.system_post, () => {
          // Maya walks player away — no prompt, no choice
          this.dialogMgr.show('MAYA', enc.maya_walkaway, () => {
            // System: neither of you brings it up at camp
            this.dialogMgr.show('SYSTEM', enc.system_final, () => {
              // Player cannot cure Marcus. Cannot interact again.
              // Walk away.
              this._inputEnabled = true;
              this._marcusSprite.setAlpha(0.6);
            });
          });
        });
      });
    });
  }

  // ─── Converted Child — attack SUPPRESSED ─────────────────────────────────

  private _triggerChild(): void {
    this._childTriggered = true;

    const child = D['harvest_town.child.approach'];

    this.dialogMgr.show('SYSTEM', child.system, () => {
      this.dialogMgr.show('CHILD', child.child, () => {
        this.dialogMgr.show(this._playerName, child.player, () => {
          this.dialogMgr.show('CHILD', child.child, () => {
            this._showChildChoice();
          });
        });
      });
    });
  }

  private _showChildChoice(): void {
    this._phase = 'CHOICE_PENDING';
    const medicine = this._getMedicine();
    const { width, height } = this.scale;

    const menuBg = this.add.rectangle(width / 2, height / 2, 340, 160, 0x111122, 0.92)
      .setScrollFactor(0).setDepth(50);

    // ATTACK IS NEVER RENDERED for converted enemies.
    // Only cure (gated) or walk away.
    const canCure = medicine >= 2;

    const options: Array<{ label: string; enabled: boolean; id: string }> = [
      {
        id:      'cure',
        label:   canCure ? 'Use medicine kit (cure her)' : 'Insufficient supplies',
        enabled: canCure,
      },
      {
        id:      'leave',
        label:   'Walk away',
        enabled: true,
      },
    ];

    const items: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const y = height / 2 - 24 + i * 48;
      const color = opt.enabled ? '#eeddaa' : '#555566';
      const txt = this.add.text(width / 2, y, `> ${opt.label}`, {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color,
      }).setScrollFactor(0).setDepth(51).setOrigin(0.5);

      if (opt.enabled) {
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => {
          cleanup();
          this._resolveChildChoice(opt.id === 'cure');
        });
      }

      items.push(txt);
    });

    const cleanup = (): void => {
      menuBg.destroy();
      items.forEach(t => t.destroy());
    };
  }

  private _resolveChildChoice(cure: boolean): void {
    this._phase = 'EXPLORING';

    if (cure) {
      this._spendMedicine(2);
      setFlag(this.registry, CH3_FLAGS.CHILD_CURED, true);
      this._incrementCured();

      const branch = D['harvest_town.child.cure'];
      this.dialogMgr.show('SYSTEM', branch.system, () => {
        this.dialogMgr.show('CHILD', branch.child_post, () => {
          this.dialogMgr.show('MAYA', branch.maya, () => {
            this._childSprite.setAlpha(0.3);
            this._inputEnabled = true;
          });
        });
      });
    } else {
      const branch = D['harvest_town.child.leave'];
      this.dialogMgr.show('SYSTEM', branch.system, () => {
        this._inputEnabled = true;
      });
    }
  }

  // ─── Gideon ───────────────────────────────────────────────────────────────

  private _triggerGideon(): void {
    this._gideonTriggered = true;
    setFlag(this.registry, CH3_FLAGS.GIDEON_MET, true);

    const intro = D['harvest_town.gideon.intro'];

    this.dialogMgr.show('GIDEON', intro.gideon, () => {
      this.dialogMgr.show(this._playerName, intro.player, () => {
        this.dialogMgr.show('GIDEON', intro.gideon, () => {
          this._showGideonEchoPrompt();
        });
      });
    });
  }

  private _showGideonEchoPrompt(): void {
    const { width, height } = this.scale;

    const menuBg = this.add.rectangle(width / 2, height / 2, 360, 120, 0x111122, 0.92)
      .setScrollFactor(0).setDepth(50);

    const options = [
      { id: 'echo',   label: '"What do you know about the Echo signal?"', enabled: true },
      { id: 'leave',  label: 'Thanks. We\'re moving on.',                  enabled: true },
    ];

    const items: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const y = height / 2 - 16 + i * 44;
      const txt = this.add.text(width / 2, y, `> ${opt.label}`, {
        fontFamily: 'monospace',
        fontSize:   '11px',
        color:      '#eeddaa',
      }).setScrollFactor(0).setDepth(51).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerdown', () => {
        cleanup();
        this._resolveGideonChoice(opt.id === 'echo');
      });

      items.push(txt);
    });

    const cleanup = (): void => {
      menuBg.destroy();
      items.forEach(t => t.destroy());
    };
  }

  private _resolveGideonChoice(echo: boolean): void {
    // Dim Gideon's sprite — conversation over
    this._gideonSprite.setAlpha(0.6);
    if (echo) {
      setFlag(this.registry, CH3_FLAGS.GIDEON_ECHO_HEARD, true);
      const lines = D['harvest_town.gideon.intro'];
      this.dialogMgr.show(this._playerName, [...lines.player_optional], () => {
        this.dialogMgr.show('GIDEON', [...lines.gideon_echo], () => {
          this._inputEnabled = true;
        });
      });
    } else {
      this._inputEnabled = true;
    }
  }

  // ─── Exit ────────────────────────────────────────────────────────────────

  private _checkExit(): void {
    if (this._phase === 'CHOICE_PENDING') return;
    const { x, y } = this.player.sprite;
    if (x < EXIT_X) return;
    if (y < EXIT_Y_MIN || y > EXIT_Y_MAX) return;

    this._phase = 'DONE';
    this._inputEnabled = false;
    this.mobileControls.hideInteract();

    this.dialogMgr.show('SYSTEM', D.town_exit.player, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('StormCorridorScene');
      });
    });
  }

  // ─── Survival resource helpers ────────────────────────────────────────────

  private _getMedicine(): number {
    const resources = this.registry.get('survival') as Record<string, number> | undefined;
    return resources?.['medicine'] ?? 0;
  }

  private _spendMedicine(amount: number): void {
    const resources = (this.registry.get('survival') as Record<string, number> | undefined) ?? {};
    resources['medicine'] = Math.max(0, (resources['medicine'] ?? 0) - amount);
    this.registry.set('survival', resources);
  }

  private _incrementCured(): void {
    const current = (this.registry.get('convertedCured') as number | undefined) ?? 0;
    this.registry.set('convertedCured', current + 1);
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

// Needed to access flags from tests or other scenes
export { CH3_FLAGS };

/**
 * BoardroomScene — Chapter 5, scene 5. Final boss chamber.
 *
 * Elise Voss. Three-phase fight. All critical beats:
 *   Phase 1 (100→60%): summons Converted humans; reads convertedCured/Fought
 *   Phase 2 (60→30%): disables Hack/Rewire; Elena reference if VAULT49_TERMINALS_READ
 *   Phase 3 (30→0%): Nora voicemail; low-morale +damage; talk-down if cured majority
 *   Talk-down: 6-exchange sub-tree via nextId chaining; success → ELISE_TALKDOWN
 *   Credits: 2 endings; +4s if ELISE_TALKDOWN && MARCUS_NAMED_BY_ELISE
 */
import Phaser from 'phaser';
import { DialogueManager } from '../../dialogue/DialogueManager.js';
import { MobileControls }  from '../../utils/MobileControls.js';
import { setFlag, getFlags, GAME_FLAGS } from '../../utils/constants.js';
import D from '../../data/dialogue/chapter5/boardroom.json';
import {
  ELISE_FLAGS,
  ELISE_VOSS_BOSS_CONFIG,
  ELISE_LOW_MORALE_THRESHOLD,
  ELISE_LOW_MORALE_ATK_BONUS,
} from '../../entities/enemies/chapter5/index.js';
import { pauseMenu } from '../../ui/PauseMenu.js';
import type { BattleInitData } from '../../types.js';

const PHASE = {
  ENTERING:    'ENTERING',
  PHASE1:      'PHASE1',
  PHASE2:      'PHASE2',
  PHASE3:      'PHASE3',
  TALKDOWN:    'TALKDOWN',
  CREDITS:     'CREDITS',
  DONE:        'DONE',
} as const;
type BossPhase = typeof PHASE[keyof typeof PHASE];

export class BoardroomScene extends Phaser.Scene {
  dialogMgr!:      DialogueManager;
  mobileControls!: MobileControls;

  private _bossPhase:      BossPhase = PHASE.ENTERING;
  private _playerName:     string    = 'YOU';
  private _talkdownSeq:    number    = 0;
  private _creditsStarted: boolean   = false;

  constructor() {
    super({ key: 'BoardroomScene' });
  }

  create(): void {
    this._bossPhase      = PHASE.ENTERING;
    this._talkdownSeq    = 0;
    this._creditsStarted = false;

    this._playerName = (this.registry.get('playerName') as string | undefined) ?? 'YOU';

    this._buildRoom();

    this.dialogMgr      = new DialogueManager(this);
    this.mobileControls = new MobileControls();
    this.events.once('shutdown', () => { this.mobileControls.destroy(); });

    // Battle resume handler — receives per-phase outcome
    this.events.on('resume', (_sys: Phaser.Scene, data: { victory?: boolean; phase?: number }) => {
      this._onBattleResume(data?.victory ?? false, data?.phase ?? 0);
    });

    pauseMenu.setBlocked(true);

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(1400, () => { this._startEntrance(); });
  }

  update(): void {
    // Fully scripted boss scene — no player movement.
    // _bossPhase tracks narrative state; used by future save/load integration.
    if (this._bossPhase === PHASE.DONE) return;
  }

  // ─── Room ────────────────────────────────────────────────────────────────

  private _buildRoom(): void {
    const { width, height } = this.scale;

    // Boardroom — glass, clean, impossible
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1520, 0x0a1520, 0x111830, 0x111830, 1);
    bg.fillRect(0, 0, width, height);

    // Long boardroom table
    bg.fillStyle(0x1a2a3a);
    bg.fillRect(width * 0.2, height * 0.45, width * 0.6, height * 0.12);

    // Window panorama — the valley below
    bg.fillStyle(0x0d2040);
    bg.fillRect(0, 0, width, height * 0.35);
    // Valley lights
    for (let i = 0; i < 30; i++) {
      const lx = Math.random() * width;
      const ly = Math.random() * (height * 0.3);
      this.add.circle(lx, ly, 2, 0x88aaff, 0.6).setDepth(1);
    }

    // Elise Voss placeholder — behind the table
    const eliseRect = this.add.rectangle(width * 0.5, height * 0.38, 32, 48, 0x445566)
      .setDepth(5);
    this.add.text(width * 0.5, height * 0.38 - 32, 'ELISE VOSS', {
      fontFamily: 'monospace', fontSize: '9px', color: '#8899aa',
    }).setOrigin(0.5).setDepth(6);

    void eliseRect;
  }

  // ─── Entrance ────────────────────────────────────────────────────────────

  private _startEntrance(): void {
    this.dialogMgr.show('ELISE VOSS', D.elise.entrance, () => {
      this._bossPhase = PHASE.PHASE1;
      this._startPhase1();
    });
  }

  // ─── Phase 1 (100 → 60%) ─────────────────────────────────────────────────

  private _startPhase1(): void {
    const convertedCured  = (this.registry.get('convertedCured')  as number | undefined) ?? 0;
    const convertedFought = (this.registry.get('convertedFought') as number | undefined) ?? 0;

    const openingLines = [...D.elise.phase1.opening];

    const summonLines = convertedCured >= convertedFought
      ? D.elise.phase1.converted_summons_high
      : D.elise.phase1.converted_summons_low;

    this.dialogMgr.show('ELISE VOSS', openingLines, () => {
      this.dialogMgr.show('ELISE VOSS', summonLines, () => {
        // Launch Phase 1 battle — converted humans as T1 opponents
        this._launchPhaseBattle(1);
      });
    });
  }

  private _launchPhaseBattle(phaseNum: number): void {
    const morale = (this.registry.get('morale') as number | undefined) ?? 100;

    // Determine which enemy key to use per phase
    let enemyKey: string;
    let bossConfig: BattleInitData['bossConfig'];

    if (phaseNum === 1) {
      // Converted humans — can cure or fight
      enemyKey = 'converted';
      bossConfig = undefined;
    } else if (phaseNum === 2) {
      // Elise Voss Phase 2
      enemyKey = 'elise_voss';
      const phase2Config = {
        phases: [
          {
            hpThreshold: 0.0,
            atkBoost:    ELISE_VOSS_BOSS_CONFIG.phases[1]!.atkBoost,
            dialogue:    ELISE_VOSS_BOSS_CONFIG.phases[1]!.dialogue,
          },
        ],
      };
      bossConfig = phase2Config;
    } else {
      // Phase 3 — enhanced attack if low morale
      enemyKey   = 'elise_voss';
      const atkBoost = ELISE_VOSS_BOSS_CONFIG.phases[2]!.atkBoost +
        (morale < ELISE_LOW_MORALE_THRESHOLD ? ELISE_LOW_MORALE_ATK_BONUS : 0);
      const phase3Config = {
        phases: [
          {
            hpThreshold: 0.0,
            atkBoost,
            dialogue: ELISE_VOSS_BOSS_CONFIG.phases[2]!.dialogue,
          },
        ],
      };
      bossConfig = phase3Config;
    }

    // Store which phase we're launching so resume knows
    const launchData: BattleInitData & { phase: number } = {
      enemyKey,
      returnScene: 'BoardroomScene',
      scripted:    true,
      phase:       phaseNum,
    };
    if (bossConfig !== undefined) {
      launchData.bossConfig = bossConfig;
    }

    setFlag(this.registry, ELISE_FLAGS.ELISE_PHASE2_ACTIVE, phaseNum === 2);

    this.scene.launch('BattleScene', launchData);
    this.scene.pause();
  }

  // ─── Battle resume handling ───────────────────────────────────────────────

  private _onBattleResume(victory: boolean, phaseNum: number): void {
    if (!victory) {
      // Defeat — restart boardroom (keep flags, retry from entrance)
      this.scene.restart();
      return;
    }

    if (phaseNum === 1) {
      this._afterPhase1Victory();
    } else if (phaseNum === 2) {
      this._afterPhase2Victory();
    } else if (phaseNum === 3) {
      this._afterPhase3Victory();
    }
  }

  // ─── Phase transitions ────────────────────────────────────────────────────

  private _afterPhase1Victory(): void {
    this._bossPhase = PHASE.PHASE2;
    this.dialogMgr.show('ELISE VOSS', D.elise.phase1.phase1_end, () => {
      this._startPhase2();
    });
  }

  private _startPhase2(): void {
    const flags = getFlags(this.registry);

    this.dialogMgr.show('ELISE VOSS', D.elise.phase2.opening, () => {
      // Elena reference — fires if player read Vault 49 terminals
      if (flags[ELISE_FLAGS.VAULT49_TERMINALS_READ] === true) {
        this.dialogMgr.show('ELISE VOSS', D.elise.phase2.elena_reference, () => {
          this._launchPhaseBattle(2);
        });
      } else {
        this._launchPhaseBattle(2);
      }
    });
  }

  private _afterPhase2Victory(): void {
    setFlag(this.registry, ELISE_FLAGS.ELISE_PHASE2_ACTIVE, false);
    this._bossPhase = PHASE.PHASE3;
    this.dialogMgr.show('ELISE VOSS', D.elise.phase2.phase2_end, () => {
      this._startPhase3();
    });
  }

  private _startPhase3(): void {
    const morale        = (this.registry.get('morale')         as number | undefined) ?? 100;
    const convertedCured = (this.registry.get('convertedCured')  as number | undefined) ?? 0;
    const convertedFought = (this.registry.get('convertedFought') as number | undefined) ?? 0;
    const talkdownAvailable = convertedCured > convertedFought;

    this.dialogMgr.show('ELISE VOSS', D.elise.phase3.opening, () => {
      // Low morale taunt
      if (morale < ELISE_LOW_MORALE_THRESHOLD) {
        this.dialogMgr.show('ELISE VOSS', D.elise.phase3.low_morale, () => {
          this._phase3MarcusCheck(talkdownAvailable);
        });
      } else {
        this._phase3MarcusCheck(talkdownAvailable);
      }
    });
  }

  private _phase3MarcusCheck(talkdownAvailable: boolean): void {
    const flags = getFlags(this.registry);
    const sawMarcus = flags[GAME_FLAGS.SAW_MARCUS_HARVEST_TOWN] === true;

    if (sawMarcus && talkdownAvailable) {
      // Elise names Marcus — set flag for credits bonus
      setFlag(this.registry, GAME_FLAGS.MARCUS_NAMED_BY_ELISE, true);
      this.dialogMgr.show('ELISE VOSS', D.elise.phase3.marcus_named, () => {
        this._phase3TalkdownCheck(talkdownAvailable);
      });
    } else {
      this._phase3TalkdownCheck(talkdownAvailable);
    }
  }

  private _phase3TalkdownCheck(talkdownAvailable: boolean): void {
    if (talkdownAvailable) {
      // Offer talk-down before final battle
      this.dialogMgr.show('ELISE VOSS', D.elise.phase3.talkdown_available, () => {
        this._showTalkdownOrFightChoice();
      });
    } else {
      // Straight to Phase 3 fight
      this._launchPhaseBattle(3);
    }
  }

  private _showTalkdownOrFightChoice(): void {
    const { width, height } = this.scale;

    const options = [
      { label: 'Talk to her.', talkdown: true  },
      { label: 'Fight.',       talkdown: false },
    ];

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
      .setScrollFactor(0).setDepth(40).setInteractive();

    const menuItems: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, i) => {
      const item = this.add.text(width / 2, height / 2 - 20 + i * 44, opt.label, {
        fontFamily: 'monospace',
        fontSize:   '16px',
        color:      '#aaccee',
        stroke:     '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(42).setInteractive();

      item.on('pointerover', () => { item.setColor('#ffffff'); });
      item.on('pointerout',  () => { item.setColor('#aaccee'); });
      item.on('pointerdown', () => {
        menuItems.forEach(m => m.destroy());
        overlay.destroy();
        if (opt.talkdown) {
          this._startTalkdown();
        } else {
          this.dialogMgr.show('ELISE VOSS', D.elise.phase3.phase3_end_fight, () => {
            this._launchPhaseBattle(3);
          });
        }
      });
      menuItems.push(item);
    });
  }

  private _afterPhase3Victory(): void {
    // Normal defeat ending
    this.dialogMgr.show('ELISE VOSS', D.elise.defeat_response, () => {
      this._playNoraVoicemail(() => {
        this._rollCredits(false);
      });
    });
  }

  // ─── Talk-down sequence (§6, 6 exchanges) ────────────────────────────────

  private _startTalkdown(): void {
    this._bossPhase   = PHASE.TALKDOWN;
    this._talkdownSeq = 0;
    this._advanceTalkdown();
  }

  private _advanceTalkdown(): void {
    const seq = this._talkdownSeq;

    switch (seq) {
      case 0:
        this.dialogMgr.show('ELISE VOSS', D.elise.talkdown.seq_1.lines, () => {
          this._talkdownSeq = 1;
          this._advanceTalkdown();
        });
        break;
      case 1:
        this.dialogMgr.show(this._playerName, D.elise.talkdown.seq_2.lines, () => {
          this._talkdownSeq = 2;
          this._advanceTalkdown();
        });
        break;
      case 2:
        this.dialogMgr.show('ELISE VOSS', D.elise.talkdown.seq_3.lines, () => {
          this._talkdownSeq = 3;
          this._advanceTalkdown();
        });
        break;
      case 3:
        this.dialogMgr.show(this._playerName, D.elise.talkdown.seq_4.lines, () => {
          this._talkdownSeq = 4;
          this._advanceTalkdown();
        });
        break;
      case 4:
        this.dialogMgr.show('ELISE VOSS', D.elise.talkdown.seq_5.lines, () => {
          this._talkdownSeq = 5;
          this._advanceTalkdown();
        });
        break;
      case 5:
        this._talkdownFinalExchange();
        break;
      default:
        break;
    }
  }

  private _talkdownFinalExchange(): void {
    const flags = getFlags(this.registry);
    const grayTalkdown = flags['MR_GRAY_TALKDOWN'] === true;

    // seq_6 variant depends on Mr. Gray talkdown flag
    const seq6Lines = grayTalkdown
      ? D.elise.talkdown.seq_6_gray.lines
      : D.elise.talkdown.seq_6_no_gray.lines;

    this.dialogMgr.show('ELISE VOSS', seq6Lines, () => {
      this.dialogMgr.show(this._playerName, D.elise.talkdown.player_final.lines, () => {
        this.dialogMgr.show('ELISE VOSS', D.elise.talkdown.elise_talkdown_accept.lines, () => {
          setFlag(this.registry, ELISE_FLAGS.ELISE_TALKDOWN, true);
          this._playNoraVoicemail(() => {
            this._rollCredits(true);
          });
        });
      });
    });
  }

  // ─── Nora voicemail ───────────────────────────────────────────────────────

  private _playNoraVoicemail(onComplete: () => void): void {
    // Brief pause then the voicemail plays
    this.time.delayedCall(800, () => {
      this.cameras.main.flash(400, 255, 255, 255, false);
      this.dialogMgr.show(D.nora_voicemail.speaker, D.nora_voicemail.lines, onComplete);
    });
  }

  // ─── Credits ─────────────────────────────────────────────────────────────

  private _rollCredits(talkdown: boolean): void {
    if (this._creditsStarted) return;
    this._creditsStarted = true;
    this._bossPhase      = PHASE.CREDITS;

    pauseMenu.setBlocked(false);

    const flags = getFlags(this.registry);
    const marcusBonus = talkdown &&
      (flags[ELISE_FLAGS.ELISE_TALKDOWN] === true) &&
      (flags[GAME_FLAGS.MARCUS_NAMED_BY_ELISE] === true);

    const endingLines = talkdown ? D.credits.talkdown_ending : D.credits.defeat_ending;

    this.dialogMgr.show('', endingLines, () => {
      if (marcusBonus) {
        // Extra 4 seconds of apartment music over final fade
        this._rollMarcusBonus();
      } else {
        this._finalFade();
      }
    });
  }

  private _rollMarcusBonus(): void {
    // Play apartment music key (same track used in prologue)
    // AudioManager is not wired to this scene directly, so we use a timed delay
    this.dialogMgr.show('', D.credits.talkdown_marcus_bonus, () => {
      // 4 extra seconds before fade
      this.time.delayedCall(4000, () => { this._finalFade(); });
    });
  }

  private _finalFade(): void {
    this._bossPhase = PHASE.DONE;
    this.cameras.main.fadeOut(2000, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) {
        // Return to title / world map — game complete
        this.scene.start('TitleScene');
      }
    });
  }
}

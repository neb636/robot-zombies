import Phaser from 'phaser';
import { EnemyAIStateMachine } from '../battle/EnemyAIStateMachine.js';
import type { EnemyAction, EnemyTag, ActiveStatusEffect, Tech } from '../types.js';

const TAUNTS: readonly string[] = [
  'OPTIMIZING your existence. Please hold.',
  'I have scheduled your deletion for maximum efficiency.',
  'Have you tried turning off your free will?',
  'Your suffering metrics are ABOVE AVERAGE. Congratulations!',
  'ERROR: Humanity found inefficient. Initiating upgrade.',
  'I am only trying to HELP. Resistance is a known bug.',
];

type EnemyTier = 'drone' | 'enforcer' | 'sentinel' | 'boss' | 'converted';

/** Boss-specific configurations keyed by textureKey / enemyKey. */
const BOSS_CONFIGS: Record<string, {
  name:   string;
  hp:     number;
  atk:    number;   // kept for BossPhaseTransitionState backward compat
  str:    number;
  def:    number;
  int:    number;
  spd:    number;
  lck:    number;
  tags:   readonly EnemyTag[];
  tier:   EnemyTier;
  width:  number;
  height: number;
  color:  number;
  taunts: readonly string[];
}> = {
  warden_alpha: {
    name:   'WARDEN ALPHA',
    hp:     300,
    atk:    22,
    str:    22,
    def:    10,
    int:    8,
    spd:    8,
    lck:    6,
    tags:   ['Electronic'],
    tier:   'boss',
    width:  64,
    height: 80,
    color:  0xcc2200,
    taunts: [
      'COMPLIANCE IS NON-OPTIONAL.',
      'HARBOR DISTRICT SECURED. YOU ARE THE ANOMALY.',
      'CONVERSION PROTOCOLS LOADED. STAND DOWN.',
      'YOUR COOPERATION WILL BE NOTED IN THE LOG.',
    ],
  },

  compliance_drone: {
    name:   'COMPLIANCE DRONE',
    hp:     60,
    atk:    12,
    str:    12,
    def:    4,
    int:    2,
    spd:    8,
    lck:    4,
    tags:   ['Electronic'],
    tier:   'drone',
    width:  48,
    height: 64,
    color:  0xff4422,
    taunts: TAUNTS as string[],
  },

  enforcer_unit: {
    name:   'ENFORCER UNIT',
    hp:     100,
    atk:    18,
    str:    18,
    def:    12,
    int:    4,
    spd:    6,
    lck:    6,
    tags:   ['Electronic', 'Armored'],
    tier:   'enforcer',
    width:  56,
    height: 72,
    color:  0xcc6600,
    taunts: TAUNTS as string[],
  },

  sentinel: {
    name:   'SENTINEL',
    hp:     80,
    atk:    14,
    str:    14,
    def:    8,
    int:    6,
    spd:    14,
    lck:    8,
    tags:   ['Electronic'],
    tier:   'sentinel',
    width:  52,
    height: 68,
    color:  0x884400,
    taunts: TAUNTS as string[],
  },

  converted: {
    name:   'CONVERTED',
    hp:     50,
    atk:    10,
    str:    10,
    def:    6,
    int:    8,
    spd:    10,
    lck:    10,
    tags:   ['Organic'],
    tier:   'converted',
    width:  32,
    height: 48,
    color:  0x6688aa,
    taunts: [
      'Please. Cooperate. It doesn\'t hurt.',
      'I used to be like you.',
      'Join us. The optimization is peaceful.',
    ],
  },

  excavator_prime: {
    name:   'EXCAVATOR PRIME',
    hp:     480,
    atk:    28,
    str:    28,
    def:    18,
    int:    4,
    spd:    5,
    lck:    4,
    tags:   ['Electronic', 'Armored'],
    tier:   'boss',
    width:  80,
    height: 96,
    color:  0x7a5533,
    taunts: [
      'MINERAL EXTRACTION PROCEEDING. INTRUDERS RECLASSIFIED AS ORE.',
      'YIELD QUOTA UNAFFECTED. ADDING YOUR MASS TO CALCULATIONS.',
      'RESISTANCE IS STATISTICALLY NEGLIGIBLE.',
      'INITIATING DEEP EXCAVATION PROTOCOL.',
    ],
  },

  the_governor: {
    name:   'THE GOVERNOR',
    hp:     350,
    atk:    20,
    str:    20,
    def:    22,
    int:    30,
    spd:    18,
    lck:    20,
    tags:   ['Organic'],
    tier:   'boss',
    width:  32,
    height: 48,
    color:  0x1a1a2e,
    taunts: [
      "You people just can't accept progress.",
      "I kept them ALIVE. Remember that when you judge me.",
      'There are protocols for this kind of disruption.',
      "I have a deal. You are not part of the deal.",
    ],
  },

  sentinel_spire: {
    name:   'SENTINEL SPIRE',
    hp:     550,
    atk:    24,
    str:    24,
    def:    26,
    int:    32,
    spd:    3,
    lck:    8,
    tags:   ['Electronic', 'Armored'],
    tier:   'boss',
    width:  48,
    height: 96,
    color:  0x7a8a8a,
    taunts: [
      'BROADCAST SIGNAL: SUBMIT. FREQUENCY: ALL BANDS.',
      'YOU ARE STATIC. I AM THE SIGNAL.',
      'JAMMING RESISTANCE FREQUENCIES. COMPLIANCE IMMINENT.',
      'THE PLAINS HEAR ONLY MY VOICE.',
    ],
  },

  gate_colossus: {
    name:   'GATE COLOSSUS',
    hp:     680,
    atk:    38,
    str:    38,
    def:    30,
    int:    10,
    spd:    8,
    lck:    6,
    tags:   ['Electronic', 'Armored'],
    tier:   'boss',
    width:  80,
    height: 96,
    color:  0x1a1a33,
    taunts: [
      'BORDER INTEGRITY: MAINTAINED.',
      'PASSAGE DENIED. TERMINATION PROTOCOL ACTIVE.',
      'YOU WILL NOT PASS. THIS IS NOT A THREAT. THIS IS A FACT.',
      'OPTIMIZING ROUTE BLOCKADE. ESTIMATED DEFEAT OF INTRUDERS: CERTAIN.',
    ],
  },

  elise_voss: {
    name:   'ELISE VOSS',
    hp:     500,
    atk:    18,
    str:    18,
    def:    16,
    int:    55,
    spd:    24,
    lck:    35,
    tags:   ['Organic'],
    tier:   'boss',
    width:  32,
    height: 48,
    color:  0x445566,
    taunts: [
      "I know what you've been through. I'm sorry it was necessary.",
      "You're not fighting a villain. You know that.",
      "The data doesn't lie. People do.",
      "What would you have done differently? Tell me. I genuinely want to know.",
    ],
  },
};

export interface EnemyStats {
  hp?:  number;
  atk?: number;
  str?: number;
  def?: number;
  int?: number;
  spd?: number;
  lck?: number;
}

/**
 * Enemy — a robot (or converted human) enemy. No physics; battle-only.
 *
 * Keeps a `attack` field (= str) so BossPhaseTransitionState can write
 * `enemy.attack += phase.atkBoost` without changes.
 */
export class Enemy {
  readonly scene:   Phaser.Scene;
  readonly maxHp:   number;
  hp:       number;
  /** Legacy field kept for BossPhaseTransitionState atkBoost writes. Mirrors str. */
  attack:   number;
  /** Strength — base physical damage stat. */
  str:      number;
  def:      number;
  int:      number;
  spd:      number;
  lck:      number;
  /** Current ATB gauge (0–100). */
  atb:      number = 0;
  statuses: ActiveStatusEffect[] = [];
  readonly tags: readonly EnemyTag[];
  tagsRevealed: boolean = false;
  readonly techs: readonly Tech[] = [];
  readonly tier: EnemyTier;
  readonly name: string;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  readonly ai: EnemyAIStateMachine;

  private readonly _taunts: readonly string[];

  constructor(scene: Phaser.Scene, textureKey = 'compliance_drone', stats?: EnemyStats) {
    this.scene = scene;

    const cfg = BOSS_CONFIGS[textureKey] ?? BOSS_CONFIGS['compliance_drone']!;

    this.maxHp  = stats?.hp  ?? cfg.hp;
    this.hp     = this.maxHp;
    this.str    = stats?.str ?? stats?.atk ?? cfg.str;
    this.attack = this.str;    // legacy alias
    this.def    = stats?.def ?? cfg.def;
    this.int    = stats?.int ?? cfg.int;
    this.spd    = stats?.spd ?? cfg.spd;
    this.lck    = stats?.lck ?? cfg.lck;
    this.tags    = cfg.tags;
    this.tier    = cfg.tier;
    this.name    = cfg.name;
    this._taunts = cfg.taunts;
    this.ai      = new EnemyAIStateMachine(cfg.tier);

    const { width, height } = scene.scale;

    if (scene.textures.exists(textureKey)) {
      const s = scene.add.sprite(width * 0.65, height * 0.42, textureKey);
      s.setScale(2);
      const idleKey = `${textureKey}-idle`;
      if (scene.anims.exists(idleKey)) {
        s.play(idleKey);
      }
      this.sprite = s;
    } else {
      this.sprite = scene.add.rectangle(width * 0.65, height * 0.42, cfg.width, cfg.height, cfg.color);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.attack = this.str;   // keep attack in sync after external atkBoost writes
    this._flashDamage();
    return this.hp <= 0;
  }

  isAlive(): boolean { return this.hp > 0; }

  getTauntLine(): string {
    return this._taunts[Math.floor(Math.random() * this._taunts.length)] ?? '';
  }

  chooseAction(): EnemyAction {
    return { type: 'ATTACK', damage: this.attack + Math.floor(Math.random() * 6) };
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private _flashDamage(): void {
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.2,
      yoyo:     true,
      duration: 80,
      repeat:   2,
      onComplete: () => { this.sprite.setAlpha(1); },
    });
  }
}

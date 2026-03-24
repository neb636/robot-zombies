/**
 * Shared interfaces and types used across the game.
 */
import Phaser from 'phaser';

// ─── Input ───────────────────────────────────────────────────────────────────

export interface WasdKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

// ─── Battle — ATB types ───────────────────────────────────────────────────────

export type EnemyTag      = 'Electronic' | 'Armored' | 'Organic';
export type SkillType     = 'Physical' | 'EMP' | 'Fire' | 'Tech' | 'Support';
export type StatusEffectKey = 'Stunned' | 'Burning' | 'Hacked' | 'Shielded' | 'Panicked';

export interface ActiveStatusEffect {
  key: StatusEffectKey;
  /** Turns remaining. -1 = permanent until triggered (e.g. Shielded). */
  turnsRemaining: number;
}

/** Discriminated union describing what a tech does when executed. */
export type TechEffect =
  | { kind: 'damage';  skillType: SkillType; multiplier: number }
  | { kind: 'status';  apply: StatusEffectKey; targetEnemy: boolean }
  | { kind: 'heal';    amount: number; allAllies: boolean }
  | { kind: 'reveal' }
  | { kind: 'control'; turnsAsAlly: number };

export interface Tech {
  id: string;
  label: string;
  /** ATB points drained from the caster on use (0–100). */
  atbCost: number;
  targeting: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  effect: TechEffect;
}

/**
 * Full ATB combatant — extends BattlePlayer without breaking existing callers.
 * All numeric stats are integers.
 */
export interface ATBCombatant extends BattlePlayer {
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
  /** Current ATB gauge, 0–100. */
  atb: number;
  statuses: ActiveStatusEffect[];
  techs: readonly Tech[];
  /** Enemy damage-type tags (empty array for party members). */
  tags: readonly EnemyTag[];
  /** True once Maya's Analyze reveals enemy tags in the HUD. */
  tagsRevealed: boolean;
}

// ─── Battle ──────────────────────────────────────────────────────────────────

export interface AllyConfig {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  color: number;
}

export interface BossPhase {
  hpThreshold: number;
  atkBoost: number;
  dialogue: string[];
}

export interface BossConfig {
  phases: BossPhase[];
  conversionTriggerHp?: number;
}

export interface BattleInitData {
  enemyKey: string;
  returnScene: string;
  allies?: AllyConfig[];
  scripted?: boolean;
  bossConfig?: BossConfig;
}

export interface BattlePlayer {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  takeDamage(amount: number): boolean;
  heal(amount: number): void;
  isAlive(): boolean;
}

export interface EnemyAction {
  type: 'ATTACK';
  damage: number;
}

export interface BattleMenuAction {
  label: string;
  action: string;
}

/** Scene interface required by BattleManager to signal battle completion. */
export interface IBattleScene extends Phaser.Scene {
  endBattle(victory: boolean): void;
}

// ─── Save System ─────────────────────────────────────────────────────────────

/**
 * Versioned save file shape. All fields must be JSON-serialisable.
 *
 * When adding fields:
 *   1. Add the field here with its type.
 *   2. Read/write it in SaveManager.save() / SaveManager.restore().
 *   3. Bump CURRENT_VERSION in SaveManager.ts.
 *   4. Add a migration function in the MIGRATIONS map.
 */
export interface SaveData {
  /** Schema version — always the first field checked on load. */
  version: number;
  /** Unix timestamp (Date.now()) when the save was written. */
  savedAt: number;
  playerName: string;
  /** Phaser scene key to resume from (e.g. 'WorldMapScene'). */
  currentScene: string;
  /** Current story chapter (1–5). */
  chapter: number;
  /** Arbitrary story-progression flags (gate checks, seen-cutscenes, etc.). */
  flags: Record<string, boolean>;
  /** Moral tracking: how many Converted humans were cured. */
  convertedCured: number;
  /** Moral tracking: how many Converted humans were fought. */
  convertedFought: number;
}

// ─── Prologue ─────────────────────────────────────────────────────────────────

export interface Interactable {
  id: string;
  x: number;
  y: number;
  range: number;
  label: string;
  available?: boolean;
  used?: boolean;
  interact: () => void;
}

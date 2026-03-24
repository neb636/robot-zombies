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

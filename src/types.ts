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

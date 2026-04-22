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
  | { kind: 'control'; turnsAsAlly: number }
  /** Placeholder for abilities that need custom logic (e.g. ATB fill, passive triggers). */
  | { kind: 'special'; description: string };

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
  /** Character id from CHARACTER_REGISTRY. Used to resolve full ATB stats. */
  id?: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  color: number;
  row?: 'front' | 'back';
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
  row: 'front' | 'back';
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

// ─── Characters ──────────────────────────────────────────────────────────────

/** Integer stat block for one chapter. All values are whole numbers. */
export interface CharacterStats {
  hp: number;
  maxHp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
}

/**
 * Static definition for a playable character.
 * `chapterStats[0]` = stats at `joinChapter`, `[1]` = next chapter, etc.
 */
export interface CharacterDef {
  id: string;
  name: string;
  /** Hex color for placeholder rectangle sprite. */
  color: number;
  /** First chapter the character is available (0 = prologue). */
  joinChapter: number;
  /** Stats indexed from joinChapter. [0] = joinChapter, [1] = joinChapter+1, … */
  chapterStats: CharacterStats[];
  techs: readonly Tech[];
  /** Human-readable passive description (logic implemented in M2+). */
  passive: string;
  /** Chapter the character is permanently lost. Elias = 2, Deja = 4. */
  lostAtChapter?: number;
}

/** Live party member state stored in the Phaser registry across scene transitions. */
export interface PartyMember {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  lck: number;
  row: 'front' | 'back';
  equipment: { weapon?: string; armor?: string; accessory?: string };
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

// ─── Survival Layer ───────────────────────────────────────────────────────────

export type Region =
  | 'boston'
  | 'appalachia'
  | 'deep_south'
  | 'great_plains'
  | 'rockies'
  | 'silicon_valley';

export interface SurvivalState {
  food: number;
  fuel: number;
  medicine: number;
  ammo: number;
  scrap: number;
  morale: number;           // 0–100
  vehicleCondition: number; // 0–100
  partySize: number;
  region: Region;
  daysElapsed: number;
}

export type TravelEventKind =
  | 'hunting_opportunity'
  | 'abandoned_store'
  | 'survivor_camp'
  | 'lucky_find'
  | 'vehicle_breakdown'
  | 'illness'
  | 'ambush'
  | 'rain_spoils'
  | 'campfire_night'
  | 'jerome_preaches'
  | 'record_player'
  | 'none';

export interface TravelEvent {
  kind: TravelEventKind;
  text: string;
  effect?: Partial<Pick<SurvivalState, 'food' | 'fuel' | 'medicine' | 'ammo' | 'scrap' | 'morale'>>;
  triggersBattle?: boolean;
  enemyKey?: string;
}

// ─── Dialogue Choices (Stream G) ─────────────────────────────────────────────

export interface DialogueChoice {
  label: string;
  nextId: string;
  setFlags?: readonly string[];
  requireFlags?: readonly string[];
  requireItems?: ReadonlyArray<{ item: keyof SurvivalState; count: number }>;
  consumeItems?: ReadonlyArray<{ item: keyof SurvivalState; count: number }>;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: readonly DialogueChoice[];
}

// ─── Save Slots (Stream G) ───────────────────────────────────────────────────

export interface SaveSlotInfo {
  slot: number;
  occupied: boolean;
  playerName?: string;
  chapter?: number;
  savedAt?: number;
  playTimeMs?: number;
  sceneKey?: string;
}

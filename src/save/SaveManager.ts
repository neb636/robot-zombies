import type { SaveData } from '../types.js';

const SAVE_KEY = 'silicon-requiem-save';

/**
 * Current save format version. Bump this whenever SaveData shape changes.
 *
 * Migration pattern:
 *   Add a function to MIGRATIONS keyed by the version it PRODUCES.
 *   e.g., to migrate v1 → v2, add: [2]: (old) => ({ ...old, newField: default })
 *
 * If a save is too old to migrate (OLDEST_SUPPORTED_VERSION), it's wiped with
 * a console warning. During active development, keep this equal to CURRENT_VERSION
 * to always wipe stale saves rather than trying to patch them.
 */
const CURRENT_VERSION = 1;
const OLDEST_SUPPORTED_VERSION = 1;

type RawSave = Record<string, unknown>;
type MigrationFn = (old: RawSave) => RawSave;

/**
 * Add an entry here each time you bump CURRENT_VERSION.
 * Key = the version number this function PRODUCES (not reads from).
 *
 * Example for a future v2 that adds a `morale` field:
 *   [2]: (old) => ({ ...old, morale: 100 }),
 */
const MIGRATIONS: Partial<Record<number, MigrationFn>> = {
  // [2]: (old) => ({ ...old, newField: defaultValue }),
};

export type SaveSummary = {
  playerName: string;
  chapter: number;
  savedAt: Date;
};

export class SaveManager {
  /** Returns true if a save file exists in localStorage. */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Persist current game state. Pass the Phaser.Game instance and the key of
   * the scene the player should resume from (e.g. 'WorldMapScene').
   *
   * Add new fields here as the game grows — then bump CURRENT_VERSION and add
   * a migration in MIGRATIONS.
   */
  static save(game: Phaser.Game, currentScene: string): void {
    const data: SaveData = {
      version: CURRENT_VERSION,
      savedAt: Date.now(),
      playerName: (game.registry.get('playerName') as string | undefined) ?? '',
      currentScene,
      chapter: (game.registry.get('chapter') as number | undefined) ?? 1,
      flags: (game.registry.get('flags') as Record<string, boolean> | undefined) ?? {},
      convertedCured: (game.registry.get('convertedCured') as number | undefined) ?? 0,
      convertedFought: (game.registry.get('convertedFought') as number | undefined) ?? 0,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  /**
   * Load and validate the save from localStorage. Runs migrations if the version
   * is out of date. Returns null if no save exists or the data is corrupted/too old.
   */
  static load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;

    let parsed: RawSave;
    try {
      parsed = JSON.parse(raw) as RawSave;
    } catch {
      console.warn('[SaveManager] Corrupted save data — clearing.');
      this.clear();
      return null;
    }

    const version = typeof parsed['version'] === 'number' ? parsed['version'] : 0;

    if (version < OLDEST_SUPPORTED_VERSION) {
      console.warn(`[SaveManager] Save version ${version} is too old (min: ${OLDEST_SUPPORTED_VERSION}) — clearing.`);
      this.clear();
      return null;
    }

    const migrated = this._migrate(parsed, version);
    if (migrated === null) {
      this.clear();
      return null;
    }

    return migrated as unknown as SaveData;
  }

  /**
   * Write save data back into Phaser's game registry so scenes can read it
   * as if the player had played through normally.
   */
  static restore(game: Phaser.Game, data: SaveData): void {
    game.registry.set('playerName', data.playerName);
    game.registry.set('chapter', data.chapter);
    game.registry.set('flags', data.flags);
    game.registry.set('convertedCured', data.convertedCured);
    game.registry.set('convertedFought', data.convertedFought);
  }

  /** Summary info for display on the title screen. */
  static getSummary(): SaveSummary | null {
    const data = this.load();
    if (data === null) return null;
    return {
      playerName: data.playerName,
      chapter: data.chapter,
      savedAt: new Date(data.savedAt),
    };
  }

  /** Delete the save from localStorage. */
  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private static _migrate(data: RawSave, fromVersion: number): RawSave | null {
    let current = { ...data };
    for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
      const fn = MIGRATIONS[v];
      if (fn === undefined) continue;
      try {
        current = fn(current);
      } catch (err) {
        console.warn(`[SaveManager] Migration to v${v} failed:`, err);
        return null;
      }
    }
    return current;
  }
}

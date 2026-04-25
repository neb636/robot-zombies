import Phaser from 'phaser';
import type { SaveData, SaveSlotInfo, SurvivalState } from '../types.js';

/**
 * 3-slot save wrapper. Each slot stores a full SaveData shape plus the
 * survivalState registry blob and accumulated play time.
 *
 * localStorage keys: `silicon-requiem-save-slot-{0,1,2}`
 */
const SLOT_COUNT = 3;
const KEY = (slot: number): string => `silicon-requiem-save-slot-${slot}`;

/** Internal shape persisted to localStorage per slot. */
interface SlotPayload {
  save: SaveData;
  survivalState: SurvivalState | null;
  playTimeMs: number;
  startedAt: number;
}

export class SaveSlot {
  /** Returns info for all 3 slots; empty slots have occupied: false. */
  static list(): SaveSlotInfo[] {
    const out: SaveSlotInfo[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const raw = localStorage.getItem(KEY(i));
      if (!raw) {
        out.push({ slot: i, occupied: false });
        continue;
      }
      try {
        const payload = JSON.parse(raw) as SlotPayload;
        out.push({
          slot:       i,
          occupied:   true,
          playerName: payload.save.playerName,
          chapter:    payload.save.chapter,
          savedAt:    payload.save.savedAt,
          playTimeMs: payload.playTimeMs,
          sceneKey:   payload.save.currentScene,
        });
      } catch {
        out.push({ slot: i, occupied: false });
      }
    }
    return out;
  }

  /**
   * Persist game state to the given slot.
   * Reads the full Phaser registry to build SaveData + pulls survivalState.
   * Accumulates play time from any previous saves on this slot.
   */
  static save(slot: number, game: Phaser.Game, currentScene: string): void {
    const reg = game.registry;

    const saveData: SaveData = {
      version:         1,
      savedAt:         Date.now(),
      playerName:      (reg.get('playerName') as string | undefined) ?? '',
      currentScene,
      chapter:         (reg.get('chapter') as number | undefined) ?? 1,
      flags:           (reg.get('flags') as Record<string, boolean> | undefined) ?? {},
      convertedCured:  (reg.get('convertedCured') as number | undefined) ?? 0,
      convertedFought: (reg.get('convertedFought') as number | undefined) ?? 0,
    };

    const survivalState = (reg.get('survivalState') as SurvivalState | undefined) ?? null;

    // Accumulate play time from existing slot if present
    let playTimeMs = 0;
    let startedAt  = Date.now();
    const existing = localStorage.getItem(KEY(slot));
    if (existing) {
      try {
        const prev = JSON.parse(existing) as SlotPayload;
        playTimeMs = prev.playTimeMs + (Date.now() - prev.save.savedAt);
        startedAt  = prev.startedAt;
      } catch { /* start fresh */ }
    }

    const payload: SlotPayload = { save: saveData, survivalState, playTimeMs, startedAt };
    localStorage.setItem(KEY(slot), JSON.stringify(payload));
  }

  /**
   * Load save data from a slot. Returns null if empty or corrupted.
   * After loading, call game.registry restoration manually (see SaveLoadScene).
   */
  static load(slot: number): SaveData | null {
    const raw = localStorage.getItem(KEY(slot));
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw) as SlotPayload;
      return payload.save;
    } catch {
      return null;
    }
  }

  /**
   * Load the survival state from a slot. Returns null if slot is empty.
   * Used alongside load() to fully restore game state.
   */
  static loadSurvival(slot: number): SurvivalState | null {
    const raw = localStorage.getItem(KEY(slot));
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw) as SlotPayload;
      return payload.survivalState;
    } catch {
      return null;
    }
  }

  /** Delete a slot from localStorage. */
  static clear(slot: number): void {
    localStorage.removeItem(KEY(slot));
  }
}

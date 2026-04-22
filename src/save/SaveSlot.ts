import Phaser from 'phaser';
import type { SaveData, SaveSlotInfo } from '../types.js';

/**
 * 3-slot save wrapper over existing SaveManager. PHASE B STUB —
 * Stream G fills the body. The public shape is frozen here.
 */
const SLOT_COUNT = 3;
const KEY = (slot: number): string => `silicon-requiem-save-slot-${slot}`;

export class SaveSlot {
  static list(): SaveSlotInfo[] {
    const out: SaveSlotInfo[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const raw = localStorage.getItem(KEY(i));
      if (!raw) {
        out.push({ slot: i, occupied: false });
        continue;
      }
      try {
        const data = JSON.parse(raw) as SaveData;
        out.push({
          slot:       i,
          occupied:   true,
          playerName: data.playerName,
          chapter:    data.chapter,
          savedAt:    data.savedAt,
          sceneKey:   data.currentScene,
        });
      } catch {
        out.push({ slot: i, occupied: false });
      }
    }
    return out;
  }

  /** STUB — Stream G wires the save flow. */
  static save(_slot: number, _game: Phaser.Game, _currentScene: string): void {
    /* no-op */
  }

  /** STUB — Stream G wires the load flow. */
  static load(_slot: number): SaveData | null { return null; }

  static clear(slot: number): void {
    localStorage.removeItem(KEY(slot));
  }
}

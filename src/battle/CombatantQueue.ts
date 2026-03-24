/**
 * CombatantQueue — ordered queue of combatants whose ATB gauge has hit 100.
 *
 * Entries are ordered by the timestamp at which their ATB filled
 * (earliest first), which also drives combo detection in 2G.
 */
import type { ATBCombatant } from '../types.js';

export interface QueueEntry {
  combatant: ATBCombatant;
  /** performance.now() value when ATB hit 100 — used for combo detection. */
  timestamp: number;
}

export class CombatantQueue {
  private readonly _entries: QueueEntry[] = [];

  push(combatant: ATBCombatant, timestamp: number): void {
    this._entries.push({ combatant, timestamp });
    // Keep sorted by timestamp (earliest acts first)
    this._entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  peek(): QueueEntry | null {
    return this._entries[0] ?? null;
  }

  pop(): QueueEntry | null {
    return this._entries.shift() ?? null;
  }

  has(combatant: ATBCombatant): boolean {
    return this._entries.some(e => e.combatant === combatant);
  }

  /** Remove all entries for a specific combatant (e.g. if they die). */
  remove(combatant: ATBCombatant): void {
    const idx = this._entries.findIndex(e => e.combatant === combatant);
    if (idx !== -1) this._entries.splice(idx, 1);
  }

  clear(): void {
    this._entries.length = 0;
  }

  get size(): number {
    return this._entries.length;
  }
}

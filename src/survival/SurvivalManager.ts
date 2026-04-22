import Phaser from 'phaser';
import type { SurvivalState, TravelEvent, Region } from '../types.js';

/**
 * SurvivalManager — owns the survival state (food/fuel/medicine/ammo/morale
 * /vehicleCondition/daysElapsed/region) and exposes the travel-tick API.
 *
 * PHASE B STUB — Stream A fills the body. Public surface frozen here so
 * other streams can import it without waiting for Stream A.
 *
 * Persisted to the Phaser registry under key `'survivalState'` so SaveManager
 * can serialize it with the rest of the save.
 */
const REGISTRY_KEY = 'survivalState';

const DEFAULT_STATE: SurvivalState = {
  food:             14,
  fuel:             8,
  medicine:         3,
  ammo:             40,
  scrap:            0,
  morale:           72,
  vehicleCondition: 85,
  partySize:        1,
  region:           'boston',
  daysElapsed:      0,
};

export class SurvivalManager {
  private static _instance: SurvivalManager | null = null;

  private readonly _registry: Phaser.Data.DataManager;

  private constructor(registry: Phaser.Data.DataManager) {
    this._registry = registry;
    if (!this._registry.get(REGISTRY_KEY)) {
      this._registry.set(REGISTRY_KEY, { ...DEFAULT_STATE });
    }
  }

  static instance(scene: Phaser.Scene): SurvivalManager {
    if (!SurvivalManager._instance) {
      SurvivalManager._instance = new SurvivalManager(scene.game.registry);
    }
    return SurvivalManager._instance;
  }

  /** Read the current state. Callers MUST NOT mutate the returned object. */
  getState(): Readonly<SurvivalState> {
    return this._registry.get(REGISTRY_KEY) as SurvivalState;
  }

  /**
   * Advance time. STUB — returns the unchanged state until Stream A fills the body.
   */
  travelTick(_days: number = 1): { state: SurvivalState; event?: TravelEvent } {
    return { state: this.getState() as SurvivalState };
  }

  /** Resolve a travel event's resource deltas into state. STUB. */
  applyEvent(_event: TravelEvent): void { /* no-op */ }

  has(item: keyof SurvivalState, count: number): boolean {
    return (this.getState()[item] as number) >= count;
  }

  consume(item: keyof SurvivalState, count: number): void {
    const state = { ...this.getState() };
    const current = state[item] as number;
    (state as Record<string, unknown>)[item] = Math.max(0, current - count);
    this._registry.set(REGISTRY_KEY, state);
  }

  addItem(item: keyof SurvivalState, count: number): void {
    const state = { ...this.getState() };
    const current = state[item] as number;
    (state as Record<string, unknown>)[item] = current + count;
    this._registry.set(REGISTRY_KEY, state);
  }

  /** Post-battle bookkeeping (ammo drain, possible wound). STUB. */
  onBattleComplete(_scripted: boolean): void { /* no-op */ }

  region(): Region { return this.getState().region; }

  setRegion(region: Region): void {
    const state = { ...this.getState(), region };
    this._registry.set(REGISTRY_KEY, state);
  }
}

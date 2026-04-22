import Phaser from 'phaser';
import type { SurvivalState, TravelEvent, Region } from '../types.js';
import { bus } from '../utils/EventBus.js';
import { EVENTS, GAME_FLAGS, setFlag } from '../utils/constants.js';
import { rollRandomEvent } from './TravelEvents.js';

/**
 * SurvivalManager — owns the survival state (food/fuel/medicine/ammo/morale
 * /vehicleCondition/daysElapsed/region) and exposes the travel-tick API.
 *
 * Persisted to the Phaser registry under key `'survivalState'` so SaveManager
 * can serialize it with the rest of the save.
 *
 * All math is integer-only (Math.floor at every step).
 */
const REGISTRY_KEY = 'survivalState';

/** Probability (0–100 integer) that a random event fires per travel day. */
const EVENT_CHANCE = 40;

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

// ─── Hunger thresholds (spec) ──────────────────────────────────────────────

/** Below this level morale begins draining −2/day. */
const HUNGER_MORALE_DRAIN_THRESHOLD = 7;
/** Below this level all stats suffer (managed externally via SURVIVAL_TICK payload). */
const HUNGER_STAT_PENALTY_THRESHOLD = 3;
/** Starvation: morale drains −10/day, HP drains (tracked externally). */
const STARVATION_THRESHOLD = 1;

// ─── Ammo drain per battle ─────────────────────────────────────────────────

const BATTLE_AMMO_DRAIN_MIN = 5;
const BATTLE_AMMO_DRAIN_MAX = 20;

export class SurvivalManager {
  private static _instance: SurvivalManager | null = null;

  private readonly _registry: Phaser.Data.DataManager;
  private _unsubTravel: (() => void) | null = null;
  private _unsubBattle: (() => void) | null = null;

  private constructor(registry: Phaser.Data.DataManager) {
    this._registry = registry;
    if (!this._registry.get(REGISTRY_KEY)) {
      this._registry.set(REGISTRY_KEY, { ...DEFAULT_STATE });
    }
    this._wireEventBus();
  }

  static instance(scene: Phaser.Scene): SurvivalManager {
    if (!SurvivalManager._instance) {
      SurvivalManager._instance = new SurvivalManager(scene.game.registry);
    }
    return SurvivalManager._instance;
  }

  // ─── EventBus wiring ───────────────────────────────────────────────────

  private _wireEventBus(): void {
    this._unsubTravel = bus.on(EVENTS.WORLD_MAP_TRAVEL, ({ days }) => {
      this.travelTick(days);
    });

    this._unsubBattle = bus.on(EVENTS.BATTLE_END, ({ victory }) => {
      this.onBattleComplete(false, victory);
    });
  }

  /** Call when tearing down (scene shutdown). Rare — manager is a singleton. */
  destroy(): void {
    this._unsubTravel?.();
    this._unsubBattle?.();
    SurvivalManager._instance = null;
  }

  // ─── State accessors ───────────────────────────────────────────────────

  /** Read the current state. Callers MUST NOT mutate the returned object. */
  getState(): Readonly<SurvivalState> {
    return this._registry.get(REGISTRY_KEY) as SurvivalState;
  }

  private _setState(next: SurvivalState): void {
    this._registry.set(REGISTRY_KEY, next);
  }

  // ─── Core travel tick ──────────────────────────────────────────────────

  /**
   * Advance time by `days` travel days.
   * Each day:
   *  1. Drain food (partySize units/day)
   *  2. Drain fuel (1 tank/day — vehicle travel)
   *  3. Increment daysElapsed
   *  4. Apply hunger cascades
   *  5. Roll random event (40% chance/day)
   *
   * Emits EVENTS.SURVIVAL_TICK after the final day resolves.
   */
  travelTick(days: number = 1): { state: SurvivalState; event?: TravelEvent } {
    let state = { ...this.getState() };
    let lastEvent: TravelEvent | undefined;

    const safeNDays = Math.max(1, Math.floor(days));

    for (let d = 0; d < safeNDays; d++) {
      // 1. Food drain
      state.food = Math.max(0, state.food - state.partySize);

      // 2. Fuel drain (one tank per zone)
      state.fuel = Math.max(0, state.fuel - 1);

      // 3. Elapsed days
      state.daysElapsed = state.daysElapsed + 1;

      // 4. Hunger cascades (all integer math)
      state = this._applyHungerEffects(state);

      // 5. Morale floor
      state.morale = Math.max(0, Math.min(100, state.morale));

      // 6. Random event (40% per day)
      const roll = Math.floor(Math.random() * 100);
      if (roll < EVENT_CHANCE) {
        const event = rollRandomEvent(state.region);
        if (event.kind !== 'none') {
          // Apply non-battle events automatically; battle events are surfaced to caller
          if (!event.triggersBattle) {
            state = this._applyEventDeltas(state, event);
          }
          lastEvent = event;
        }
      }
    }

    // Clamp all values
    state = this._clamp(state);

    // Update morale-low flag
    this._updateMoraleFlag(state);

    this._setState(state);

    if (lastEvent !== undefined) {
      bus.emit(EVENTS.SURVIVAL_TICK, { state, event: lastEvent });
    } else {
      bus.emit(EVENTS.SURVIVAL_TICK, { state });
    }

    if (lastEvent !== undefined) {
      return { state, event: lastEvent };
    }
    return { state };
  }

  // ─── Event application ─────────────────────────────────────────────────

  /**
   * Apply a travel event's resource deltas to state.
   * Called externally when the player resolves a choice event (e.g., hunting
   * outcome, trade) or by travelTick for automatic events.
   */
  applyEvent(event: TravelEvent): void {
    let state = { ...this.getState() };
    state = this._applyEventDeltas(state, event);
    state = this._clamp(state);
    this._updateMoraleFlag(state);
    this._setState(state);
    bus.emit(EVENTS.SURVIVAL_TICK, { state, event });
  }

  private _applyEventDeltas(state: SurvivalState, event: TravelEvent): SurvivalState {
    if (!event.effect) return state;
    const next = { ...state };
    const e = event.effect;
    if (e.food     !== undefined) next.food     = Math.max(0, next.food     + Math.floor(e.food));
    if (e.fuel     !== undefined) next.fuel     = Math.max(0, next.fuel     + Math.floor(e.fuel));
    if (e.medicine !== undefined) next.medicine = Math.max(0, next.medicine + Math.floor(e.medicine));
    if (e.ammo     !== undefined) next.ammo     = Math.max(0, next.ammo     + Math.floor(e.ammo));
    if (e.scrap    !== undefined) next.scrap    = Math.max(0, next.scrap    + Math.floor(e.scrap));
    if (e.morale   !== undefined) next.morale   = Math.max(0, Math.min(100, next.morale + Math.floor(e.morale)));
    return next;
  }

  // ─── Hunger cascade (spec) ─────────────────────────────────────────────

  private _applyHungerEffects(state: SurvivalState): SurvivalState {
    const next = { ...state };

    if (next.food <= 0) {
      // Starvation: morale -10/day (spec). HP drain tracked by BattleManager.
      next.morale = Math.max(0, next.morale - 10);
    } else if (next.food <= STARVATION_THRESHOLD) {
      // 1–2 days supply: morale still collapses (handled above via food===0 check in spec
      // but spec says starvation at 0; 1-2 days = "hunger warning" so lighter drain)
      next.morale = Math.max(0, next.morale - 5);
    } else if (next.food <= HUNGER_STAT_PENALTY_THRESHOLD) {
      // 1–2 days: hunger warning, stats hit (external), morale drain -2/day
      next.morale = Math.max(0, next.morale - 2);
    } else if (next.food <= HUNGER_MORALE_DRAIN_THRESHOLD) {
      // 3–7 days: light morale drain
      next.morale = Math.max(0, next.morale - 2);
    }

    return next;
  }

  // ─── Post-battle bookkeeping ───────────────────────────────────────────

  /**
   * Called after any battle ends (scripted or random).
   * Drains ammo 5–20 rounds. On defeat: drains 1 medicine for wounds.
   */
  onBattleComplete(scripted: boolean, victory: boolean = true): void {
    if (scripted) return; // Scripted battles have no survival cost

    let state = { ...this.getState() };

    // Ammo drain: 5–20 rounds, integer
    const ammoDrain = BATTLE_AMMO_DRAIN_MIN +
      Math.floor(Math.random() * (BATTLE_AMMO_DRAIN_MAX - BATTLE_AMMO_DRAIN_MIN + 1));
    state.ammo = Math.max(0, state.ammo - ammoDrain);

    // Wound: loss costs medicine
    if (!victory) {
      state.medicine = Math.max(0, state.medicine - 1);
      state.morale   = Math.max(0, state.morale - 5);
    }

    state = this._clamp(state);
    this._updateMoraleFlag(state);
    this._setState(state);
    bus.emit(EVENTS.SURVIVAL_TICK, { state });
  }

  // ─── Convenience API ──────────────────────────────────────────────────

  has(item: keyof SurvivalState, count: number): boolean {
    const val = this.getState()[item];
    return typeof val === 'number' && val >= count;
  }

  consume(item: keyof SurvivalState, count: number): void {
    const state = { ...this.getState() };
    const current = state[item] as number;
    (state as Record<string, unknown>)[item] = Math.max(0, Math.floor(current - count));
    this._updateMoraleFlag(state);
    this._setState(state);
  }

  addItem(item: keyof SurvivalState, count: number): void {
    const state = { ...this.getState() };
    const current = state[item] as number;
    (state as Record<string, unknown>)[item] = Math.floor(current + count);
    this._setState(state);
  }

  region(): Region { return this.getState().region; }

  setRegion(region: Region): void {
    const state = { ...this.getState(), region };
    this._setState(state);
  }

  // ─── Internal helpers ─────────────────────────────────────────────────

  private _clamp(state: SurvivalState): SurvivalState {
    return {
      ...state,
      food:             Math.max(0, Math.floor(state.food)),
      fuel:             Math.max(0, Math.floor(state.fuel)),
      medicine:         Math.max(0, Math.floor(state.medicine)),
      ammo:             Math.max(0, Math.floor(state.ammo)),
      scrap:            Math.max(0, Math.floor(state.scrap)),
      morale:           Math.max(0, Math.min(100, Math.floor(state.morale))),
      vehicleCondition: Math.max(0, Math.min(100, Math.floor(state.vehicleCondition))),
      partySize:        Math.max(1, Math.floor(state.partySize)),
      daysElapsed:      Math.max(0, Math.floor(state.daysElapsed)),
    };
  }

  private _updateMoraleFlag(state: SurvivalState): void {
    const isLow = state.morale < 30;
    setFlag(this._registry, GAME_FLAGS.MORALE_LOW, isLow);
  }
}

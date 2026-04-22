/**
 * EliasPassive — Hunting Instinct.
 * Hunting mini-game success rate +2 tiers while Elias is alive.
 * Survival food drain −50% while Elias is alive.
 *
 * These are world-map / survival-layer effects. This module exposes
 * query helpers that the survival layer (planned) can call.
 */
import type { BattleManager } from '../BattleManager.js';

/**
 * Returns true if Elias is currently alive in the party (in battle context).
 * The survival layer should call isEliasAlive() from PartyManager instead.
 */
export function isEliasAlive(manager: BattleManager): boolean {
  return manager.allies.some(a => a.name === 'ELIAS' && a.isAlive());
}

/**
 * Food drain multiplier applied while Elias is alive.
 * Returns 0.5 (−50%) if Elias is alive, 1.0 otherwise.
 */
export function getFoodDrainMultiplier(eliasAlive: boolean): number {
  return eliasAlive ? 0.5 : 1.0;
}

/** Additive hunting tier bonus while Elias is alive. */
export const HUNTING_TIER_BONUS = 2;

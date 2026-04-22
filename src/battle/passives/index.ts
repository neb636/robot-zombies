/**
 * passives/index.ts — re-exports all character passive helpers.
 */

export { applyAdaptable }                          from './PlayerPassive.js';
export { applyOldFriend, removeOldFriend }         from './MarcusPassive.js';
export { getMedicineCost }                         from './MayaPassive.js';
export {
  isEliasAlive,
  getFoodDrainMultiplier,
  HUNTING_TIER_BONUS,
}                                                  from './EliasPassive.js';
export { computeDejaCritChance, rollDejaCrit, BASE_CRIT_RATE } from './DejaPassive.js';
export { enforceMoraleFloor, getAmmoDrop, JEROME_MORALE_FLOOR } from './JeromePassive.js';
export { rollSchematics, autoResolveBreakdown }    from './DrChenPassive.js';

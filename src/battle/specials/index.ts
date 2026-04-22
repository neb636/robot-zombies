/**
 * specials/index.ts — re-exports all special tech executors.
 * Import from here, not from individual files.
 */

export { executeRally }                                from './Rally.js';
export { tryLastStand }                                from './LastStand.js';
export { applyOverclock, getOverclockMultiplier, tickOverclock } from './Overclock.js';
export { executeSystemCrash }                          from './SystemCrash.js';
export { applyControl, tickControl, isControlled }     from './Control.js';

import { executeRally }       from './Rally.js';
import { onLastStandCheck }   from './LastStand.js';
import { executeOverclock }   from './Overclock.js';
import { executeSystemCrash } from './SystemCrash.js';
import { executeControl }     from './Control.js';

/**
 * Dispatch map keyed by tech id. TechExecutor.execute() looks up special-
 * kind techs here and calls the registered function with the battle context.
 *
 * Stream D wires full context-aware implementations; Phase B gives callers
 * a non-crashing import target.
 */
export const SPECIAL_DISPATCH: Readonly<Record<string, (ctx: unknown) => void>> = {
  rally:        executeRally,
  last_stand:   onLastStandCheck,
  overclock:    executeOverclock,
  system_crash: executeSystemCrash,
  rewire:       executeControl,
  control:      executeControl,
};

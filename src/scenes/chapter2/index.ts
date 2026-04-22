/**
 * Chapter 2 — "Sweet Home": Deep South scene bundle.
 *
 * Scene flow:
 *   NewMemphisScene → MississippiCrossingScene → BayouScene → Vault49Scene → WorldMapScene
 *
 * Register all four scenes in config.ts to use them:
 *   import { chapter2Scenes } from './scenes/chapter2/index.js';
 *   // spread into the scenes array in gameConfig
 *
 * Critical story beats:
 *   - Deja recruitment (NewMemphisScene)
 *   - Tomas choice row §7 (MississippiCrossingScene) → TOMAS_DEBT_CLEARED / TOMAS_REFUSED
 *   - Elias loss (BayouScene) → ELIAS_LOST + ELIAS_DRAIN_ACTIVE
 *   - Governor boss fight — Organic only, no Electronic tags
 *   - Vault 49 Elena terminals → VAULT49_TERMINALS_READ
 *   - Tilly's father recording (gated on TILLY_TRUSTED) → TILLY_FATHER_HEARD
 *   - Sam cameo → SAM_MET_VAULT49
 */
export { NewMemphisScene }           from './NewMemphisScene.js';
export { MississippiCrossingScene }  from './MississippiCrossingScene.js';
export { BayouScene }                from './BayouScene.js';
export { Vault49Scene }              from './Vault49Scene.js';

import { NewMemphisScene }          from './NewMemphisScene.js';
import { MississippiCrossingScene } from './MississippiCrossingScene.js';
import { BayouScene }               from './BayouScene.js';
import { Vault49Scene }             from './Vault49Scene.js';

/** Drop-in array for Phaser scene config. */
export const chapter2Scenes = [
  NewMemphisScene,
  MississippiCrossingScene,
  BayouScene,
  Vault49Scene,
] as const;

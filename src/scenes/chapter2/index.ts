/**
 * Chapter 2 — "Sweet Home": Deep South scene bundle.
 *
 * Scene flow:
 *   NewMemphisScene → MississippiCrossingScene → BayouScene → Vault49Scene → WorldMapScene
 */
export { NewMemphisScene }           from './newMemphis/NewMemphisScene.js';
export { MississippiCrossingScene }  from './mississippiCrossing/MississippiCrossingScene.js';
export { BayouScene }                from './bayou/BayouScene.js';
export { Vault49Scene }              from './vault49/Vault49Scene.js';

import { NewMemphisScene }          from './newMemphis/NewMemphisScene.js';
import { MississippiCrossingScene } from './mississippiCrossing/MississippiCrossingScene.js';
import { BayouScene }               from './bayou/BayouScene.js';
import { Vault49Scene }             from './vault49/Vault49Scene.js';

export const chapter2Scenes = [
  NewMemphisScene,
  MississippiCrossingScene,
  BayouScene,
  Vault49Scene,
] as const;

export const CHAPTER2_SCENES = chapter2Scenes as readonly unknown[] as import('phaser').Types.Scenes.SceneType[];

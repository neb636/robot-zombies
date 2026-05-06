/**
 * Prologue scene bundle.
 *
 * Flow:
 *   PrologueScene (apartment) → NewBostonScene → SubwayScene → WorldMapScene
 *
 * ApartmentV3Scene is a dev-facing apartment redesign sandbox; reachable from
 * the dev jump panel and registered alongside the main path.
 */
import Phaser from 'phaser';
import { PrologueScene }     from './apartment/PrologueScene.js';
import { ApartmentV3Scene }  from './apartment/ApartmentV3Scene.js';
import { NewBostonScene }    from './newBoston/NewBostonScene.js';
import { SubwayScene }       from './subway/SubwayScene.js';

export { PrologueScene, ApartmentV3Scene, NewBostonScene, SubwayScene };

export const PROLOGUE_SCENES: Phaser.Types.Scenes.SceneType[] = [
  PrologueScene,
  ApartmentV3Scene,
  NewBostonScene,
  SubwayScene,
];

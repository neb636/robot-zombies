/**
 * Chapter 5 — "Silicon Requiem"
 * Scene bundle. Import this to get all Chapter 5 scene classes.
 *
 * Registration in config.ts is handled separately per project constraint
 * (do not edit config.ts from this stream).
 *
 * Scene order:
 *   ValleyApproachScene      → CampusPerimeterScene
 *   CampusPerimeterScene     → MainframeCoreScene
 *   MainframeCoreScene       → BoardroomAntechamberScene
 *   BoardroomAntechamberScene → BoardroomScene
 */
import Phaser from 'phaser';
import { ValleyApproachScene }       from './ValleyApproachScene.js';
import { CampusPerimeterScene }      from './CampusPerimeterScene.js';
import { MainframeCoreScene }        from './MainframeCoreScene.js';
import { BoardroomAntechamberScene } from './BoardroomAntechamberScene.js';
import { BoardroomScene }            from './BoardroomScene.js';

export {
  ValleyApproachScene,
  CampusPerimeterScene,
  MainframeCoreScene,
  BoardroomAntechamberScene,
  BoardroomScene,
};

/** Alias used by src/config.ts aggregator. */
export const CHAPTER5_SCENES: Phaser.Types.Scenes.SceneType[] = [
  ValleyApproachScene,
  CampusPerimeterScene,
  MainframeCoreScene,
  BoardroomAntechamberScene,
  BoardroomScene,
];

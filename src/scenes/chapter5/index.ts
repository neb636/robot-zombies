/**
 * Chapter 5 — "Quiet Machines"
 *
 * Scene order:
 *   ValleyApproachScene → CampusPerimeterScene → MainframeCoreScene
 *     → BoardroomAntechamberScene → BoardroomScene
 */
import Phaser from 'phaser';
import { ValleyApproachScene }       from './valleyApproach/ValleyApproachScene.js';
import { CampusPerimeterScene }      from './campusPerimeter/CampusPerimeterScene.js';
import { MainframeCoreScene }        from './mainframeCore/MainframeCoreScene.js';
import { BoardroomAntechamberScene } from './boardroomAntechamber/BoardroomAntechamberScene.js';
import { BoardroomScene }            from './boardroom/BoardroomScene.js';

export {
  ValleyApproachScene,
  CampusPerimeterScene,
  MainframeCoreScene,
  BoardroomAntechamberScene,
  BoardroomScene,
};

export const CHAPTER5_SCENES: Phaser.Types.Scenes.SceneType[] = [
  ValleyApproachScene,
  CampusPerimeterScene,
  MainframeCoreScene,
  BoardroomAntechamberScene,
  BoardroomScene,
];

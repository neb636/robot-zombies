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
export { ValleyApproachScene }       from './ValleyApproachScene.js';
export { CampusPerimeterScene }      from './CampusPerimeterScene.js';
export { MainframeCoreScene }        from './MainframeCoreScene.js';
export { BoardroomAntechamberScene } from './BoardroomAntechamberScene.js';
export { BoardroomScene }            from './BoardroomScene.js';

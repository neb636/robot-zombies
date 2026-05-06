/**
 * Cross-cutting framework scenes — boot, preload, battle/dialogue overlays,
 * world map, save/load, pause menu, trade, hunting. Dev-only scenes are
 * exported separately via DEV_SCENES.
 */
import Phaser from 'phaser';
import { BootScene }        from './boot/BootScene.js';
import { PreloadScene }     from './preload/PreloadScene.js';
import { BattleScene }      from './battle/BattleScene.js';
import { DialogueScene }    from './dialogue/DialogueScene.js';
import { WorldMapScene }    from './worldMap/WorldMapScene.js';
import { TradeScene }       from './trade/TradeScene.js';
import { HuntingScene }     from './hunting/HuntingScene.js';
import { SaveLoadScene }    from './saveLoad/SaveLoadScene.js';
import { PauseMenuScene }   from './pauseMenu/PauseMenuScene.js';
import { DevScene }          from './_dev/DevScene.js';
import { SceneBuilderScene } from './_dev/SceneBuilderScene.js';

export {
  BootScene, PreloadScene, BattleScene, DialogueScene, WorldMapScene,
  TradeScene, HuntingScene, SaveLoadScene, PauseMenuScene,
  DevScene, SceneBuilderScene,
};

export const CORE_SCENES: Phaser.Types.Scenes.SceneType[] = [
  BootScene,
  PreloadScene,
  BattleScene,
  DialogueScene,
  WorldMapScene,
  TradeScene,
  HuntingScene,
  SaveLoadScene,
  PauseMenuScene,
];

export const DEV_SCENES: Phaser.Types.Scenes.SceneType[] = [
  DevScene,
  SceneBuilderScene,
];

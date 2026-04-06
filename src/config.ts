import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { PreloadScene }    from './scenes/PreloadScene.js';
import { TitleScene }      from './scenes/TitleScene.js';
import { NameEntryScene }  from './scenes/NameEntryScene.js';
import { PrologueScene }    from './scenes/PrologueScene.js';
import { NewBostonScene }  from './scenes/NewBostonScene.js';
import { SubwayScene }     from './scenes/SubwayScene.js';
import { WorldMapScene }   from './scenes/WorldMapScene.js';
import { BattleScene }     from './scenes/BattleScene.js';
import { DialogueScene }   from './scenes/DialogueScene.js';
import { DevScene }        from './scenes/DevScene.js';
import { PrologueV2Scene } from './scenes/prologue-v2/PrologueV2Scene.js';
import { PrologueBedroomScene }    from './scenes/prologue-v3/PrologueBedroomScene.js';
import { PrologueLivingRoomScene } from './scenes/prologue-v3/PrologueLivingRoomScene.js';

const scenes: Phaser.Types.Core.GameConfig['scene'] = [
  BootScene,
  PreloadScene,
  TitleScene,
  NameEntryScene,
  PrologueScene,
  PrologueV2Scene,
  PrologueBedroomScene,
  PrologueLivingRoomScene,
  NewBostonScene,
  SubwayScene,
  WorldMapScene,
  BattleScene,
  DialogueScene,
  ...(import.meta.env.DEV ? [DevScene] : []),
];

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: scenes,
};

import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { PreloadScene }    from './scenes/PreloadScene.js';
import { TitleScene }      from './scenes/TitleScene.js';
import { NameEntryScene }  from './scenes/NameEntryScene.js';
import { PrologueScene }   from './scenes/PrologueScene.js';
import { NewBostonScene }  from './scenes/NewBostonScene.js';
import { SubwayScene }     from './scenes/SubwayScene.js';
import { WorldMapScene }   from './scenes/WorldMapScene.js';
import { BattleScene }     from './scenes/BattleScene.js';
import { DialogueScene }   from './scenes/DialogueScene.js';
import { DevScene }        from './scenes/DevScene.js';

// ─── Stream G (Phase B) ───────────────────────────────────────────────────────
import { SaveLoadScene }   from './scenes/SaveLoadScene.js';
import { PauseMenuScene }  from './scenes/PauseMenuScene.js';

const scenes: Phaser.Types.Core.GameConfig['scene'] = [
  BootScene,
  PreloadScene,
  TitleScene,
  NameEntryScene,
  PrologueScene,
  NewBostonScene,
  SubwayScene,
  WorldMapScene,
  BattleScene,
  DialogueScene,
  SaveLoadScene,
  PauseMenuScene,
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

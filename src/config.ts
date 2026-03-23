import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { PreloadScene }    from './scenes/PreloadScene.js';
import { TitleScene }      from './scenes/TitleScene.js';
import { NameEntryScene }  from './scenes/NameEntryScene.js';
import { PrologueScene }   from './scenes/PrologueScene.js';
import { WorldMapScene }   from './scenes/WorldMapScene.js';
import { BattleScene }     from './scenes/BattleScene.js';
import { DialogueScene }   from './scenes/DialogueScene.js';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  pixelArt: true,
  resolution: window.devicePixelRatio || 1,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    NameEntryScene,
    PrologueScene,
    WorldMapScene,
    BattleScene,
    DialogueScene,
  ],
};

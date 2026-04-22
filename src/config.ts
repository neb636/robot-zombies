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

// ─── Stream G stubs (Phase B pre-stubbed, filled by Stream G) ─────────────
import { SaveLoadScene }   from './scenes/SaveLoadScene.js';
import { PauseMenuScene }  from './scenes/PauseMenuScene.js';

// ─── Stream A stubs (Phase B pre-stubbed, filled by Stream A) ─────────────
import { TradeScene }      from './scenes/TradeScene.js';
import { HuntingScene }    from './scenes/HuntingScene.js';

// ─── Chapter bundles — each chapter stream fills its own ──────────────────
import { CHAPTER1_SCENES } from './scenes/chapter1/index.js';
import { CHAPTER2_SCENES } from './scenes/chapter2/index.js';
import { CHAPTER3_SCENES } from './scenes/chapter3/index.js';
import { CHAPTER4_SCENES } from './scenes/chapter4/index.js';
import { CHAPTER5_SCENES } from './scenes/chapter5/index.js';

const coreScenes: Phaser.Types.Scenes.SceneType[] = [
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
  TradeScene,
  HuntingScene,
];

const chapterScenes: Phaser.Types.Scenes.SceneType[] = [
  ...CHAPTER1_SCENES,
  ...CHAPTER2_SCENES,
  ...CHAPTER3_SCENES,
  ...CHAPTER4_SCENES,
  ...CHAPTER5_SCENES,
];

const devScenes: Phaser.Types.Scenes.SceneType[] = import.meta.env.DEV
  ? [DevScene]
  : [];

const scenes: Phaser.Types.Scenes.SceneType[] = [
  ...coreScenes,
  ...chapterScenes,
  ...devScenes,
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

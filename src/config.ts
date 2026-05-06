import Phaser from 'phaser';
import { CORE_SCENES, DEV_SCENES } from './scenes/_core/index.js';
import { PROLOGUE_SCENES }         from './scenes/prologue/index.js';
import { CHAPTER1_SCENES } from './scenes/chapter1/index.js';
import { CHAPTER2_SCENES } from './scenes/chapter2/index.js';
import { CHAPTER3_SCENES } from './scenes/chapter3/index.js';
import { CHAPTER4_SCENES } from './scenes/chapter4/index.js';
import { CHAPTER5_SCENES } from './scenes/chapter5/index.js';

const scenes: Phaser.Types.Scenes.SceneType[] = [
  ...CORE_SCENES,
  ...PROLOGUE_SCENES,
  ...CHAPTER1_SCENES,
  ...CHAPTER2_SCENES,
  ...CHAPTER3_SCENES,
  ...CHAPTER4_SCENES,
  ...CHAPTER5_SCENES,
  ...(import.meta.env.DEV ? DEV_SCENES : []),
];

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
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
